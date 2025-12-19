import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { employeeSigningBonus } from './models/EmployeeSigningBonus.schema';
import { EmployeeTerminationResignation } from './models/EmployeeTerminationResignation.schema';
import { BonusStatus } from './enums/payroll-execution-enum';
import { BenefitStatus } from './enums/payroll-execution-enum';
import { EmployeeStatus, ContractType } from '../employee-profile/enums/employee-profile.enums';
import { Position, PositionDocument } from '../organization-structure/models/position.schema';


// payroll-execution/payroll-execution.service.ts
import { payrollRuns } from './models/payrollRuns.schema';
import { employeePayrollDetails } from './models/employeePayrollDetails.schema';

import { UpdatePayrollPeriodDto } from './dto/update-payroll-period.dto';
import { StartPayrollRunDto } from './dto/start-payroll-run.dto';
import { CreatePayrollRunDto } from './dto/create-payroll-run.dto';
import { Types } from 'mongoose';

import { PayRollPaymentStatus, PayRollStatus } from './enums/payroll-execution-enum';
import { EditExitBenefitsDto } from './dto/phase-0.dto';
import { signingBonusDocument } from '../payroll-configuration/models/signingBonus.schema';
import { terminationAndResignationBenefitsDocument } from '../payroll-configuration/models/terminationAndResignationBenefits';
import { ConfigStatus } from '../payroll-configuration/enums/payroll-configuration-enums';
import { signingBonus } from '../payroll-configuration/models/signingBonus.schema';
import { PayrollConfigurationService } from '../payroll-configuration/payroll-configuration.service';

@Injectable()
export class PayrollExecutionService {
    constructor(
    @InjectModel('employeeSigningBonus')
    private signingBonusModel: Model<any>,

    @InjectModel('EmployeeTerminationResignation')
    private exitBenefitsModel: Model<any>,

    @InjectModel(payrollRuns.name)
    private payrollRuns: Model<any>,

    @InjectModel('employeePayrollDetails')
    private payrollRunsModel: Model<any>,

    @InjectModel('EmployeeProfile')
    private employeeProfileModel: Model<any>,

    @InjectModel(Position.name)
    private positionModel: Model<PositionDocument>,

    @InjectModel(signingBonus.name)
    private signingBonusConfigModel: Model<signingBonusDocument>,

    @InjectModel('paySlip')
    private paySlipModel: Model<any>,

    private payrollConfigurationService: PayrollConfigurationService,
    ) {}


  // -------------------------------------------------
  // DATA FETCHING
  // -------------------------------------------------

