// src/leaves/leave-request/leave-request.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { CreateLeaveRequestDto } from '../dto/create-leave-request.dto';
import { DecisionLeaveRequestDto } from '../dto/decision-leave-request.dto';


import { LeaveRequest, LeaveRequestDocument } from '../models/leave-request.schema';
import { ApprovalWorkflow, ApprovalWorkflowDocument } from '../models/approval-workflow.schema';
import { LeaveEntitlement, LeaveEntitlementDocument } from '../models/leave-entitlement.schema';
import { LeavePolicy, LeavePolicyDocument } from '../models/leave-policy.schema';
import { Calendar, CalendarDocument } from '../models/calendar.schema';
import { LeaveType, LeaveTypeDocument } from '../models/leave-type.schema';

import { LeaveStatus } from '../enums/leave-status.enum';
import { AdjustmentType } from '../enums/adjustment-type.enum';

@Injectable()
export class LeaveRequestService {
  private readonly logger = new Logger(LeaveRequestService.name);

  constructor(
    @InjectModel(LeaveRequest.name)
    private readonly requestModel: Model<LeaveRequestDocument>,

    @InjectModel(ApprovalWorkflow.name)
    private readonly workflowModel: Model<ApprovalWorkflowDocument>,

    @InjectModel(LeaveEntitlement.name)
    private readonly entitlementModel: Model<LeaveEntitlementDocument>,

    @InjectModel(LeavePolicy.name)
    private readonly policyModel: Model<LeavePolicyDocument>,

    @InjectModel(Calendar.name)
    private readonly calendarModel: Model<CalendarDocument>,

    @InjectModel(LeaveType.name)
    private readonly typeModel: Model<LeaveTypeDocument>,
  ) { }

