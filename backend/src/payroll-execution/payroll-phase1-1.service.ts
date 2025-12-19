import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { payrollRuns } from './models/payrollRuns.schema';
import { employeePayrollDetails } from './models/employeePayrollDetails.schema';
import { PayRollStatus, BonusStatus, BenefitStatus, BankStatus } from './enums/payroll-execution-enum';

import { GeneratePayrollDraftDto } from './dto/generate-payroll-draft.dto';
import { employeeSigningBonus } from './models/EmployeeSigningBonus.schema';
import { EmployeeTerminationResignation } from './models/EmployeeTerminationResignation.schema';
import { employeePenalties } from './models/employeePenalties.schema';
import { signingBonus } from '../payroll-configuration/models/signingBonus.schema';
import { terminationAndResignationBenefits } from '../payroll-configuration/models/terminationAndResignationBenefits';
import { payGrade, payGradeDocument } from '../payroll-configuration/models/payGrades.schema';
import { taxRules, taxRulesDocument } from '../payroll-configuration/models/taxRules.schema';
import { insuranceBrackets, insuranceBracketsDocument } from '../payroll-configuration/models/insuranceBrackets.schema';
import { allowance, allowanceDocument } from '../payroll-configuration/models/allowance.schema';
import { ConfigStatus } from '../payroll-configuration/enums/payroll-configuration-enums';
import { SalaryCalculationService } from './services/salary-calculation.service';

@Injectable()
export class PayrollPhase1_1Service {
  constructor(
    @InjectModel('payrollRuns')
    private payrollRunsModel: Model<payrollRuns>,

    @InjectModel('employeePayrollDetails')
    private employeeDetailsModel: Model<employeePayrollDetails>,

    @InjectModel('EmployeeProfile')
    private employeeProfileModel: Model<any>,

    @InjectModel('employeeSigningBonus')
    private signingBonusModel: Model<employeeSigningBonus>,

    @InjectModel('EmployeeTerminationResignation')
    private exitBenefitsModel: Model<EmployeeTerminationResignation>,

    @InjectModel('employeePenalties')
    private penaltiesModel: Model<employeePenalties>,

    @InjectModel(signingBonus.name)
    private signingBonusConfigModel: Model<any>,

    @InjectModel(terminationAndResignationBenefits.name)
    private benefitsConfigModel: Model<any>,

    @InjectModel(payGrade.name)
    private payGradeModel: Model<payGradeDocument>,

    @InjectModel(taxRules.name)
    private taxRulesModel: Model<taxRulesDocument>,

    @InjectModel(insuranceBrackets.name)
    private insuranceBracketsModel: Model<insuranceBracketsDocument>,

    @InjectModel(allowance.name)
    private allowanceModel: Model<allowanceDocument>,

    private salaryCalculationService: SalaryCalculationService,
  ) {}

