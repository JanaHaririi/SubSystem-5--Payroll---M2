import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

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

    // 1) Validate payroll run (accept business runId or Mongo _id)
    let run = await this.payrollRunsModel.findOne({ runId: payrollRunId });
    if (!run && Types.ObjectId.isValid(payrollRunId)) {
      run = await this.payrollRunsModel.findById(payrollRunId);
    }
    if (!run) throw new BadRequestException('Payroll run not found.');

    if (run.status !== PayRollStatus.DRAFT) {
      throw new BadRequestException(
        'HR Events can only be processed while payroll is in DRAFT state.',
      );
    }

    // 2) Fetch ALL active employees in the company
    // Payroll runs apply to the entire company, not filtered by entity
    const employees = await this.employeeProfileModel.find({
      status: 'ACTIVE'
    });

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

      // B) DETECT SIGNING BONUS (only count, do NOT auto-approve)
      // Phase 0 is where Specialist manually approves; this phase just detects new hires
      const bonus = await this.signingBonusModel.findOne({
        employeeId: emp._id,
      });

      if (bonus && emp.isNewHire && emp.eligibleForBonus) {
        // Just flag it as detected; Specialist will approve in Phase 0
        // If already APPROVED by Specialist, it will be included in Phase 1.1 draft
        if (bonus.status === BonusStatus.PENDING) {
          signingBonusProcessed++; // count pending detections for reporting
        }
      }

      // C) DETECT TERMINATION/RESIGNATION BENEFITS (only count, do NOT auto-approve)
      // Phase 0 is where Specialist manually approves; this phase detects terminations
      const exit = await this.exitBenefitsModel.findOne({
        employeeId: emp._id,
      });

      if (exit && emp.terminationDate) {
        // Just flag it as detected; Specialist will approve in Phase 0
        if (exit.status === BenefitStatus.PENDING) {
          const config = await this.benefitsConfigModel.findById(exit.benefitId);
          const computed = config?.amount ?? 0;
          exitBenefitsProcessed++; // count pending detections for reporting

          // Return in API for Specialist visibility, not stored in DB
          exitBenefitsResponse.push({
            employeeId: emp._id,
            benefitId: exit.benefitId,
            terminationId: exit.terminationId,
            computedAmount: computed,
            ruleApplied: config?.name,
          });
        }
      }
    }

    return {
      message: 'HR Events detected. Specialist must review and approve in Phase 0 before amounts are included in payroll.',
      summary: {
        employeesChecked: employees.length,
        proratedEmployees,
        newHireSigningBonusesPending: signingBonusProcessed,
        terminationBenefitsPending: exitBenefitsProcessed,
      },
      detectedExitBenefits: exitBenefitsResponse,
    };
  }

  // -----------------------------------------
  // HELPER: Proration (kept for future)
  // -----------------------------------------
  private async calculateProrated(emp: any) {
    // Fetch pay grade to get correct base salary
    const payGradeId = emp.payGradeId;
    let base = 0;
    
    if (payGradeId) {
      // Import payGrade model or fetch it - for now we note this needs payGradeModel injection
      // const grade = await this.payGradeModel.findById(payGradeId);
      // base = grade?.baseSalary ?? 0;
      base = 0; // TODO: Inject payGradeModel to fetch actual salary
    }
    
    const totalDays = 30;
    const activeDays = emp.activeDaysInPeriod ?? totalDays;
    return (base * activeDays) / totalDays;
  }
}
