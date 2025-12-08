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


// payroll-execution/payroll-execution.service.ts
import { payrollRuns } from './models/payrollRuns.schema';
import { employeePayrollDetails } from './models/employeePayrollDetails.schema';

import { UpdatePayrollPeriodDto } from './dto/update-payroll-period.dto';
import { StartPayrollRunDto } from './dto/start-payroll-run.dto';

import { PayRollPaymentStatus, PayRollStatus } from './enums/payroll-execution-enum';
import { EditExitBenefitsDto } from './dto/phase-0.dto';
import { signingBonusDocument } from '../payroll-configuration/models/signingBonus.schema';
import { terminationAndResignationBenefitsDocument } from '../payroll-configuration/models/terminationAndResignationBenefits';
import{ConfigStatus} from'../payroll-configuration/enums/payroll-configuration-enums';
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
    ) {}


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
  // Requirement #2 – Edit Payroll Period (Phase 1)
  // ============================================================
  async updatePayrollPeriod(dto: UpdatePayrollPeriodDto) {
    const { payrollRunId, payrollPeriod } = dto;

    const run = await this.payrollRuns.findById(payrollRunId);
    if (!run) throw new BadRequestException('Payroll run not found.');

    if (run.status !== PayRollStatus.DRAFT) {
      throw new BadRequestException(
    'Cannot update payroll period. Only draft payroll runs can be edited.',
  );
}


    run.payrollPeriod = new Date(payrollPeriod);
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

    const run = await this.payrollRunsModel.findById(payrollRunId);
    if (!run) throw new BadRequestException('Payroll run not found.');

    // In your business rules: frontend handles approval workflow
    if (run.status !== PayRollStatus.DRAFT) {
      throw new BadRequestException(
        'Cannot start payroll initiation. Period must be approved by frontend and set to DRAFT.',
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

}
