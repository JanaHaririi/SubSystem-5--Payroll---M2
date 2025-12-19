import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

// Correct schema imports (lowercase class names)
import { claims, claimsDocument } from './models/claims.schema';
import { disputes, disputesDocument } from './models/disputes.schema';
import { refunds, refundsDocument } from './models/refunds.schema';

// DTOs
import { CreateClaimDto } from './dto/create-claim.dto';
import { UpdateClaimStatusDto } from './dto/update-claim-status.dto';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { UpdateDisputeStatusDto } from './dto/update-dispute-status.dto';
import { CreateRefundDto, UpdateRefundStatusDto } from './dto/create-refund.dto';

@Injectable()
export class PayrollTrackingService {
  constructor(
    @InjectModel(claims.name)
    private readonly claimModel: Model<claimsDocument>,

    @InjectModel(disputes.name)
    private readonly disputeModel: Model<disputesDocument>,

    @InjectModel(refunds.name)
    private readonly refundModel: Model<refundsDocument>,
  ) {}

  // ======================================================
  // CLAIMS
  // ======================================================

  async getClaimsForEmployee(employeeId: string) {
    return this.claimModel.find({ employeeId }).exec();
  }

  async createClaim(dto: CreateClaimDto) {
    // Auto-generate claimId => CLAIM-0001, CLAIM-0002, ...
    const count = await this.claimModel.countDocuments();
    const claimId = `CLAIM-${String(count + 1).padStart(4, '0')}`;

    return this.claimModel.create({
      ...dto,
      claimId,
    });
  }

  async getPendingClaims() {
    return this.claimModel.find({ status: 'UNDER_REVIEW' }).exec();
  }

  async updateClaimStatus(claimId: string, dto: UpdateClaimStatusDto) {
    return this.claimModel
      .findOneAndUpdate(
        { claimId },
        {
          status: dto.status,
          rejectionReason: dto.rejectionReason,
          resolutionComment: dto.resolutionComment,
        },
        { new: true },
      )
      .exec();
  }

  // ======================================================
  // DISPUTES
  // ======================================================

  async getDisputesForEmployee(employeeId: string) {
    return this.disputeModel.find({ employeeId }).exec();
  }

 async createDispute(dto: CreateDisputeDto) {
  // Auto-generate disputeId => DISP-0001, DISP-0002, ...
  const count = await this.disputeModel.countDocuments();
  const disputeId = `DISP-${String(count + 1).padStart(4, '0')}`;

  return this.disputeModel.create({
    ...dto,
    disputeId,
  });
}

  async getPendingDisputes() {
    return this.disputeModel.find({ status: 'UNDER_REVIEW' }).exec();
  }

  async updateDisputeStatus(disputeId: string, dto: UpdateDisputeStatusDto) {
    return this.disputeModel
      .findOneAndUpdate(
        { disputeId },
        {
          status: dto.status,
          rejectionReason: dto.rejectionReason,
          resolutionComment: dto.resolutionComment,
        },
        { new: true },
      )
      .exec();
  }

  // ======================================================
  // REFUNDS
  // ======================================================

  async createRefund(dto: CreateRefundDto) {
    return this.refundModel.create(dto);
  }

  async updateRefundStatus(refundId: string, dto: UpdateRefundStatusDto) {
    return this.refundModel
      .findByIdAndUpdate(
        refundId,
        {
          status: dto.status,
          financeStaffId: dto.financeStaffId,
          paidInPayrollRunId: dto.paidInPayrollRunId,
        },
        { new: true },
      )
      .exec();
  }

  async getRefunds() {
    return this.refundModel.find().exec();
  }
}
