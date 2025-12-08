import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

// Schemas
import { claims } from './models/claims.schema';
import { disputes } from './models/disputes.schema';
import { refunds } from './models/refunds.schema';

// DTOs
import { CreateClaimDto } from './dto/create-claim.dto';
import { UpdateClaimStatusDto } from './dto/update-claim-status.dto';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { UpdateDisputeStatusDto } from './dto/update-dispute-status.dto';
import { CreateRefundDto, UpdateRefundStatusDto } from './dto/create-refund.dto';

@Injectable()
export class PayrollTrackingService {
  constructor(
    @InjectModel(claims.name) private readonly claimModel: Model<claims>,
    @InjectModel(disputes.name) private readonly disputeModel: Model<disputes>,
    @InjectModel(refunds.name) private readonly refundModel: Model<refunds>,
  ) {}

  // ======================================================
  // CLAIMS (Employee + Payroll Specialist)
  // ======================================================

  async getClaimsForEmployee(employeeId: string) {
    return this.claimModel.find({ employeeId }).exec();
  }

  async createClaim(dto: CreateClaimDto) {
    const created = new this.claimModel({
      ...dto,
      status: 'pending', // Default status
      createdAt: new Date(),
    });
    return created.save();
  }

  async getPendingClaims() {
    return this.claimModel.find({ status: 'pending' }).exec();
  }

  async updateClaimStatus(claimId: string, dto: UpdateClaimStatusDto) {
    return this.claimModel
      .findByIdAndUpdate(
        claimId,
        {
          status: dto.status,
          resolutionNotes: dto.resolutionComment,
          updatedAt: new Date(),
        },
        { new: true },
      )
      .exec();
  }

  // ======================================================
  // DISPUTES (Employee + Payroll Specialist)
  // ======================================================

  async getDisputesForEmployee(employeeId: string) {
    return this.disputeModel.find({ employeeId }).exec();
  }

  async createDispute(dto: CreateDisputeDto) {
    const created = new this.disputeModel({
      ...dto,
      status: 'pending',
      createdAt: new Date(),
    });
    return created.save();
  }

  async getPendingDisputes() {
    return this.disputeModel.find({ status: 'pending' }).exec();
  }

  async updateDisputeStatus(disputeId: string, dto: UpdateDisputeStatusDto) {
    return this.disputeModel
      .findByIdAndUpdate(
        disputeId,
        {
          status: dto.status,
          resolutionNotes: dto.resolutionComment,
          updatedAt: new Date(),
        },
        { new: true },
      )
      .exec();
  }

  // ======================================================
  // REFUNDS (Finance)
  // ======================================================

  async createRefund(dto: CreateRefundDto) {
    const created = new this.refundModel({
      ...dto,
      status: 'pending',
      createdAt: new Date(),
    });
    return created.save();
  }

  async updateRefundStatus(refundId: string, dto: UpdateRefundStatusDto) {
    return this.refundModel
      .findByIdAndUpdate(
        refundId,
        {
          status: dto.status,
          financeStaffId: dto.financeStaffId,
          paidInPayrollRunId: dto.paidInPayrollRunId,
          updatedAt: new Date(),
        },
        { new: true },
      )
      .exec();
  }

  async getRefunds() {
    return this.refundModel.find().exec();
  }
}