  async getAllPayrollRuns() {
    const runs = await this.payrollRuns
      .find()
      .populate('payrollSpecialistId', 'firstName lastName')
      .populate('payrollManagerId', 'firstName lastName')
      .populate('financeStaffId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .lean();
    return runs;
  }

  async getPayrollRunById(id: string) {
    // Try to find by business runId first
    let run = await this.payrollRuns.findOne({ runId: id }).populate('payrollSpecialistId', 'firstName lastName').populate('payrollManagerId', 'firstName lastName').populate('financeStaffId', 'firstName lastName');
    
    // If not found and id looks like a MongoDB ObjectId, try by _id
    if (!run && Types.ObjectId.isValid(id)) {
      run = await this.payrollRuns.findById(id).populate('payrollSpecialistId', 'firstName lastName').populate('payrollManagerId', 'firstName lastName').populate('financeStaffId', 'firstName lastName');
    }
    
    if (!run) throw new NotFoundException('Payroll run not found');
    return run;
  }

  async getEmployeesByRunId(runId: string) {
    // First, find the payroll run by business runId to get its MongoDB _id
    const run = await this.payrollRuns.findOne({ runId });
    if (!run) throw new NotFoundException('Payroll run not found.');

    // Now query employee payroll details by the run's _id
    const employees = await this.payrollRunsModel.find({ payrollRunId: run._id }).populate('employeeId', 'firstName lastName email department');
    return employees;
  }

  async getPayslipsByRunId(runId: string) {
    // First, find the payroll run by business runId or MongoDB _id
    let run = await this.payrollRuns.findOne({ runId });
    if (!run && Types.ObjectId.isValid(runId)) {
      run = await this.payrollRuns.findById(runId);
    }
    if (!run) throw new NotFoundException('Payroll run not found.');

    // Now query payslips by the run's _id
    const payslips = await this.paySlipModel.find({ payrollRunId: run._id }).populate('employeeId', 'firstName lastName email department');
    return payslips;
  }

  //we need to get the new recurtes ids from the recruitment to assign them signing bonusses through their role 


  async getAllSigningBonuses() {
    const bonuses = await this.signingBonusModel.find().populate('employeeId', 'firstName lastName email').populate('signingBonusId', 'bonusName amount').sort({ createdAt: -1 });
    return bonuses;
  }

  async getAllExitBenefits() {
    const benefits = await this.exitBenefitsModel.find().populate('employeeId', 'firstName lastName email').populate('benefitId', 'benefitName benefitAmount').sort({ createdAt: -1 });
    return benefits;
  }

  // -------------------------------------------------
  // SIGNING BONUS
  // -------------------------------------------------

    async approveSigningBonus(id: string) {
   const bonus = await this.signingBonusModel.findById(id).populate('signingBonusId');

  if (!bonus) {
    throw new NotFoundException('Employee signing bonus not found');
  }

  // Check that the linked template is approved
  const template = bonus.signingBonusId as signingBonusDocument;
  if (template.status !== ConfigStatus.APPROVED) {
    throw new BadRequestException('Cannot approve employee bonus: signing bonus template is not approved');
  }

  // Only pending bonuses can be approved
  if (bonus.status !== BonusStatus.PENDING) {
    throw new BadRequestException('Only pending bonuses can be approved');
  }
    const employee = await this.employeeProfileModel.findById(bonus.employeeId);

  if (!employee) {
    throw new NotFoundException('Employee not found');
  }

  if (employee.status !== EmployeeStatus.ACTIVE) {
    throw new BadRequestException('Employee is not active');
  }

  // Approve the employee bonus
  bonus.status = BonusStatus.APPROVED;
  //bonus['approvedBy'] = approverId; // ApproverId will come from guard/user context later
  bonus['approvedAt'] = new Date();

  return bonus.save();
 }

    async rejectSigningBonus(id: string) {
    const bonus = await this.signingBonusModel.findById(id);

    if (!bonus) {
        throw new NotFoundException('Signing bonus not found');
    }
      if (bonus.status !== BonusStatus.PENDING) {
    throw new BadRequestException('Only pending bonuses can be rejected');
  }

    bonus.status = BonusStatus.REJECTED;


    return bonus.save();
    }

  async editSigningBonus(id: string, dto: any) {
  const bonus = await this.signingBonusModel.findById(id);

  if (!bonus) throw new NotFoundException('Signing bonus not found');

  // Update the actual employee amount
  if (dto.givenAmount !== undefined) {
    if (dto.givenAmount < 0) throw new BadRequestException('Amount cannot be negative');
    bonus.givenAmount = dto.givenAmount;
  }

  bonus.status = BonusStatus.PENDING;
  bonus.approvedBy = null;
  bonus.approvedAt = null;

  return bonus.save();
}


  // -------------------------------------------------
  // EXIT BENEFITS (RESIGNATION / TERMINATION)
  // -------------------------------------------------

    async approveExitBenefits(id: string) {
    const record = await this.exitBenefitsModel.findById(id).populate('benefitId');
    

    if (!record) {
        throw new NotFoundException('Exit benefits not found');
    }
      if (!record.benefitId) {
    throw new BadRequestException(
      'Cannot approve exit benefits: benefit template is missing'
    );
  }

  const template = record.benefitId as terminationAndResignationBenefitsDocument;
  if (template.status !== ConfigStatus.APPROVED) {
    throw new BadRequestException('Cannot approve exit benefits: template is not approved');
  }

  if (record.status !== BenefitStatus.PENDING) {
    throw new BadRequestException('Only pending benefits can be approved');
  }

    // You can ONLY update the status field
    record.status = BenefitStatus.APPROVED;

    return record.save();
    }


    async rejectExitBenefits(id: string) {
    const record = await this.exitBenefitsModel.findById(id);

    if (!record) {
        throw new NotFoundException('Exit benefits not found');
    }
    if (record.status !== BenefitStatus.PENDING) {
    throw new BadRequestException('Only pending benefits can be approved');
  }

    record.status = BenefitStatus.REJECTED;

    return record.save();
    }

  async editExitBenefits(id: string, dto: EditExitBenefitsDto) {
      // Find the employee exit benefit record
      const record = await this.exitBenefitsModel.findById(id);

      if (!record) {
          throw new NotFoundException('Exit benefits record not found');
      }

      // Update only employee-specific fields
      if (dto.amount !== undefined) {
          if (dto.amount < 0) throw new BadRequestException('Amount cannot be negative');
          record.givenAmount = dto.amount; // <-- update employee-specific amount
      }

      if (dto.notes !== undefined) {
          record.notes = dto.notes; // if you added a notes field to track manual terms
      }

      // Reset status to PENDING after edit
      record.status = BenefitStatus.PENDING;

      await record.save();

      return { record };
  }



  // -------------------------------------------------
  // PHASE 0 FINAL VALIDATION
  // -------------------------------------------------

    async validatePhase0() {
    const signingBonuses = await this.signingBonusModel.find();
    const exitBenefits = await this.exitBenefitsModel.find();

    const pending = [
        ...signingBonuses.filter(b => b.status == BonusStatus.PENDING),
        ...exitBenefits.filter(e => e.status == BenefitStatus.PENDING),
    ];

    if (pending.length > 0) {
        return {
        ready: false,
        pendingItems: pending,
        message: 'Phase 0 not completed. Some items are unmarked.',
        };
    }

    return {
        ready: true,
        message: 'Phase 0 completed, payroll can be initiated.',
    };
    }

  // ============================================================
  // Create Payroll Run
  // ============================================================
  async createPayrollRun(dto: CreatePayrollRunDto) {
    const { runId, entity, payrollPeriod, payrollSpecialistId } = dto;

    const existing = await this.payrollRuns.findOne({ runId });
    if (existing) {
      throw new BadRequestException('Run ID already exists. Choose a unique runId.');
    }

    if (!Types.ObjectId.isValid(payrollSpecialistId)) {
      throw new BadRequestException('Invalid payrollSpecialistId');
    }

    // Ensure creator exists
    const creator = await this.employeeProfileModel.findById(payrollSpecialistId);
    if (!creator) {
      throw new BadRequestException('Creator employee not found');
    }

    const periodDate = new Date(payrollPeriod);
    if (isNaN(periodDate.getTime())) {
      throw new BadRequestException('Invalid payrollPeriod date');
    }

    // Normalize to month-end and ensure not in the past (relative to current month-end)
    const normalizedPeriod = new Date(
      periodDate.getFullYear(),
      periodDate.getMonth() + 1,
      0
    );
    const now = new Date();
    const currentMonthEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0
    );
    if (normalizedPeriod < currentMonthEnd) {
      throw new BadRequestException(
        'Payroll period must be the end of the current month or a future month.'
      );
    }

    const doc = new this.payrollRuns({
      runId,
      entity,
      payrollPeriod: normalizedPeriod,
      status: PayRollStatus.DRAFT,
      employees: 0,
      exceptions: 0,
      totalnetpay: 0,
      payrollSpecialistId: new Types.ObjectId(payrollSpecialistId),
      // Initialize manager to creator to satisfy required field; can be reassigned in Phase 3
      payrollManagerId: new Types.ObjectId(payrollSpecialistId),
      paymentStatus: PayRollPaymentStatus.PENDING,
    });

    await doc.save();
    return { message: 'Payroll run created', payrollRun: doc };
  }

