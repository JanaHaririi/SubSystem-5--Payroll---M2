// payroll-execution/payroll-phase2.service.ts
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { employeePayrollDetails } from './models/employeePayrollDetails.schema';
import { payrollRuns } from './models/payrollRuns.schema';
import { EmployeeProfile as Employee } from '../employee-profile/models/employee-profile.schema';
import { PayRollStatus } from './enums/payroll-execution-enum';
import { ReviewPayrollDraftDto } from './dto/review-payroll-draft.dto';

@Injectable()
export class PayrollPhase2Service {
  private readonly logger = new Logger(PayrollPhase2Service.name);

  constructor(
    @InjectModel('employeePayrollDetails')
    private readonly detailsModel: Model<employeePayrollDetails>,

    @InjectModel(payrollRuns.name)
    private readonly payrollRunsModel: Model<payrollRuns>,

    @InjectModel(Employee.name)
    private readonly employeeModel: Model<any>,
  ) {}

  /**
   * Review payroll draft: run anomaly detection,
   * update employeePayrollDetails.exceptions, update run counters and status.
   */
  async reviewPayrollDraft(dto: ReviewPayrollDraftDto) {
    const { payrollRunId, payrollSpecialistId, spikeThreshold = 1.5 } = dto;

    if (!payrollRunId) throw new BadRequestException('payrollRunId is required.');

    const runIdObj = Types.ObjectId.isValid(payrollRunId)
      ? new Types.ObjectId(payrollRunId)
      : null;
    if (!runIdObj) throw new BadRequestException('Invalid payrollRunId.');

    const run = await this.payrollrollFindByIdSafe(runIdObj);
    if (!run) throw new BadRequestException('Payroll run not found.');

    // Fetch all payroll detail records for this run
    const details = await this.detailsModel.find({ payrollRunId: run._id }).lean();

    if (!details || details.length === 0) {
      // Nothing to review, but mark run accordingly
      run.exceptions = 0;
      run.status = PayRollStatus.UNDER_REVIEW;
      await run.save();
      return {
        message: 'No employee payroll details found for this run. Marked as UNDER_REVIEW.',
        employeesProcessed: 0,
        exceptionsCount: 0,
      };
    }

    // Prepare bulk updates
    const bulkOps: any[] = [];
    let exceptionsCount = 0;
    let totalNetPay = 0;

    // We'll look up previous payroll detail per employee to detect spikes
    for (const det of details) {
      const reasons: string[] = [];

      // bank status check: if bankStatus missing or falsy or equals string 'missing'
      if (!det.bankStatus || det.bankStatus.toString().toLowerCase() === 'missing') {
        reasons.push('Missing bank account');
      }

      // negative net pay
      if (typeof det.netPay === 'number' && det.netPay < 0) {
        reasons.push('Negative net pay');
      }

      // zero gross check: gross = baseSalary + allowances
      const baseSalary = Number(det.baseSalary ?? 0);
      const allowances = Number(det.allowances ?? 0);
      const gross = baseSalary + allowances;
      if (gross === 0) {
        reasons.push('Zero gross salary');
      }

      // spike detection vs previous run for the same employee
      let spikeFlag = false;
      try {
        const prev = await this.detailsModel
          .findOne({ employeeId: det.employeeId, payrollRunId: { $ne: run._id } })
          .sort({ createdAt: -1 })
          .lean();

        if (prev && typeof prev.netPay === 'number' && prev.netPay > 0 && typeof det.netPay === 'number') {
          const ratio = det.netPay / prev.netPay;
          if (ratio >= spikeThreshold) {
            spikeFlag = true;
            reasons.push(`Net pay spike (x${ratio.toFixed(2)}) vs last run`);
          }
        }
      } catch (err) {
        // don't fail the whole loop on lookup error; log and continue
        this.logger.warn(`Failed to lookup previous payroll detail for employee ${det.employeeId}: ${err.message}`);
      }

      // Add any custom business rule checks here
      // e.g. extremely large penalties relative to salary, missing deductions details, etc.

      const exceptionText = reasons.length ? reasons.join('; ') : null;
      if (exceptionText) exceptionsCount++;

      totalNetPay += Number(det.netPay ?? 0);

      // create bulk update op
      bulkOps.push({
        updateOne: {
          filter: { _id: det._id },
          update: {
            $set: {
              exceptions: exceptionText,
              bankStatus: det.bankStatus ?? (exceptionText?.includes('Missing bank account') ? 'missing' : det.bankStatus),
            },
          },
        },
      });
    } // end for each detail

    // Execute bulk updates (if any)
    if (bulkOps.length > 0) {
      await this.detailsModel.bulkWrite(bulkOps);
    }

    // Update payroll run summary
    run.exceptions = exceptionsCount;
    run.totalnetpay = totalNetPay;
    run.status = PayRollStatus.UNDER_REVIEW;
    if (payrollSpecialistId && Types.ObjectId.isValid(payrollSpecialistId)) {
      run.payrollSpecialistId = new Types.ObjectId(payrollSpecialistId) as any;
    }
    await run.save();

    return {
      message: 'Payroll draft reviewed. Exceptions flagged where applicable.',
      payrollRunId: run._id,
      employeesProcessed: details.length,
      exceptionsCount,
      totalNetPay,
    };
  }

  // small helper wrapper to support the name consistency and potential error handling
  private async payrollrollFindByIdSafe(id: Types.ObjectId) {
    // method intentionally separated for easier future transaction wrap
    return this.payrollRunsModel.findById(id);
  }
}
