// payroll-execution/phase4/payroll-phase4.service.ts

import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GeneratePayslipsDto } from './dto/generate-payslips.dto';
import { paySlip } from './models/payslip.schema';
import { employeePayrollDetails } from './models/employeePayrollDetails.schema';
import { payrollRuns } from './models/payrollRuns.schema';

import {
  PayRollStatus,
  PayRollPaymentStatus,
  PaySlipPaymentStatus,
} from './enums/payroll-execution-enum';

@Injectable()
export class PayrollPhase4Service {
  constructor(
    @InjectModel(paySlip.name)
    private payslipModel: Model<paySlip>,

    @InjectModel(employeePayrollDetails.name)
    private employeeDetailsModel: Model<employeePayrollDetails>,

    @InjectModel(payrollRuns.name)
    private payrollRunsModel: Model<payrollRuns>,
  ) {}

  async generatePayslips(dto: GeneratePayslipsDto) {
    const { payrollRunId } = dto;

    // 1. Validate payroll run
    // Accept either business runId (string like PR-2025-0009) or Mongo _id
    let run = await this.payrollRunsModel.findOne({ runId: payrollRunId });
    if (!run) {
      run = await this.payrollRunsModel.findById(payrollRunId);
    }
    if (!run) throw new BadRequestException('Payroll run not found.');

    // Business rules requirement:
    // Payslips generated only AFTER:
    // - Manager Lock (REQ-PY-7)
    // - Finance Approval (REQ-PY-15)
    if (run.status !== PayRollStatus.LOCKED) {
      throw new BadRequestException(
        'Payslips can only be generated after payroll run is LOCKED.',
      );
    }

    if (run.paymentStatus !== PayRollPaymentStatus.PAID) {
      throw new BadRequestException(
        'Payslips can only be generated after payroll disbursements are marked PAID.',
      );
    }

    // 2. Fetch employee payroll results
    const employeeRecords = await this.employeeDetailsModel.find({
      payrollRunId: run._id,
    });

    if (employeeRecords.length === 0) {
      throw new BadRequestException(
        'No employee payroll data found for this run.',
      );
    }

    const payslipResults: {
    employeeId: any;
    status: string;
    payslipId?: any;
    }[] = [];

    
    for (const rec of employeeRecords) {
      // Check if payslip already exists (avoid duplicates)
      const exists = await this.payslipModel.findOne({
        employeeId: rec.employeeId,
        payrollRunId: run._id,
      });

      if (exists) {
        payslipResults.push({
          employeeId: rec.employeeId,
          status: 'already_generated',
        });
        continue;
      }

      // 3. Create new payslip
      const payslip = await this.payslipModel.create({
        employeeId: rec.employeeId,
        payrollRunId: run._id,
        earningsDetails: {
          baseSalary: rec.baseSalary || 0,
          allowances: [],
          bonuses: [],
          benefits: [],
          refunds: [],
        },
        deductionsDetails: {
          taxes: [],
          insurances: [],
        },
        totalGrossSalary: (rec.baseSalary || 0) + (rec.allowances || 0),
        totaDeductions: rec.deductions || 0,
        netPay: rec.netPay || 0,
        paymentStatus: PaySlipPaymentStatus.PAID,
      });

      payslipResults.push({
        employeeId: rec.employeeId,
        status: 'generated',
        payslipId: payslip._id,
      });
    }

    return {
      message: 'Payslips generated successfully.',
      payrollRunId,
      payslipsGenerated: payslipResults.length,
      details: payslipResults,
    };
  }
}