  // ============================================================
  // Requirement #2 – Edit Payroll Period (Phase 1)
  // ============================================================
  async updatePayrollPeriod(dto: UpdatePayrollPeriodDto) {
    const { payrollRunId, payrollPeriod } = dto;
    // Find by business runId (e.g., PR-2025-0001) instead of Mongo _id
    const run = await this.payrollRuns.findOne({ runId: payrollRunId });
    if (!run) throw new BadRequestException('Payroll run not found.');

    // Allow edits while the run is still in the early phases (draft/under review/rejected)
    const editableStatuses = [
      PayRollStatus.DRAFT,
      PayRollStatus.UNDER_REVIEW,
      PayRollStatus.REJECTED,
    ];

    if (!editableStatuses.includes(run.status as PayRollStatus)) {
      throw new BadRequestException(
        'Cannot update payroll period. Only draft or under-review payroll runs can be edited.',
      );
    }

    // Normalize to month-end and ensure not in the past (relative to current month-end)
    const incoming = new Date(payrollPeriod);
    if (isNaN(incoming.getTime())) {
      throw new BadRequestException('Invalid payrollPeriod date');
    }
    const normalizedPeriod = new Date(
      incoming.getFullYear(),
      incoming.getMonth() + 1,
      0
    );
    const now = new Date();
    const currentMonthEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0
    );
    if (normalizedPeriod < currentMonthEnd) {
      throw new BadRequestException(
        'Payroll period must be the end of the current month or a future month.'
      );
    }

    run.payrollPeriod = normalizedPeriod;
    await run.save();

