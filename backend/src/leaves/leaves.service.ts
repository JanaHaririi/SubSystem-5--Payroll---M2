import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

// MODELS
import { LeaveCategory } from './models/leave-category.schema';
import { LeaveType } from './models/leave-type.schema';
import { LeavePolicy } from './models/leave-policy.schema';
import { Calendar } from './models/calendar.schema';
import { ApprovalWorkflow } from './models/approval-workflow.schema';
import { LeaveEntitlement } from './models/leave-entitlement.schema';
import { LeaveRequest, LeaveRequestDocument } from './models/leave-request.schema';
import { EmployeeProfile, EmployeeProfileDocument } from '../employee-profile/models/employee-profile.schema';

import { LeaveStatus } from './enums/leave-status.enum';
import { AccrualMethod } from './enums/accrual-method.enum';

// DTOs
import { CreateLeaveCategoryDto } from './dto/create-leave-category.dto';
import { UpdateLeaveCategoryDto } from './dto/update-leave-category.dto';
import { CreateLeaveTypeDto } from './dto/create-leave-type.dto';
import { UpdateLeaveTypeDto } from './dto/update-leave-type.dto';
import { CreateLeavePolicyDto } from './dto/create-leave-policy.dto';
import { UpdateLeavePolicyDto } from './dto/update-leave-policy.dto';
import { CreateCalendarDto } from './dto/create-calendar.dto';
import { UpdateCalendarHolidayDto } from './dto/update-calendar-holiday.dto';
import { UpdateCalendarBlockedDto } from './dto/update-calendar-blocked.dto';
import { CreateApprovalWorkflowDto } from './dto/create-approval-workflow.dto';
import { UpdateApprovalWorkflowDto } from './dto/update-approval-workflow.dto';
import { CreatePaycodeMappingDto } from './dto/create-paycode-mapping.dto';
import { UpdatePaycodeMappingDto } from './dto/update-paycode-mapping.dto';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { UpdateLeaveRequestDto } from './dto/update-leave-request.dto';

// For REQ-007 logic
type Employee = {
  _id: string;
  grade: string;
  tenure: number;
  contractType: string;
  status?: string;
};


// ======================================================
// Local interface extension for TypeScript
// ======================================================
interface ApprovalStepExtended {
  role: string;
  status: string;
  decidedBy?: Types.ObjectId;
  decidedAt?: Date;
  assignedTo?: Types.ObjectId;
  delegateTo?: Types.ObjectId;
  escalationAt?: Date;
  overrideManager?: boolean;
}

@Injectable()
export class LeavesService {
  constructor(
    @InjectModel(LeaveCategory.name) private readonly categoryModel: Model<LeaveCategory>,
    @InjectModel(LeaveType.name) private readonly typeModel: Model<LeaveType>,
    @InjectModel(LeavePolicy.name) private readonly policyModel: Model<LeavePolicy>,
    @InjectModel(Calendar.name) private readonly calendarModel: Model<Calendar>,
    @InjectModel(ApprovalWorkflow.name) private readonly workflowModel: Model<ApprovalWorkflow>,
    @InjectModel(LeaveEntitlement.name) private readonly entitlementModel: Model<LeaveEntitlement>,
    @InjectModel('LeavePaycodeMapping') private readonly paycodeModel: Model<any>,
    @InjectModel(LeaveRequest.name) private readonly requestModel: Model<LeaveRequestDocument>,
    @InjectModel(EmployeeProfile.name) private readonly employeeModel: Model<EmployeeProfileDocument>,
  ) { }

  // ======================================================
  // PHASE 1 — CATEGORY
  // ======================================================
  createCategory(dto: CreateLeaveCategoryDto) {
    return this.categoryModel.create(dto);
  }

  getAllCategories() {
    return this.categoryModel.find().exec();
  }

  updateCategory(id: string, dto: UpdateLeaveCategoryDto) {
    return this.categoryModel.findByIdAndUpdate(id, dto, { new: true });
  }

  async deleteCategory(id: string) {
    const linkedType = await this.typeModel.exists({ categoryId: id });
    if (linkedType) {
      throw new BadRequestException('Cannot delete category with linked leave types');
    }
    return this.categoryModel.findByIdAndDelete(id);
  }

