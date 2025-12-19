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
import { UpdateClaimReviewDto } from './dto/update-claim-review.dto';

import { CreateDisputeDto } from './dto/create-dispute.dto';
import { UpdateDisputeStatusDto } from './dto/update-dispute-status.dto';
import { UpdateDisputeReviewDto } from './dto/update-dispute-review.dto';

import { CreateRefundDto } from './dto/create-refund.dto';
import { UpdateRefundStatusDto } from './dto/update-refund-status.dto';

// Enums
import {
  ClaimStatus,
  ClaimReviewStatus,
  DisputeStatus,
  DisputeReviewStatus,
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
      reviewStatus: ClaimReviewStatus.PENDING,
      status: ClaimStatus.UNDER_REVIEW,
    });

    return created.save();
  }

  /** PAYROLL SPECIALIST – list pending claims */
  async getPendingClaims() {
    return this.claimModel
      .find({ reviewStatus: ClaimReviewStatus.PENDING })
      .exec();
  }

  /** PAYROLL SPECIALIST – recommend claim status */
  async recommendClaimStatus(
    claimMongoId: string,
    dto: UpdateClaimReviewDto,
    reviewerId?: string,
  ) {
    return this.claimModel.findByIdAndUpdate(
      claimMongoId,
      {
        reviewStatus: dto.reviewStatus,
        reviewComment: dto.reviewComment,
        reviewBy: reviewerId ? new Types.ObjectId(reviewerId) : undefined,
        reviewAt: new Date(),
        updatedAt: new Date(),
      },
      { new: true },
    );
  }

  /** PAYROLL MANAGER – final approve/reject claim */
  async updateClaimStatus(
    claimMongoId: string,
    dto: UpdateClaimStatusDto,
    managerId?: string,
  ) {
    return this.claimModel.findByIdAndUpdate(
      claimMongoId,
      {
        status: dto.status,
        resolutionComment: dto.resolutionComment,
        finalBy: managerId ? new Types.ObjectId(managerId) : undefined,
        finalAt: new Date(),
        updatedAt: new Date(),
      },
      { new: true },
    );
  }

  /** PAYROLL MANAGER – items awaiting final decision */
  async getClaimsAwaitingFinal() {
    return this.claimModel
      .find({
        reviewStatus: {
          $in: [
            ClaimReviewStatus.RECOMMEND_APPROVE,
            ClaimReviewStatus.RECOMMEND_REJECT,
          ],
        },
        status: ClaimStatus.UNDER_REVIEW,
      })
      .exec();
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
      reviewStatus: DisputeReviewStatus.PENDING,
      status: DisputeStatus.UNDER_REVIEW,
    });

    return created.save();
  }

  /** PAYROLL SPECIALIST – list pending disputes */
  async getPendingDisputes() {
    return this.disputeModel
      .find({ reviewStatus: DisputeReviewStatus.PENDING })
      .exec();
  }

  /** PAYROLL SPECIALIST – recommend dispute status */
  async recommendDisputeStatus(
    disputeMongoId: string,
    dto: UpdateDisputeReviewDto,
    reviewerId?: string,
  ) {
    return this.disputeModel.findByIdAndUpdate(
      disputeMongoId,
      {
        reviewStatus: dto.reviewStatus,
        reviewComment: dto.reviewComment,
        reviewBy: reviewerId ? new Types.ObjectId(reviewerId) : undefined,
        reviewAt: new Date(),
        updatedAt: new Date(),
      },
      { new: true },
    );
  }

  /** PAYROLL MANAGER – final approve/reject dispute */
  async updateDisputeStatus(
    disputeMongoId: string,
    dto: UpdateDisputeStatusDto,
    managerId?: string,
  ) {
    return this.disputeModel.findByIdAndUpdate(
      disputeMongoId,
      {
        status: dto.status,
        resolutionComment: dto.resolutionComment,
        finalBy: managerId ? new Types.ObjectId(managerId) : undefined,
        finalAt: new Date(),
        updatedAt: new Date(),
      },
      { new: true },
    );
  }

  /** PAYROLL MANAGER – items awaiting final decision */
  async getDisputesAwaitingFinal() {
    return this.disputeModel
      .find({
        reviewStatus: {
          $in: [
            DisputeReviewStatus.RECOMMEND_APPROVE,
            DisputeReviewStatus.RECOMMEND_REJECT,
          ],
        },
        status: DisputeStatus.UNDER_REVIEW,
      })
      .exec();
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
