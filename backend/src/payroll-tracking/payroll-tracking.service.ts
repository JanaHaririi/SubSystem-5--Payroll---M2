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

import { CreateRefundDto, UpdateRefundStatusDto } from './dto/create-refund.dto';

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

  // ======================================================
  // CLAIMS
  // ======================================================

  // Generate human-readable claimId like CLAIM-0001
  async generateClaimId(): Promise<string> {
    const count = await this.claimModel.countDocuments();
    const next = (count + 1).toString().padStart(4, '0');
    return `CLAIM-${next}`;
  }

  async getClaimsForEmployee(employeeId: string) {
    // employeeId in DB is ObjectId
    const objectId = new Types.ObjectId(employeeId);
    return this.claimModel.find({ employeeId: objectId }).exec();
  }

  async createClaim(dto: CreateClaimDto) {
    // If your DTO has employeeId as string, this converts it to ObjectId
    const objectId = new Types.ObjectId(dto.employeeId);

    const claimId = await this.generateClaimId();

    const created = new this.claimModel({
      claimId,
      description: dto.description,
      claimType: dto.claimType,
      amount: dto.amount,
      employeeId: objectId,
      status: ClaimStatus.UNDER_REVIEW,
    });

    return created.save();
  }

  async getPendingClaims() {
    return this.claimModel
      .find({ status: ClaimStatus.UNDER_REVIEW })
      .exec();
  }

  async updateClaimStatus(
    claimMongoId: string,
    dto: UpdateClaimStatusDto,
  ) {
    // ONLY use fields that exist on UpdateClaimStatusDto:
    // - dto.status
    // - dto.resolutionComment (we assume this exists since no TS error)
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

  // ======================================================
  // DISPUTES
  // ======================================================

  async getDisputesForEmployee(employeeId: string) {
    const objectId = new Types.ObjectId(employeeId);
    return this.disputeModel.find({ employeeId: objectId }).exec();
  }

  async createDispute(dto: CreateDisputeDto) {
    // Your DTO apparently does NOT have employeeId (TS error),
    // so we just spread dto and set status. If DTO contains employeeId
    // with correct type, it will still be included.
    const created = new this.disputeModel({
      ...dto,
      status: DisputeStatus.UNDER_REVIEW,
    });

    return created.save();
  }

  async getPendingDisputes() {
    return this.disputeModel
      .find({ status: DisputeStatus.UNDER_REVIEW })
      .exec();
  }

  async updateDisputeStatus(
    disputeMongoId: string,
    dto: UpdateDisputeStatusDto,
  ) {
    // Only using fields that actually exist on UpdateDisputeStatusDto:
    // - dto.status
    // - dto.resolutionComment
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

  // ======================================================
  // REFUNDS
  // ======================================================

  async createRefund(dto: CreateRefundDto) {
    // This assumes your CreateRefundDto has:
    // - employeeId: string
    // - refundDetails: any (or whatever your schema expects)
    const objectId = new Types.ObjectId(dto.employeeId);

    const created = new this.refundModel({
      refundDetails: dto.refundDetails,
      employeeId: objectId,
      status: RefundStatus.PENDING,
    });

    return created.save();
  }

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

  async getRefunds() {
    return this.refundModel.find().exec();
  }
}