  // Helper: calculate net leave days between two dates using calendar holidays and weekends
  private async calculateNetDays(start: Date, end: Date): Promise<number> {
    // reuse calendar logic: find current calendar by year
    const year = start.getFullYear();
    const calendar = await this.calendarModel.findOne({ year }).lean().exec();
    // if no calendar, fallback to counting business days excluding Fri/Sat
    const totalDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;
    let count = 0;
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const day = d.getDay();
      const isWeekend = (day === 5 || day === 6); // Fri/Sat
      if (isWeekend) continue;
      if (calendar && calendar.holidays && calendar.holidays.length) {
        const isHoliday = (calendar.holidays as any[]).some((h: any) => {
          const hd = new Date(h.date ?? h); // handle stored date or object
          return hd.toDateString() === d.toDateString();
        });
        if (isHoliday) continue;
      }
      count++;
    }
    return count;
  }

  // Build approval flow array based on ApprovalWorkflow for given leaveTypeId
  private async buildApprovalFlow(leaveTypeId: Types.ObjectId) {
    const workflow = await this.workflowModel.findOne({ leaveTypeId }).lean().exec();
    if (!workflow || !workflow.flow || workflow.flow.length === 0) {
      // default single-step: manager
      return [{ role: 'manager', status: 'pending' }];
    }
    // map to required shape
    return workflow.flow
      .sort((a: any, b: any) => a.order - b.order)
      .map((s: any) => ({ role: s.role, status: 'pending' }));
  }

  // Create a leave request (full validation + build approval flow)
  async createRequest(dto: CreateLeaveRequestDto) {
    const from = new Date(dto.from);
    const to = new Date(dto.to);
    if (to < from) throw new BadRequestException('Invalid date range');

    // Load leave type & policy
    const leaveType = await this.typeModel.findById(dto.leaveTypeId).lean().exec();
    if (!leaveType) throw new BadRequestException('Leave type not found');

    const policy = await this.policyModel.findOne({ leaveTypeId: leaveType._id }).lean().exec();

    // Calculate net leave days
    const durationDays = await this.calculateNetDays(from, to);

    // Policy checks
    if (policy) {
      // min notice
      if (policy.minNoticeDays && policy.minNoticeDays > 0) {
        const now = new Date();
        const diffDays = Math.ceil((from.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < policy.minNoticeDays) {
          throw new BadRequestException(`Minimum notice required: ${policy.minNoticeDays} days`);
        }
      }

      // max consecutive days
      if (policy.maxConsecutiveDays && durationDays > policy.maxConsecutiveDays) {
        throw new BadRequestException(`Max consecutive days exceeded: ${policy.maxConsecutiveDays}`);
      }

      // eligibility (tenure/positions) - best-effort check: if policy has eligibility fields we assume checks are enforced elsewhere
      // (If available, you can enhance this to check employee data)
    }

    // Blocked periods check
    const calendar = await this.calendarModel.findOne({ year: from.getFullYear() }).lean().exec();
    if (calendar && calendar.blockedPeriods && calendar.blockedPeriods.length) {
      const overlap = calendar.blockedPeriods.some((b: any) => {
        const bf = new Date(b.from);
        const bt = new Date(b.to);
        return (from <= bt && to >= bf);
      });
      if (overlap) throw new BadRequestException('Requested dates fall into a blocked period');
    }

    // Overlap check with existing requests for same employee & leaveType
    // We accept overlapping requests only if not conflicting (here we disallow overlap)
    const overlapping = await this.requestModel.findOne({
      'employeeId': dto['employeeId'] ? new Types.ObjectId(dto['employeeId']) : { $exists: true }, // if employeeId provided later
      'leaveTypeId': new Types.ObjectId(dto.leaveTypeId),
      $or: [
        { 'dates.from': { $lte: to }, 'dates.to': { $gte: from } },
      ],
      status: { $in: [LeaveStatus.PENDING, LeaveStatus.APPROVED] },
    }).lean().exec();

    if (overlapping) throw new BadRequestException('Overlapping leave request exists');

    // Check entitlement (if entitlement exists)
    if (dto['employeeId']) {
      const ent = await this.entitlementModel.findOne({
        employeeId: new Types.ObjectId(dto['employeeId']),
        leaveTypeId: new Types.ObjectId(dto.leaveTypeId),
      }).lean().exec();

      if (!ent) throw new BadRequestException('No entitlement found for employee & leave type');

      if (ent.remaining < durationDays) {
        throw new BadRequestException('Insufficient entitlement remaining for this leave');
      }
    }

    // Build approvalFlow from workflow config
    const approvalFlow = await this.buildApprovalFlow(new Types.ObjectId(dto.leaveTypeId));

    const request = await this.requestModel.create({
      employeeId: dto['employeeId'] ? new Types.ObjectId(dto['employeeId']) : null,
      leaveTypeId: new Types.ObjectId(dto.leaveTypeId),
      dates: { from, to },
      durationDays,
      justification: dto.justification,
      attachmentId: dto.attachmentId ? new Types.ObjectId(dto.attachmentId) : undefined,
      approvalFlow,
      status: LeaveStatus.PENDING,
      irregularPatternFlag: false,
    });

    return request;
  }

  // Approver decision handling
  async decideRequest(dto: DecisionLeaveRequestDto) {
    const { requestId, approverId, decision, comment } = dto;
    const req = await this.requestModel.findById(requestId);
    if (!req) throw new NotFoundException('Request not found');

    if (req.status !== LeaveStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be decided');
    }

    // Find the next pending step index
    const nextIndex = (req.approvalFlow || []).findIndex((s: any) => s.status === 'pending');
    if (nextIndex === -1) {
      throw new BadRequestException('No pending approval steps');
    }

    // Update the step
    req.approvalFlow[nextIndex].status =
      decision === LeaveStatus.APPROVED ? 'approved' : 'rejected';
    req.approvalFlow[nextIndex].decidedBy = new Types.ObjectId(approverId);
    req.approvalFlow[nextIndex].decidedAt = new Date();

    // Assign comment using type assertion to bypass TS error
    (req.approvalFlow[nextIndex] as any).comment = comment;

    // If rejected → mark request rejected
    if (decision === LeaveStatus.REJECTED) {
      req.status = LeaveStatus.REJECTED;
      await req.save();
      return { message: 'Request rejected', requestId };
    }

    // If approved, check if there are more steps
    const remainingPending = (req.approvalFlow || []).some((s: any) => s.status === 'pending');

    if (remainingPending) {
      await req.save();
      return { message: 'Step approved, forwarded to next approver', requestId };
    }

    // No more pending steps: final approval → deduct entitlement and mark approved
    const ent = await this.entitlementModel.findOne({
      employeeId: req.employeeId,
      leaveTypeId: req.leaveTypeId,
    });

    if (!ent) {
      throw new BadRequestException('No entitlement found to deduct from for this employee');
    }

    // Deduct entitlement
    ent.remaining = Math.max(0, (ent.remaining ?? 0) - (req.durationDays ?? 0));
    ent.taken = (ent.taken ?? 0) + (req.durationDays ?? 0);

    // Push audit log
    (ent as any).auditLogs = (ent as any).auditLogs || [];
    (ent as any).auditLogs.push({
      action: 'Deduct on Approval',
      type: AdjustmentType.DEDUCT,
      amount: req.durationDays,
      by: approverId,
      reason: `Approved request ${req._id}`,
      timestamp: new Date(),
    });

    await ent.save();

    req.status = LeaveStatus.APPROVED;
    await req.save();

    return { message: 'Request fully approved and entitlement deducted', requestId };
  }


  // Cancel by employee (only pending or approved & not yet started)

  async getRequestsForEmployee(employeeId: string, status?: string) {
    const filter: any = {
      employeeId: new Types.ObjectId(employeeId),
    };
    if (status) filter.status = status;
    return this.requestModel.find(filter).populate('leaveTypeId').lean().exec();
  }
  async cancelRequest(requestId: string) {
    // Load the request
    const req = await this.requestModel.findById(requestId);

    if (!req) {
      throw new BadRequestException('Leave request not found');
    }

    // RULE 1: Cannot cancel approved requests
    if (req.status === LeaveStatus.APPROVED) {
      throw new BadRequestException(
        'Cannot cancel an approved request (balance already deducted)',
      );
    }

    // RULE 2: Cannot cancel rejected requests
    if (req.status === LeaveStatus.REJECTED) {
      throw new BadRequestException('Request already rejected');
    }

    // RULE 3: Prevent double cancellation
    if (req.status === LeaveStatus.CANCELLED) {
      throw new BadRequestException('Request already cancelled');
    }

    // -----------------------------------------------
    //  CANCEL PENDING REQUEST
    // -----------------------------------------------

    // Update entitlement pending count
    await this.entitlementModel.updateOne(
      {
        employeeId: req.employeeId,
        leaveTypeId: req.leaveTypeId,
      },
      {
        $inc: { pending: -req.durationDays },
      },
    );

    // Mark request as cancelled
    req.status = LeaveStatus.CANCELLED;
    await req.save();

    return {
      message: 'Leave request cancelled successfully',
      requestId,
    };
  }

  async getRequestById(id: string) {
    return this.requestModel.findById(id).populate('leaveTypeId').lean().exec();
  }
}