  // ======================================================
  // PHASE 1 — LEAVE TYPES
  // ======================================================
  async createLeaveType(dto: CreateLeaveTypeDto) {
    const exists = await this.typeModel.findOne({ code: dto.code });
    if (exists) throw new BadRequestException('Leave type code already exists');
    return this.typeModel.create(dto);
  }

  getAllLeaveTypes() {
    return this.typeModel.find().populate('categoryId').exec();
  }

  updateLeaveType(id: string, dto: UpdateLeaveTypeDto) {
    return this.typeModel.findByIdAndUpdate(id, dto, { new: true });
  }

  async deleteLeaveType(id: string) {
    const linkedPolicy = await this.policyModel.exists({ leaveTypeId: id });
    if (linkedPolicy)
      throw new BadRequestException('Cannot delete leave type with an active policy');
    return this.typeModel.findByIdAndDelete(id);
  }

  // ======================================================
  // PHASE 1 — POLICIES (Accrual, Carry, Reset)
  // ======================================================
  async createPolicy(dto: CreateLeavePolicyDto) {
    const exists = await this.policyModel.findOne({ leaveTypeId: dto.leaveTypeId });
    if (exists) throw new BadRequestException('Policy already exists for this leave type');
    return this.policyModel.create(dto);
  }

  getAllPolicies() {
    return this.policyModel.find().populate('leaveTypeId');
  }

  updatePolicy(id: string, dto: UpdateLeavePolicyDto) {
    return this.policyModel.findByIdAndUpdate(id, dto, { new: true });
  }

  async deletePolicy(id: string) {
    const used = await this.entitlementModel.exists({ policyId: id });
    if (used) throw new BadRequestException('Cannot delete policy linked to entitlements');
    return this.policyModel.findByIdAndDelete(id);
  }

  // ======================================================
  // PHASE 1 — CALENDAR (BR23, BR55)
  // ======================================================
  createCalendar(dto: CreateCalendarDto) {
    return this.calendarModel.findOneAndUpdate(
      { year: dto.year },
      dto,
      { upsert: true, new: true }
    );
  }

  getCalendarByYear(year: number) {
    return this.calendarModel.findOne({ year });
  }

  async addHoliday(year: number, dto: UpdateCalendarHolidayDto) {
    const calendar = await this.calendarModel.findOne({ year });
    if (!calendar) throw new NotFoundException('Calendar not found');

    const holidayObjId = new Types.ObjectId(dto.holidayId);
    if (calendar.holidays.some(h => h.equals(holidayObjId)))
      throw new BadRequestException('Holiday already added');

    calendar.holidays.push(holidayObjId);
    return calendar.save();
  }

  async removeHoliday(year: number, dto: UpdateCalendarHolidayDto) {
    const calendar = await this.calendarModel.findOne({ year });
    if (!calendar) throw new NotFoundException('Calendar not found');

    calendar.holidays = calendar.holidays.filter(h => h.toString() !== dto.holidayId);
    return calendar.save();
  }

  async addBlockedPeriod(year: number, dto: UpdateCalendarBlockedDto) {
    const calendar = await this.calendarModel.findOne({ year });
    if (!calendar) throw new NotFoundException('Calendar not found');

    const overlap = calendar.blockedPeriods.some(
      b => (dto.from >= b.from && dto.from <= b.to) ||
        (dto.to >= b.from && dto.to <= b.to),
    );

    if (overlap) throw new BadRequestException('Blocked period overlaps existing one');

    calendar.blockedPeriods.push(dto);
    return calendar.save();
  }

  async removeBlockedPeriod(year: number, index: number) {
    const calendar = await this.calendarModel.findOne({ year });
    if (!calendar) throw new NotFoundException('Calendar not found');

    calendar.blockedPeriods.splice(index, 1);
    return calendar.save();
  }

