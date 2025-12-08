import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { payrollRuns } from './models/payrollRuns.schema';
import { employeePayrollDetails } from './models/employeePayrollDetails.schema';
import { employeePenalties } from './models/employeePenalties.schema';
import { employeeSigningBonus } from './models/EmployeeSigningBonus.schema';
import { EmployeeTerminationResignation } from './models/EmployeeTerminationResignation.schema';

import { PayRollStatus, BonusStatus, BenefitStatus, BankStatus } from './enums/payroll-execution-enum';
import { GeneratePayrollDraftDto } from './dto/generate-payroll-draft.dto';
import { Phase1_1BDto } from './dto/phase-1-1B.dto';

@Injectable()
export class PayrollPhase1_1BService {
  constructor(
    @InjectModel('payrollRuns')
    private payrollRunsModel: Model<payrollRuns>,

    @InjectModel('EmployeeProfile')
    private employeeProfileModel: Model<any>,

    @InjectModel('employeePayrollDetails')
    private payrollDetailsModel: Model<employeePayrollDetails>,

    @InjectModel('employeePenalties')
    private penaltiesModel: Model<employeePenalties>,

    @InjectModel('employeeSigningBonus')
    private signingBonusModel: Model<employeeSigningBonus>,

    @InjectModel('EmployeeTerminationResignation')
    private exitBenefitsModel: Model<EmployeeTerminationResignation>,
  ) {}
    
  // -----------------------------------------
  // GENERATE PHASE 1.1.B DETAILS
  // -----------------------------------------
  async processPayrollValues(dto: GeneratePayrollDraftDto) {
    const { payrollRunId } = dto;

    // 1) Validate payroll run
    const run = await this.payrollRunsModel.findById(payrollRunId);
    if (!run) throw new BadRequestException('Payroll run not found.');

    if (run.status !== PayRollStatus.UNDER_REVIEW) {
      throw new BadRequestException(
        'Phase 1.1.B can only run after draft generation (status UNDER_REVIEW).',
      );
    }

    // 2) Fetch employees
    const employees = await this.employeeProfileModel.find({ contractStatus: 'active' });

    let totalNetPay = 0;
    let exceptions = 0;

    const details: any[] = [];

    // 3) Loop employees & compute salary components
    for (const emp of employees) {
      const baseSalary = emp.baseSalary ?? 0;
      const allowances = emp.allowancesTotal ?? 0;

      // A) Penalties
      const penaltyDoc = await this.penaltiesModel.findOne({ employeeId: emp._id });
      const penaltiesTotal =
        penaltyDoc?.penalties?.reduce((sum, p) => sum + (p.amount || 0), 0) ?? 0;

      // B) Signing Bonus (must be APPROVED)
      const bonusDoc = await this.signingBonusModel.findOne({ employeeId: emp._id });
      const bonusAmount =
        bonusDoc && bonusDoc.status === BonusStatus.APPROVED
          ? emp.signingBonusAmount ?? 0 // or from configuration if exists
          : 0;

      // C) Termination / resignation benefits (must be APPROVED)
      const exitDoc = await this.exitBenefitsModel.findOne({ employeeId: emp._id });
      const exitBenefitAmount =
        exitDoc && exitDoc.status === BenefitStatus.APPROVED
          ? emp.exitBenefitAmount ?? 0
          : 0;

      // D) Salary formula (no tax or insurance here)
      const gross = baseSalary + allowances + bonusAmount + exitBenefitAmount;
      const deductions = penaltiesTotal;
      const netPay = gross - deductions;

      totalNetPay += netPay;

      // Missing bank account → exception
      const hasBank = !!emp.bankAccount;
      const bankStatus = hasBank ? BankStatus.VALID : BankStatus.MISSING;

      details.push({
        employeeId: emp._id,
        baseSalary,
        allowances,
        deductions,
        netSalary: gross - deductions,
        netPay,
        bankStatus,
        exceptions: hasBank ? null : 'Missing bank account',
        bonus: bonusAmount,
        benefit: exitBenefitAmount,
        payrollRunId: run._id,
      });

      if (!hasBank) exceptions++;
    }

    // 4) Insert details into DB
    await this.payrollDetailsModel.insertMany(details);

    // 5) Update payroll run summary
    run.totalnetpay = totalNetPay;
    run.exceptions = exceptions;
    await run.save();

    return {
      message: 'Phase 1.1.B processed successfully.',
      employeesProcessed: employees.length,
      exceptions,
      totalNetPay,
    };
  }
  async applyPenalties(dto: Phase1_1BDto) {
    return this.processPayrollValues(dto);
  }
}
