import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { payrollRuns } from './models/payrollRuns.schema';
import { ProcessHREventsDto } from './dto/process-hr-events.dto';

import { employeeSigningBonus } from './models/EmployeeSigningBonus.schema';
import { EmployeeTerminationResignation } from './models/EmployeeTerminationResignation.schema';
import { terminationAndResignationBenefits } from './../payroll-configuration/models/terminationAndResignationBenefits';

import {
  BenefitStatus,
  BonusStatus,
  PayRollStatus,
} from './enums/payroll-execution-enum';

@Injectable()
export class PayrollPhase1_1AService {
  constructor(
    @InjectModel('payrollRuns')
    private payrollRunsModel: Model<payrollRuns>,

    @InjectModel('EmployeeProfile')
    private employeeProfileModel: Model<any>,

    @InjectModel('employeeSigningBonus')
    private signingBonusModel: Model<employeeSigningBonus>,

    @InjectModel('EmployeeTerminationResignation')
    private exitBenefitsModel: Model<EmployeeTerminationResignation>,

    @InjectModel('terminationAndResignationBenefits')
    private benefitsConfigModel: Model<terminationAndResignationBenefits>,
  ) {}

  // -----------------------------------------
  // MAIN PROCESSING FUNCTION
  // -----------------------------------------
  async processHREvents(dto: ProcessHREventsDto) {
    const { payrollRunId } = dto;

    // 1) Validate payroll run
    const run = await this.payrollRunsModel.findById(payrollRunId);
    if (!run) throw new BadRequestException('Payroll run not found.');

    if (run.status !== PayRollStatus.DRAFT) {
      throw new BadRequestException(
        'HR Events can only be processed while payroll is in DRAFT state.',
      );
    }

    // 2) Fetch employees
    const employees = await this.employeeProfileModel.find({});

    let signingBonusProcessed = 0;
    let exitBenefitsProcessed = 0;
    let proratedEmployees = 0;

    const exitBenefitsResponse: {
      employeeId: any;
      benefitId: any;
      terminationId: any;
      computedAmount: number;
      ruleApplied: string | undefined;
    }[] = [];

    // 3) Loop employees & process events
    for (const emp of employees) {
      // A) PROBATION → PRORATED
      if (emp.isNewHire && emp.onProbation) {
        proratedEmployees++;
      }

      // B) SIGNING BONUS AUTO APPROVAL
      const bonus = await this.signingBonusModel.findOne({
        employeeId: emp._id,
      });

      if (
        bonus &&
        emp.eligibleForBonus &&
        bonus.status === BonusStatus.PENDING
      ) {
        bonus.status = BonusStatus.APPROVED;
        await bonus.save();
        signingBonusProcessed++;
      }

      // C) TERMINATION / RESIGNATION BENEFITS
      const exit = await this.exitBenefitsModel.findOne({
        employeeId: emp._id,
      });

      if (exit && exit.status === BenefitStatus.PENDING) {
        // Fetch rule configuration
        const config = await this.benefitsConfigModel.findById(exit.benefitId);

        // Calculation based on schema:
        // THERE IS ONLY `amount`, no multiplier/percentage/etc.
        const computed = config?.amount ?? 0;

        // Only field allowed to change in DB is status
        exit.status = BenefitStatus.APPROVED;
        await exit.save();

        exitBenefitsProcessed++;

        // Return in API, not stored in DB
        exitBenefitsResponse.push({
          employeeId: emp._id,
          benefitId: exit.benefitId,
          terminationId: exit.terminationId,
          computedAmount: computed,
          ruleApplied: config?.name, // <- FIX HERE
        });
      }
    }

    return {
      message: 'HR Events processed successfully.',
      summary: {
        employeesChecked: employees.length,
        proratedEmployees,
        signingBonusProcessed,
        exitBenefitsProcessed,
      },
      exitBenefitsDetails: exitBenefitsResponse,
    };
  }

  // -----------------------------------------
  // HELPER: Proration (kept for future)
  // -----------------------------------------
  private calculateProrated(emp: any) {
    const base = emp.baseSalary ?? 0;
    const totalDays = 30;
    const activeDays = emp.activeDaysInPeriod ?? totalDays;
    return (base * activeDays) / totalDays;
  }
}