  // For BR23 calculation
  async calculateNetLeaveDays(start: Date, end: Date, year: number) {
    const calendar = await this.calendarModel.findOne({ year }).populate('holidays', 'date');
    if (!calendar) throw new NotFoundException('Calendar not found');

    const totalDays = (end.getTime() - start.getTime()) / (1000 * 3600 * 24) + 1;

    const weekends = Array.from({ length: totalDays }).filter((_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d.getDay() === 5 || d.getDay() === 6; // Fri/Sat
    }).length;

    const holidayDays = (calendar.holidays as any[])
      .filter(h => new Date(h.date) >= start && new Date(h.date) <= end).length;

    return totalDays - weekends - holidayDays;
  }

  // ======================================================
  // PHASE 1 — ENTITLEMENTS (REQ-007 / BR-7)
  // ======================================================
  async createEntitlementForEmployee(employee: Employee) {
    const leaveTypes = await this.typeModel.find().lean();
    const policies = await this.policyModel
      .find({ leaveTypeId: { $in: leaveTypes.map(t => t._id) } })
      .lean();

    const policyMap = new Map<string, any>();
    policies.forEach(p => policyMap.set(p.leaveTypeId.toString(), p));

    const entitlements = leaveTypes.map(type => {
      const policy = policyMap.get(type._id.toString());

      let yearlyEntitlement = 0;

      if (employee.grade === 'A') yearlyEntitlement = 30;
      else if (employee.tenure >= 10) yearlyEntitlement = 28;
      else if (employee.tenure >= 5) yearlyEntitlement = 24;
      else yearlyEntitlement = 21;

      if (employee.contractType === 'temporary')
        yearlyEntitlement = Math.min(yearlyEntitlement, 15);

      if (policy) yearlyEntitlement = policy.yearlyRate ?? yearlyEntitlement;

      return {
        employeeId: new Types.ObjectId(employee._id),
        leaveTypeId: type._id,
        yearlyEntitlement,
        accruedActual: 0,
        accruedRounded: 0,
        carryForward: 0,
        taken: 0,
        pending: 0,
        remaining: yearlyEntitlement,
        lastAccrualDate: null,
        nextResetDate: null,
      };
    });

    return this.entitlementModel.insertMany(entitlements);
  }

  // ======================================================
  // PHASE 1 — ACCRUAL (BR11)
  // ======================================================
  async accrueMonthlyEntitlements() {
    const entitlements = await this.entitlementModel.find().populate('employeeId');

    for (const ent of entitlements) {
      const policy = await this.policyModel.findOne({ leaveTypeId: ent.leaveTypeId });
      if (!policy) continue;

      const employeeStatus = (ent.employeeId as any)?.status?.toLowerCase();
      if (employeeStatus === 'suspended' || employeeStatus === 'unpaid') continue;

      if (policy.accrualMethod === AccrualMethod.MONTHLY) {
        const increment = (policy.yearlyRate ?? 0) / 12;
        ent.accruedActual += increment;
        ent.remaining += increment;
        ent.lastAccrualDate = new Date();
        await ent.save();
      }
    }

    return { message: 'Accrual cycle complete' };
  }

  async resetYearlyBalances() {
    const entitlements = await this.entitlementModel.find();
    for (const ent of entitlements) {
      ent.carryForward = Math.min(ent.remaining, 5);
      ent.accruedActual = 0;
      ent.remaining = ent.yearlyEntitlement + ent.carryForward;
      ent.nextResetDate = new Date(new Date().getFullYear() + 1, 0, 1);
      await ent.save();
    }
    return { message: 'Yearly reset completed' };
  }

  // ======================================================
  // PHASE 1 — APPROVAL WORKFLOW CONFIG
  // ======================================================
  async createApprovalWorkflow(dto: CreateApprovalWorkflowDto) {
    const roles = dto.flow.map(s => s.role);
    const duplicates = roles.filter((r, i) => roles.indexOf(r) !== i);
    if (duplicates.length)
      throw new BadRequestException('Duplicate roles not allowed in workflow');

    return this.workflowModel.create(dto);
  }

  getApprovalWorkflow(leaveTypeId: string) {
    return this.workflowModel.findOne({ leaveTypeId });
  }

