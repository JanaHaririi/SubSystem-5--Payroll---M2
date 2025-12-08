import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { payrollRuns } from './models/payrollRuns.schema';
import { employeePayrollDetails } from './models/employeePayrollDetails.schema';

import { PayRollStatus } from './enums/payroll-execution-enum';
import { GeneratePayrollDraftFileDto } from './dto/generate-payroll-draft-file.dto';

@Injectable()
export class PayrollPhase1_1CService {
  constructor(
    @InjectModel('payrollRuns')
    private payrollRunsModel: Model<payrollRuns>,

    @InjectModel('employeePayrollDetails')
    private payrollDetailsModel: Model<employeePayrollDetails>,
  ) {}

  // -----------------------------------------
  // PHASE 1.1.C - Generate Draft File (CSV/XLSX)
  // -----------------------------------------
  async generateDraftFile(dto: GeneratePayrollDraftFileDto) {
    const { payrollRunId, format = 'csv' } = dto;

    // 1) Validate payroll run
    const run = await this.payrollRunsModel.findById(payrollRunId);
    if (!run) throw new BadRequestException('Payroll run not found.');

    if (run.status !== PayRollStatus.UNDER_REVIEW) {
      throw new BadRequestException(
        'Draft file can only be generated while payroll is in UNDER_REVIEW status.',
      );
    }

    // 2) Fetch payroll employee details already created in 1.1.B
    const details = await this.payrollDetailsModel.find({ payrollRunId });

    if (!details.length) {
      throw new BadRequestException(
        'No payroll details found. Run Phase 1.1.B first.',
      );
    }

    // 3) Convert to file
    if (format === 'csv') {
      return this.generateCSV(details, run);
    }

    if (format === 'xlsx') {
      // Optional feature, but return placeholder for now
      return {
        message: 'XLSX export not implemented yet. Use CSV.',
      };
    }

    throw new BadRequestException('Unsupported file format.');
  }

  // -----------------------------------------
  // HELPER: Generate CSV file content
  // -----------------------------------------
  private generateCSV(details: any[], run: any) {
    const header = [
      'Employee ID',
      'Base Salary',
      'Allowances',
      'Deductions',
      'Net Salary',
      'Bonus',
      'Benefit',
      'Bank Status',
      'Exception',
    ];

    const rows = details.map((d) => [
      d.employeeId,
      d.baseSalary,
      d.allowances,
      d.deductions,
      d.netSalary,
      d.bonus,
      d.benefit,
      d.bankStatus,
      d.exceptions ?? '',
    ]);

    const csvString =
      header.join(',') +
      '\n' +
      rows.map((r) => r.join(',')).join('\n');

    return {
      message: 'Payroll draft CSV generated successfully.',
      payrollRunId: run._id,
      fileName: `payroll-draft-${run._id}.csv`,
      contentType: 'text/csv',
      data: csvString, // Frontend or backend can save it
    };
  }
}
