// src/leaves/leave-tracking/leave-tracking.service.ts

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  LeaveEntitlement,
  LeaveEntitlementDocument,
} from '../models/leave-entitlement.schema';

import {
  LeavePolicy,
  LeavePolicyDocument,
} from '../models/leave-policy.schema';

import { AdjustmentType } from '../enums/adjustment-type.enum';
import { AccrualMethod } from '../enums/accrual-method.enum';
import { RoundingRule } from '../enums/rounding-rule.enum';

@Injectable()
export class LeaveTrackingService {
  private readonly logger = new Logger(LeaveTrackingService.name);

  constructor(
    @InjectModel(LeaveEntitlement.name)
    private readonly entitlementModel: Model<LeaveEntitlementDocument>,

    @InjectModel(LeavePolicy.name)
    private readonly policyModel: Model<LeavePolicyDocument>,
  ) {}

  // ======================================================
  // MONTHLY ACCRUAL ENGINE
  // ======================================================
  async accrueEntitlements(): Promise<{ processed: number }> {
    const entitlements = await this.entitlementModel.find();
    let processed = 0;

    for (const ent of entitlements) {
      const policy = await this.policyModel.findOne({
        leaveTypeId: ent.leaveTypeId,
      });

      if (!policy) continue;

      // Compute accrual
      let accrual = 0;

      switch (policy.accrualMethod) {
        case AccrualMethod.MONTHLY:
          accrual =
            policy.monthlyRate ??
            (policy.yearlyRate ? policy.yearlyRate / 12 : 0);
          break;

        case AccrualMethod.YEARLY:
          accrual = policy.yearlyRate ? policy.yearlyRate / 12 : 0;
          break;

        default:
          accrual = 0;
      }

      // Apply rounding
      switch (policy.roundingRule) {
        case RoundingRule.ROUND:
          accrual = Math.round(accrual);
          break;
        case RoundingRule.ROUND_UP:
          accrual = Math.ceil(accrual);
          break;
        case RoundingRule.ROUND_DOWN:
          accrual = Math.floor(accrual);
          break;
      }

      if (accrual <= 0) continue;

      await this.entitlementModel.updateOne(
        { _id: ent._id },
        {
          $inc: {
            accruedActual: accrual,
            accruedRounded: accrual,
            remaining: accrual,
          },
          $set: { lastAccrualDate: new Date() },
          $push: {
            auditLogs: {
              action: 'Accrual',
              type: AdjustmentType.ADD,
              amount: accrual,
              by: 'system',
              timestamp: new Date(),
              reason: 'Monthly Accrual',
            },
          },
        },
      );

      processed++;
    }

    return { processed };
  }

  async accrueLeave() {
    return this.accrueEntitlements();
  }

  // ======================================================
  // MANUAL ADJUSTMENT
  // ======================================================
  async adjustLeave(dto: {
  employeeId: string;
  leaveType: string;
  newBalance: number;
  hrId: string;
  reason: string;
}) {
  const entitlement = await this.entitlementModel.findOne({
    employeeId: new Types.ObjectId(dto.employeeId),
    leaveTypeId: new Types.ObjectId(dto.leaveType),
  });

  if (!entitlement) {
    throw new Error('Entitlement not found for this employee & leave type.');
  }

  const diff = dto.newBalance - entitlement.remaining;
  const type = diff >= 0 ? AdjustmentType.ADD : AdjustmentType.DEDUCT;

  await this.entitlementModel.updateOne(
    { _id: entitlement._id },
    {
      $set: { remaining: dto.newBalance },
      $push: {
        auditLogs: {
          action: 'Manual Adjustment',
          type,
          amount: Math.abs(diff),
          by: dto.hrId,
          reason: dto.reason,
          timestamp: new Date(),
        },
      },
    }
  );

  return { message: 'Leave balance adjusted successfully' };
}

  // ======================================================
  // YEAR-END RESET
  // ======================================================
  async yearEndProcessing() {
    const entitlements = await this.entitlementModel.find();
    let processed = 0;

    for (const ent of entitlements) {
      const carryForward = Math.min(ent.remaining, 5);
      const newRemaining = ent.yearlyEntitlement + carryForward;

      await this.entitlementModel.updateOne(
        { _id: ent._id },
        {
          $set: {
            carryForward,
            accruedActual: 0,
            accruedRounded: 0,
            remaining: newRemaining,
            nextResetDate: new Date(
              new Date().getFullYear() + 1,
              0,
              1,
            ),
          },
          $push: {
            auditLogs: {
              action: 'Year-End Reset',
              type: AdjustmentType.ADD,
              amount: newRemaining,
              by: 'system',
              timestamp: new Date(),
              reason: 'Annual leave reset',
            },
          },
        },
      );

      processed++;
    }

    return { message: 'Year-end reset completed', processed };
  }

  // ======================================================
  // ENCASHMENT
  // ======================================================
  async calculateEncashment(employeeId: string, dailySalary: number) {
    const entitlements = await this.entitlementModel.find({
      employeeId: new Types.ObjectId(employeeId),
    });

    let totalEncashableDays = 0;

    for (const ent of entitlements) {
      const encashable = Math.max(0, ent.remaining - 10);
      totalEncashableDays += encashable;
    }

    return {
      employeeId,
      totalEncashableDays,
      dailySalary,
      payout: totalEncashableDays * dailySalary,
    };
  }

  // ======================================================
  // CREATE ENTITLEMENTS (for testing Phase 3)
  // ======================================================
  async createEntitlementForEmployee(employee: any) {
    const leaveTypes = await this.policyModel.find().distinct('leaveTypeId');

    const entitlements = leaveTypes.map((lt) => ({
      employeeId: new Types.ObjectId(employee._id),
      leaveTypeId: new Types.ObjectId(lt),
      yearlyEntitlement: 21,
      accruedActual: 0,
      accruedRounded: 0,
      carryForward: 0,
      taken: 0,
      pending: 0,
      remaining: 21,
      lastAccrualDate: null,
      nextResetDate: null,
    }));

    return this.entitlementModel.insertMany(entitlements);
  }

  async createSingleEntitlement(employeeId: string, leaveTypeId: string) {
    const exists = await this.entitlementModel.findOne({
      employeeId: new Types.ObjectId(employeeId),
      leaveTypeId: new Types.ObjectId(leaveTypeId),
    });

    if (exists) return exists;

    return this.entitlementModel.create({
      employeeId: new Types.ObjectId(employeeId),
      leaveTypeId: new Types.ObjectId(leaveTypeId),
      yearlyEntitlement: 21,
      accruedActual: 0,
      accruedRounded: 0,
      carryForward: 0,
      taken: 0,
      pending: 0,
      remaining: 21,
      lastAccrualDate: null,
      nextResetDate: null,
    });
  }

  // ======================================================
  // GET BALANCE
  // ======================================================
  async getLeaveBalances(employeeId: string) {
    return this.entitlementModel
      .find({
        employeeId: new Types.ObjectId(employeeId),
      })
      .populate('leaveTypeId')
      .lean()
      .exec();
  }
}