  updateApprovalWorkflow(leaveTypeId: string, dto: UpdateApprovalWorkflowDto) {
    return this.workflowModel.findOneAndUpdate({ leaveTypeId }, dto, { new: true });
  }

  // ======================================================
  // PHASE 1 — PAYCODE MAPPING (REQ-042)
  // ======================================================
  createPaycodeMapping(dto: CreatePaycodeMappingDto) {
    return this.paycodeModel.create({
      leaveTypeId: new Types.ObjectId(dto.leaveTypeId),
      payrollCode: dto.payrollCode,
      description: dto.description,
    });
  }

  getAllPaycodeMappings() {
    return this.paycodeModel.find().populate('leaveTypeId');
  }

  getPaycodeForLeaveType(leaveTypeId: string) {
    return this.paycodeModel.findOne({ leaveTypeId: new Types.ObjectId(leaveTypeId) });
  }

  updatePaycodeMapping(id: string, dto: UpdatePaycodeMappingDto) {
    return this.paycodeModel.findByIdAndUpdate(id, dto, { new: true });
  }

  deletePaycodeMapping(id: string) {
    return this.paycodeModel.findByIdAndDelete(id);
  }

  // ======================================================
  // PHASE 2 — LEAVE REQUEST SUBMISSION
  // ======================================================
  async createLeaveRequest(employeeId: string, dto: CreateLeaveRequestDto) {
    const leaveType = await this.typeModel.findById(dto.leaveTypeId);
    if (!leaveType) throw new NotFoundException('Leave type not found');

    if (leaveType.requiresAttachment && !dto.attachmentId)
      throw new BadRequestException('Attachment is required');

    const from = new Date(dto.from);
    const to = new Date(dto.to);

    if (to < from) throw new BadRequestException('Invalid date range');

    const durationDays =
      Math.ceil((to.getTime() - from.getTime()) / (1000 * 3600 * 24)) + 1;

    const policy = await this.policyModel.findOne({ leaveTypeId: leaveType._id });

    if (policy?.maxConsecutiveDays && durationDays > policy.maxConsecutiveDays)
      throw new BadRequestException(`Exceeds maximum consecutive days`);

    const today = new Date();
    if (to < today && policy?.minNoticeDays) {
      const diff = Math.ceil((today.getTime() - to.getTime()) / 86400000);
      if (diff > policy.minNoticeDays)
        throw new BadRequestException('Grace period exceeded');
    }

    const entitlement = await this.entitlementModel.findOne({
      employeeId: new Types.ObjectId(employeeId),
      leaveTypeId: leaveType._id,
    });

    if (!entitlement)
      throw new NotFoundException('No entitlement found for employee');

    const remaining = entitlement.remaining;

    if (durationDays > remaining) {
      throw new BadRequestException(
        `Requested ${durationDays} days but only ${remaining} remaining`
      );
    }

    // Check team scheduling conflicts
    const employeeProfile = await this.employeeModel.findById(employeeId);
    if (!employeeProfile) throw new NotFoundException('Employee not found');

    const departmentId = employeeProfile.primaryDepartmentId;
    if (departmentId) {
      const teamMembers = await this.employeeModel.find({
        primaryDepartmentId: departmentId,
      }).select('_id');
      const teamIds = teamMembers.map(e => e._id.toString());

      const overlaps = await this.requestModel.countDocuments({
        employeeId: { $in: teamIds },
        status: LeaveStatus.APPROVED,
        $or: [
          { 'dates.from': { $lte: to }, 'dates.to': { $gte: from } },
        ],
      });

      const maxAllowed = Math.ceil(teamIds.length * 0.3);
      if (overlaps >= maxAllowed)
        throw new BadRequestException('Team scheduling conflict');
    }

    // Personal overlap
    const overlapReq = await this.requestModel.findOne({
      employeeId: new Types.ObjectId(employeeId),
      status: LeaveStatus.APPROVED,
      $or: [
        { 'dates.from': { $lte: to }, 'dates.to': { $gte: from } },
      ],
    });

    if (overlapReq)
      throw new BadRequestException('Overlaps with approved leave');

    // Approval flow
    const workflow = await this.workflowModel.findOne({ leaveTypeId: leaveType._id });
    const approvalFlow: ApprovalStepExtended[] = workflow
      ? workflow.flow.map(s => ({ role: s.role, status: 'pending' }))
      : [];

    return this.requestModel.create({
      employeeId: new Types.ObjectId(employeeId),
      leaveTypeId: leaveType._id,
      dates: { from, to },
      durationDays,
      justification: dto.justification,
      attachmentId: dto.attachmentId ? new Types.ObjectId(dto.attachmentId) : undefined,
      approvalFlow,
      status: LeaveStatus.PENDING,
      irregularPatternFlag: false,
    });
  }