  async generatePayrollDraft(dto: GeneratePayrollDraftDto) {
    const { payrollRunId, payrollSpecialistId } = dto;

    // 1. Validate payroll run - find by business runId first
    const run = await this.payrollRunsModel.findOne({ runId: payrollRunId });
    if (!run) throw new BadRequestException('Payroll run not found.');

    if (run.status !== PayRollStatus.DRAFT) {
      throw new BadRequestException(
        'Payroll draft can only be generated when payroll run is in DRAFT status.',
      );
    }

    // 2. DELETE any existing payroll details for this run (prevent duplicates)
    await this.employeeDetailsModel.deleteMany({ payrollRunId: run._id });

    // 3. Fetch ALL active employees in the company
    // Entity field in payroll run is for reference/documentation only, not for filtering
    const employees = await this.employeeProfileModel.find({ 
      status: 'ACTIVE'
    });

    if (!employees.length) {
      throw new BadRequestException(`No active employees found in the system`);
    }

    let totalNetPay = 0;
    let exceptionsCount = 0;
    const detailsArray: Array<{
      employeeId: any;
      baseSalary: number;
      allowances: number;
      grossSalary: number;
      tax: number;
      insurance: number;
      penalties: number;
      deductions: number;
      netSalary: number;
      netPay: number;
      bonus: number;
      benefit: number;
      bankStatus: string;
      exceptions: string | null;
      payrollRunId: any;
    }> = [];

    // 4. Process each employee with COMPLETE calculation
    for (const emp of employees) {
      // Contract validation
      if (['EXPIRED', 'INACTIVE', 'SUSPENDED'].includes(emp.status)) {
        exceptionsCount++;
        detailsArray.push({
          employeeId: emp._id,
          baseSalary: 0,
          allowances: 0,
          grossSalary: 0,
          tax: 0,
          insurance: 0,
          penalties: 0,
          deductions: 0,
          netSalary: 0,
          netPay: 0,
          bonus: 0,
          benefit: 0,
          bankStatus: 'missing',
          exceptions: 'Contract inactive or invalid',
          payrollRunId: run._id,
        });
        continue;
      }

      // ==============================
      // FETCH PAY GRADE & SALARY
      // ==============================
      let baseSalary = 0;
      
      // Calculate allowances dynamically from approved allowance configurations
      const approvedAllowances = await this.allowanceModel.find({ status: ConfigStatus.APPROVED }).exec();
      let allowances = 0;
      for (const allowanceConfig of approvedAllowances) {
        allowances += allowanceConfig.amount;
      }
      
      if (emp.payGradeId) {
        const grade = await this.payGradeModel.findById(emp.payGradeId);
        if (grade) {
          baseSalary = grade.baseSalary ?? 0;
        } else {
          // payGradeId exists but grade not found - exception
          exceptionsCount++;
          detailsArray.push({
            employeeId: emp._id,
            baseSalary: 0,
            allowances: 0,
            grossSalary: 0,
            tax: 0,
            insurance: 0,
            penalties: 0,
            deductions: 0,
            netSalary: 0,
            netPay: 0,
            bonus: 0,
            benefit: 0,
            bankStatus: 'missing',
            exceptions: 'Pay grade not found for employee',
            payrollRunId: run._id,
          });
          continue;
        }
      } else {
        // No payGrade assigned - exception
        exceptionsCount++;
        detailsArray.push({
          employeeId: emp._id,
          baseSalary: 0,
          allowances: 0,
          grossSalary: 0,
          tax: 0,
          insurance: 0,
          penalties: 0,
          deductions: 0,
          netSalary: 0,
          netPay: 0,
          bonus: 0,
          benefit: 0,
          bankStatus: 'missing',
          exceptions: 'No pay grade assigned to employee',
          payrollRunId: run._id,
        });
        continue;
      }

      // ==============================
      // PRORATION: Mid-month hires or terminations
      // ==============================
      const totalDaysInMonth = new Date(run.payrollPeriod.getFullYear(), run.payrollPeriod.getMonth() + 1, 0).getDate();
      const activeDays = this.calculateActiveDaysInPeriod(emp, run.payrollPeriod);
      
      // Apply proration if employee didn't work the full month
      let prorationFactor = 1;
      if (activeDays < totalDaysInMonth) {
        prorationFactor = activeDays / totalDaysInMonth;
        baseSalary = baseSalary * prorationFactor;
        allowances = allowances * prorationFactor;
      }

      // ==============================
      // A, B, C) BONUSES AND BENEFITS (fetch for net pay calculation)
      // Only included if APPROVED in Phase 0
      // ==============================
      // B) SIGNING BONUS (must be APPROVED by Specialist in Phase 0)
      // ==============================
      const bonusDoc = await this.signingBonusModel.findOne({ employeeId: emp._id });
      let bonusAmount = 0;
      if (bonusDoc && bonusDoc.status === BonusStatus.APPROVED) {
        // Only include if employee has a bonus AND it's approved
        // Read configured amount from signing bonus template
        const config = await this.signingBonusConfigModel.findById(bonusDoc.signingBonusId);
        bonusAmount = config?.amount ?? 0;
      }

      // ==============================
      // C) EXIT/TERMINATION BENEFITS (must be APPROVED by Specialist in Phase 0)
      // ==============================
      const exitDoc = await this.exitBenefitsModel.findOne({ employeeId: emp._id });
      let exitBenefitAmount = 0;
      if (exitDoc && exitDoc.status === BenefitStatus.APPROVED) {
        // Only include if employee has exit benefits AND they're approved
        // Read configured amount from termination/resignation benefit template
        const config = await this.benefitsConfigModel.findById(exitDoc.benefitId);
        exitBenefitAmount = config?.amount ?? 0;
      }

      // ==============================
      // D) COMPLETE SALARY FORMULA WITH NETPAY CALCULATION
      // Uses SalaryCalculationService for comprehensive calculations:
      // - Time Management inputs (working hours, OT, missing hours)
      // - Leaves inputs (paid/unpaid leaves)
      // - Penalties, taxes, insurance
      // - Refunds (if available)
      // ==============================
      const salaryCalcResult = await this.salaryCalculationService.calculateNetPay(
        emp._id,
        run.payrollPeriod,
        baseSalary,
        allowances,
        bonusAmount,
        exitBenefitAmount,
      );

      const {
        grossSalary: gross,
        penalties: penaltiesBreakdown,
        deductions: deductionsBreakdown,
        netSalary,
        netPay,
      } = salaryCalcResult;

      // Calculate totals from the comprehensive breakdown
      const penaltiesTotal = penaltiesBreakdown.totalPenalties;
      const tax = deductionsBreakdown.taxTotal;
      const insurance = deductionsBreakdown.insuranceTotal;
      const deductions = deductionsBreakdown.totalDeductions;

      totalNetPay += netPay;

      // Bank account check (employee must have both bankName and bankAccountNumber)
      const hasBankDetails = emp.bankName && emp.bankAccountNumber;
      const bankStatus = hasBankDetails ? BankStatus.VALID : BankStatus.MISSING;
      const exceptions = hasBankDetails ? null : 'Missing bank details (name and/or account number)';
      
      if (!hasBankDetails) exceptionsCount++;

      detailsArray.push({
        employeeId: emp._id,
        baseSalary,
        allowances,
        grossSalary: gross,
        tax,
        insurance,
        penalties: penaltiesTotal,
        deductions,
        netSalary,
        netPay,
        bonus: bonusAmount,
        benefit: exitBenefitAmount,
        bankStatus,
        exceptions,
        payrollRunId: run._id,
      });
    }

    // 5. Save all employee details
    // ✅ ALL details created in ONE operation with complete formula
    await this.employeeDetailsModel.insertMany(detailsArray);

    // 6. Update payroll run summary
    run.employees = employees.length;
    run.exceptions = exceptionsCount;
    run.totalnetpay = totalNetPay;
    run.status = PayRollStatus.DRAFT;
    
    await run.save();

    return {
      message: 'Payroll draft generated successfully. Complete salary calculations done.',
      employeesProcessed: employees.length,
      exceptions: exceptionsCount,
      totalNetPay,
      runStatus: run.status,
    };
  }