    return {
      message: 'Payroll period updated successfully. Ready for frontend approval again.',
      payrollRun: run,
    };
  }

  // ============================================================
  // Requirement #3 – Start Automatic Payroll Initiation (Phase 1)
  // ============================================================
  async startPayrollInitiation(dto: StartPayrollRunDto) {
    const { payrollRunId, payrollSpecialistId } = dto;
    // Ensure we are querying the payrollRuns collection by business runId
    const run = await this.payrollRuns.findOne({ runId: payrollRunId });
    if (!run) throw new BadRequestException('Payroll run not found.');

    // Allow start when still in early phases
    const startableStatuses = [
      PayRollStatus.DRAFT,
      PayRollStatus.UNDER_REVIEW,
      PayRollStatus.REJECTED,
    ];

    if (!startableStatuses.includes(run.status as PayRollStatus)) {
      throw new BadRequestException(
        'Cannot start payroll initiation. Status must be draft/under review.',
      );
    }

    // Reset counters for Phase 1 (initial draft shell)
    run.employees = 0;
    run.totalnetpay = 0;
    run.exceptions = 0;

    // Set who initiated the run
    run.payrollSpecialistId = payrollSpecialistId as any;

    // Phase 1 = Create empty DRAFT
    run.status = PayRollStatus.DRAFT;
    run.paymentStatus = PayRollPaymentStatus.PENDING;

    await run.save();

    return {
      message: 'Payroll initiation started. Draft shell created. Ready for Phase 1.1.',
      payrollRun: run,
    };
  }

  // ============================================================
  // CREATE EMPLOYEE SIGNING BONUSES (Called by Recruitment on Hire)
  // ============================================================
  /**
   * Called by recruitment service when new employees are hired.
   * For each employee:
   * 1. Get employee profile (to retrieve position)
   * 2. Look up signing bonus config for that position
   * 3. Check if signing bonus config is APPROVED
   * 4. Create employee signing bonus record with status PENDING
   * 
   * These records appear in Phase 0 for Payroll Specialist to approve/reject/edit
   */
  async createEmployeeSigningBonuses(employeeIds: string[]) {
    if (!employeeIds || employeeIds.length === 0) {
      throw new BadRequestException('Employee IDs array is required and cannot be empty');
    }

    const createdBonuses: any[] = [];
    const failedEmployees: any[] = [];

    for (const employeeId of employeeIds) {
      try {
        // 1. Get employee profile to retrieve position
        const employee = await this.employeeProfileModel.findById(employeeId);
        if (!employee) {
          failedEmployees.push({
            employeeId,
            reason: 'Employee not found',
          });
          continue;
        }

        // Resolve position title from primaryPositionId (preferred) or legacy jobTitle/position
        let positionTitle: string | undefined = employee.jobTitle || employee.position;

        if (!positionTitle && employee.primaryPositionId) {
          const positionDoc = await this.positionModel.findById(employee.primaryPositionId).lean();
          positionTitle = positionDoc?.title;
        }

        if (!positionTitle) {
          failedEmployees.push({
            employeeId,
            reason: 'Employee has no position/job title assigned',
          });
          continue;
        }

        // 2. Look up signing bonus config for this position
        const signingBonusConfig = await this.signingBonusConfigModel.findOne({
          positionName: positionTitle,
        });

        if (!signingBonusConfig) {
          failedEmployees.push({
            employeeId,
            reason: `No signing bonus configuration found for position: ${positionTitle}`,
          });
          continue;
        }

        // 3. Check if signing bonus config is APPROVED
        if (signingBonusConfig.status !== ConfigStatus.APPROVED) {
          failedEmployees.push({
            employeeId,
            reason: `Signing bonus configuration for ${positionTitle} is not approved (status: ${signingBonusConfig.status})`,
          });
          continue;
        }

        // 4. Check if employee already has a signing bonus record
        const existingBonus = await this.signingBonusModel.findOne({
          employeeId: new Types.ObjectId(employeeId),
        });

        if (existingBonus) {
          failedEmployees.push({
            employeeId,
            reason: 'Employee already has a signing bonus record',
          });
          continue;
        }

        // 5. Create employee signing bonus record with status PENDING
        const newEmployeeBonus = await this.signingBonusModel.create({
          employeeId: new Types.ObjectId(employeeId),
          signingBonusId: signingBonusConfig._id,
          status: BonusStatus.PENDING,
        });

        createdBonuses.push({
          employeeId,
          bonusId: newEmployeeBonus._id,
          position: positionTitle,
          configuredAmount: signingBonusConfig.amount,
          status: BonusStatus.PENDING,
        });
      } catch (error) {
        failedEmployees.push({
          employeeId,
          reason: `Error processing employee: ${error.message}`,
        });
      }
    }

    return {
      message: 'Employee signing bonuses created for Phase 0 review',
      successCount: createdBonuses.length,
      failureCount: failedEmployees.length,
      created: createdBonuses,
      failed: failedEmployees,
    };
  }

}
