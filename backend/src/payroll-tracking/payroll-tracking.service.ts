import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

// Schemas
import { Claims } from './models/claims.schema';
import { disputes } from './models/disputes.schema';
import { refunds } from './models/refunds.schema';

// DTOs
import { CreateClaimDto } from './dto/create-claim.dto';
import { UpdateClaimStatusDto } from './dto/update-claim-status.dto';

import { CreateDisputeDto } from './dto/create-dispute.dto';
import { UpdateDisputeStatusDto } from './dto/update-dispute-status.dto';

import { CreateRefundDto } from './dto/create-refund.dto';
import { UpdateRefundStatusDto } from './dto/update-refund-status.dto';

// Enums
import {
  ClaimStatus,
  DisputeStatus,
  RefundStatus,
} from './enums/payroll-tracking-enum';

@Injectable()
export class PayrollTrackingService {
  constructor(
    @InjectModel(Claims.name) private readonly claimModel: Model<Claims>,
    @InjectModel(disputes.name) private readonly disputeModel: Model<disputes>,
    @InjectModel(refunds.name) private readonly refundModel: Model<refunds>,
  ) {}

  /* ============================================================
     CLAIMS
  ============================================================ */

  // Generate human-readable claimId like CLAIM-0001
  async generateClaimId(): Promise<string> {
    const count = await this.claimModel.countDocuments();
    const next = (count + 1).toString().padStart(4, '0');
    return `CLAIM-${next}`;
  }

  /** EMPLOYEE – get own claims by employeeId (ObjectId) */
  async getClaimsForEmployee(employeeId: string) {
    const objectId = new Types.ObjectId(employeeId);
    return this.claimModel.find({ employeeId: objectId }).exec();
  }

  async getClaimForEmployeeById(claimMongoId: string, employeeId: string) {
    const employeeObjectId = new Types.ObjectId(employeeId);
    return this.claimModel
      .findOne({ _id: claimMongoId, employeeId: employeeObjectId })
      .exec();
  }

  /** EMPLOYEE – create claim */
  async createClaim(dto: CreateClaimDto) {
    const employeeObjectId = new Types.ObjectId(dto.employeeId);
    const claimId = await this.generateClaimId();

    const created = new this.claimModel({
      claimId,
      description: dto.description,
      claimType: dto.claimType,
      amount: dto.amount,
      employeeId: employeeObjectId,
      status: ClaimStatus.UNDER_REVIEW,
    });

    return created.save();
  }

  /** PAYROLL SPECIALIST – list pending claims */
  async getPendingClaims() {
    return this.claimModel
      .find({ status: ClaimStatus.UNDER_REVIEW })
      .exec();
  }

  /** PAYROLL SPECIALIST – update claim status */
  async updateClaimStatus(
    claimMongoId: string,
    dto: UpdateClaimStatusDto,
  ) {
    return this.claimModel.findByIdAndUpdate(
      claimMongoId,
      {
        status: dto.status,
        resolutionComment: dto.resolutionComment,
        updatedAt: new Date(),
      },
      { new: true },
    );
  }

  /* ============================================================
     DISPUTES
  ============================================================ */

  /** EMPLOYEE – get own disputes */
  async getDisputesForEmployee(employeeId: string) {
    const objectId = new Types.ObjectId(employeeId);
    return this.disputeModel.find({ employeeId: objectId }).exec();
  }

  async getDisputeForEmployeeById(
    disputeMongoId: string,
    employeeId: string,
  ) {
    const employeeObjectId = new Types.ObjectId(employeeId);
    return this.disputeModel
      .findOne({ _id: disputeMongoId, employeeId: employeeObjectId })
      .exec();
  }

  /** EMPLOYEE – create dispute */
  async createDispute(dto: CreateDisputeDto) {
    const employeeObjectId = new Types.ObjectId(dto.employeeId);

    const created = new this.disputeModel({
      ...dto,
      employeeId: employeeObjectId,
      status: DisputeStatus.UNDER_REVIEW,
    });

    return created.save();
  }

  /** PAYROLL SPECIALIST – list pending disputes */
  async getPendingDisputes() {
    return this.disputeModel
      .find({ status: DisputeStatus.UNDER_REVIEW })
      .exec();
  }

  /** PAYROLL SPECIALIST – update dispute status */
  async updateDisputeStatus(
    disputeMongoId: string,
    dto: UpdateDisputeStatusDto,
  ) {
    return this.disputeModel.findByIdAndUpdate(
      disputeMongoId,
      {
        status: dto.status,
        resolutionComment: dto.resolutionComment,
        updatedAt: new Date(),
      },
      { new: true },
    );
  }

  /* ============================================================
     REFUNDS
  ============================================================ */

  /** FINANCE – create refund */
  async createRefund(dto: CreateRefundDto) {
    const employeeObjectId = new Types.ObjectId(dto.employeeId);

    const created = new this.refundModel({
      refundDetails: dto.refundDetails,
      employeeId: employeeObjectId,
      status: RefundStatus.PENDING,
    });

    return created.save();
  }

  /** FINANCE – update refund status */
  async updateRefundStatus(
    refundMongoId: string,
    dto: UpdateRefundStatusDto,
  ) {
    const updateData: any = {
      status: dto.status,
      updatedAt: new Date(),
    };

    if (dto.financeStaffId) {
      updateData.financeStaffId = new Types.ObjectId(dto.financeStaffId);
    }

    if (dto.paidInPayrollRunId) {
      updateData.paidInPayrollRunId = dto.paidInPayrollRunId;
    }

    return this.refundModel.findByIdAndUpdate(
      refundMongoId,
      updateData,
      { new: true },
    );
  }

  /** FINANCE – list all refunds */
  async getRefunds() {
    return this.refundModel.find().exec();
  }

  async getRefundById(refundMongoId: string) {
    return this.refundModel.findById(refundMongoId).exec();
  }
}