  /**
   * Calculate how many days an employee worked in the payroll period
   * Used for proration of mid-month hires and terminations
   */
  private calculateActiveDaysInPeriod(employee: any, payrollPeriod: Date): number {
    const periodEnd = new Date(payrollPeriod);
    const periodStart = new Date(periodEnd.getFullYear(), periodEnd.getMonth(), 1);
    const totalDaysInMonth = new Date(periodEnd.getFullYear(), periodEnd.getMonth() + 1, 0).getDate();

    let workStartDate = periodStart;
    let workEndDate = periodEnd;

    // If hired mid-month, start counting from contract start date
    if (employee.contractStartDate) {
      const contractStart = new Date(employee.contractStartDate);
      // Only apply if hired in this payroll period month
      if (contractStart.getMonth() === periodEnd.getMonth() && 
          contractStart.getFullYear() === periodEnd.getFullYear() &&
          contractStart > periodStart) {
        workStartDate = contractStart;
      }
    }

    // If terminated mid-month, end counting at termination date
    if (employee.status === 'TERMINATED' && employee.terminationDate) {
      const termDate = new Date(employee.terminationDate);
      // Only apply if terminated in this payroll period month
      if (termDate.getMonth() === periodEnd.getMonth() && 
          termDate.getFullYear() === periodEnd.getFullYear() &&
          termDate < periodEnd) {
        workEndDate = termDate;
      }
    }

    // Calculate days worked (inclusive)
    const msPerDay = 24 * 60 * 60 * 1000;
    const daysWorked = Math.ceil((workEndDate.getTime() - workStartDate.getTime()) / msPerDay) + 1;

    return Math.max(0, Math.min(daysWorked, totalDaysInMonth));
  }
}
