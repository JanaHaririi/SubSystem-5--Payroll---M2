import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { payrollRuns } from './models/payrollRuns.schema';
import { employeePayrollDetails } from './models/employeePayrollDetails.schema';
import { PayRollStatus } from './enums/payroll-execution-enum';

import { GeneratePayrollDraftDto } from './dto/generate-payroll-draft.dto';

@Injectable()
export class PayrollPhase1_1Service {
  constructor(
    @InjectModel('payrollRuns')
    private payrollRunsModel: Model<payrollRuns>,

    @InjectModel('employeePayrollDetails')
    private employeeDetailsModel: Model<employeePayrollDetails>,

    @InjectModel('EmployeeProfile')
    private employeeProfileModel: Model<any>, // You may adjust the type later
  ) {}

  async generatePayrollDraft(dto: GeneratePayrollDraftDto) {
    const { payrollRunId, payrollSpecialistId } = dto;

    // 1. Validate payroll run
    const run = await this.payrollRunsModel.findById(payrollRunId);
    if (!run) throw new BadRequestException('Payroll run not found.');

    if (run.status !== PayRollStatus.DRAFT) {
      throw new BadRequestException(
        'Payroll draft can only be generated when payroll run is in DRAFT status.',
      );
    }

    // 2. Fetch employees for this payroll area
    const employees = await this.employeeProfileModel.find({ contractStatus: 'active' });

    if (!employees.length) {
      throw new BadRequestException('No active employees found for payroll.');
    }

    let totalNetPay = 0;
    let exceptionsCount = 0;
    const detailsArray: Array<{
      employeeId: any;
      baseSalary: number;
      allowances: number;
      deductions: number;
      netSalary: number;
      netPay: number;
      bankStatus: string;
      exceptions: string | null;
      payrollRunId: any;
    }> = [];

    for (const emp of employees) {
      let baseSalary = emp.baseSalary ?? 0;
      let allowances = emp.allowancesTotal ?? 0;

      // Basic validation
      if (['expired', 'inactive', 'suspended'].includes(emp.contractStatus)) {
        exceptionsCount++;
        detailsArray.push({
          employeeId: emp._id,
          baseSalary: 0,
          allowances: 0,
          deductions: 0,
          netSalary: 0,
          netPay: 0,
          bankStatus: 'missing',
          exceptions: 'Contract inactive or invalid',
          payrollRunId: run._id,
        });
        continue;
      }

      // ================
      // Salary Formula
      // ================
      const tax = baseSalary * 0.10;
      const insurance = baseSalary * 0.05;
      const penalty = emp.penaltiesTotal ?? 0;

      const gross = baseSalary + allowances;
      const deductions = tax + insurance + penalty;
      const netSalary = gross - deductions;
      const netPay = netSalary;

      totalNetPay += netPay;

      detailsArray.push({
        employeeId: emp._id,
        baseSalary,
        allowances,
        deductions,
        netSalary,
        netPay,
        bankStatus: emp.bankAccount ? 'valid' : 'missing',
        exceptions: emp.bankAccount ? null : 'Missing bank account',
        payrollRunId: run._id,
      });
    }

    // 3. Save all employee details
    await this.employeeDetailsModel.insertMany(detailsArray);

    // 4. Update payroll run summary
    run.employees = employees.length;
    run.exceptions = exceptionsCount;
    run.totalnetpay = totalNetPay;
    run.status = PayRollStatus.UNDER_REVIEW;
    // Cast to any to avoid TypeScript mismatch between different ObjectId types
    run.payrollSpecialistId = payrollSpecialistId ? (new Types.ObjectId(payrollSpecialistId) as any) : undefined;
    await run.save();

    return {
      message: 'Payroll draft generated successfully.',
      employeesProcessed: employees.length,
      exceptions: exceptionsCount,
      totalNetPay,
      runStatus: run.status,
    };
  }
}