  // ======================================================
  // PHASE 2 — GET REQUESTS
  // ======================================================
  getAllLeaveRequests() {
    return this.requestModel.find().populate('leaveTypeId attachmentId');
  }

  getLeaveRequest(id: string) {
    return this.requestModel.findById(id)
      .populate('leaveTypeId attachmentId');
  }

  // ======================================================
  // PHASE 2 — UPDATE REQUEST
  // ======================================================
  async updateLeaveRequest(id: string, dto: UpdateLeaveRequestDto) {
    const leave = await this.requestModel.findById(id);
    if (!leave) throw new NotFoundException('Leave request not found');

    if (dto.justification !== undefined)
      leave.justification = dto.justification;

    if (dto.status !== undefined) {
      leave.status = dto.status;

      const pendingStep = leave.approvalFlow.find(s => s.status === 'pending');
      if (pendingStep) {
        pendingStep.status = dto.status;
        pendingStep.decidedBy = dto.decidedBy ? new Types.ObjectId(dto.decidedBy) : undefined;
        pendingStep.decidedAt = new Date();
      }

      if (dto.status === LeaveStatus.APPROVED) {
        const entitlement = await this.entitlementModel.findOne({
          employeeId: leave.employeeId,
          leaveTypeId: leave.leaveTypeId,
        });

        if (entitlement) {
          // M1 model: use durationDays for deductions
          entitlement.taken += leave.durationDays ?? 0;
          entitlement.remaining -= leave.durationDays ?? 0;
          await entitlement.save();
        }
      }
    }

    return leave.save();
  }

  // ======================================================
  // PHASE 2 — ROUTE TO MANAGER (REQ-020)
  // ======================================================
  async routeToManager(leaveRequestId: string, delegateToId?: string) {
    const leave = await this.requestModel.findById(leaveRequestId);
    if (!leave) throw new NotFoundException('Leave request not found');

    const employee = await this.employeeModel.findById(leave.employeeId);
    if (!employee) throw new NotFoundException('Employee not found');

    const manager = await this.employeeModel.findOne({
      primaryDepartmentId: employee.primaryDepartmentId,
      systemRole: 'Manager',
    });

    if (!manager)
      throw new NotFoundException('Manager not assigned');

    const step: any = {
      role: 'Manager',
      assignedTo: manager._id,
      status: 'pending',
    };

    if (delegateToId) {
      const delegate = await this.employeeModel.findById(delegateToId);
      if (!delegate)
        throw new NotFoundException('Delegate not found');
      step.delegateTo = delegate._id;
    }

    leave.approvalFlow.push(step);
    await leave.save();
    return leave;
  }

  // ======================================================
  // PHASE 2 — MANAGER DECISION (REQ-021 / REQ-022)
  // ======================================================
  async managerDecision(
    leaveRequestId: string,
    managerId: string,
    decision: 'approved' | 'rejected',
  ) {
    const leave = await this.requestModel.findById(leaveRequestId);
    if (!leave) throw new NotFoundException('Leave request not found');

    const approvalFlow = leave.approvalFlow as ApprovalStepExtended[];

    const step = approvalFlow.find(
      s =>
        s.role === 'Manager' &&
        s.status === 'pending' &&
        (s.assignedTo?.toString() === managerId ||
          s.delegateTo?.toString() === managerId),
    );

    if (!step)
      throw new ForbiddenException('No pending managerial action');

    step.status = decision;
    step.decidedBy = new Types.ObjectId(managerId);
    step.decidedAt = new Date();
    step.escalationAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

    await leave.save();
    return leave;
  }

  // ======================================================
  // PHASE 2 — HR COMPLIANCE (REQ-025 / BR-41)
  // ======================================================
  async hrComplianceReview(
    leaveRequestId: string,
    hrId: string,
    action: 'approved' | 'rejected',
    overrideManager = false,
  ) {
    const leave = await this.requestModel.findById(leaveRequestId);
    if (!leave) throw new NotFoundException('Leave request not found');

    const approvalFlow = leave.approvalFlow as ApprovalStepExtended[];
    const managerStep = approvalFlow.find(s => s.role === 'Manager');

    if (!managerStep || (managerStep.status !== 'approved' && !overrideManager))
      throw new BadRequestException('Manager approval required first');

    const entitlement = await this.entitlementModel.findOne({
      employeeId: leave.employeeId,
      leaveTypeId: leave.leaveTypeId,
    });

    if (!entitlement)
      throw new NotFoundException('Entitlement not found');

    if (entitlement.taken + (leave.durationDays ?? 0) > entitlement.yearlyEntitlement)
      throw new BadRequestException('Exceeds yearly limit');

    approvalFlow.push({
      role: 'HR',
      assignedTo: new Types.ObjectId(hrId),
      status: action,
      decidedAt: new Date(),
      decidedBy: new Types.ObjectId(hrId),
      overrideManager,
    });

    leave.status = action === 'approved'
      ? LeaveStatus.APPROVED
      : LeaveStatus.REJECTED;

    await leave.save();
    return leave;
  }

  // ======================================================
  // PHASE 2 — FINALIZATION (PAYROLL + ATTENDANCE)
  // ======================================================
  async finalizeLeaveRequest(leaveRequestId: string) {
    const leave = await this.requestModel.findById(leaveRequestId);
    if (!leave) throw new NotFoundException('Request not found');

    if (leave.status !== LeaveStatus.APPROVED)
      throw new BadRequestException('Not approved yet');

    const entitlement = await this.entitlementModel.findOne({
      employeeId: leave.employeeId,
      leaveTypeId: leave.leaveTypeId,
    });

    if (entitlement) {
      // M1 model: use durationDays for final deduction
      entitlement.taken += leave.durationDays ?? 0;
      entitlement.remaining -= leave.durationDays ?? 0;
      await entitlement.save();
    }

    console.log(`Notify employee ${leave.employeeId}`);
    console.log(`Notify manager about approval`);
    console.log(`Block attendance for ${leave.employeeId}`);
    console.log(`Adjust payroll for paid/unpaid days`);

    const unapprovedOld = await this.requestModel.find({
      employeeId: leave.employeeId,
      status: LeaveStatus.PENDING,
      'dates.to': { $lt: new Date() },
    });

    for (const oldReq of unapprovedOld) {
      const ent = await this.entitlementModel.findOne({
        employeeId: oldReq.employeeId,
        leaveTypeId: oldReq.leaveTypeId,
      });
      if (ent) {
        const deduction = oldReq.durationDays ?? 0;
        ent.remaining -= deduction;
        await ent.save();
        console.log(`Retroactive deduction of ${deduction} days`);
      }
    }

    return leave;
  }

  // ======================================================
  // PHASE 2 — AUTO-ESCALATION (BR-28)
  // ======================================================
  async autoEscalateManagerApprovals() {
    const now = new Date();
    const leavesToEscalate = await this.requestModel.find({
      'approvalFlow.role': 'Manager',
      'approvalFlow.status': 'pending',
      'approvalFlow.escalationAt': { $lte: now },
    });

    for (const leave of leavesToEscalate) {
      const approvalFlow = leave.approvalFlow as ApprovalStepExtended[];
      let updated = false;

      approvalFlow.forEach(step => {
        if (
          step.role === 'Manager' &&
          step.status === 'pending' &&
          step.escalationAt &&
          step.escalationAt <= now
        ) {
          step.role = 'HR';
          step.status = 'pending';
          step.assignedTo = undefined;
          updated = true;
        }
      });

      if (updated) await leave.save();
    }

    return leavesToEscalate.length;
  }
}
