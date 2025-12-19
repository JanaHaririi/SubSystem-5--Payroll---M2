import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationLogService } from '../time-management/services/notification-log.service';
import { GetSchedulerDto } from './dto/get-scheduler.dto';


// MODELS
import { LeaveCategory } from './models/leave-category.schema';
import { LeaveType } from './models/leave-type.schema';
import { LeavePolicy } from './models/leave-policy.schema';
import { Holiday } from '../time-management/models/holiday.schema'; import { Calendar } from './models/calendar.schema';
import { ApprovalWorkflow } from './models/approval-workflow.schema';
import { LeaveEntitlement } from './models/leave-entitlement.schema';
import { LeaveRequest, LeaveRequestDocument } from './models/leave-request.schema';
import { EmployeeProfile, EmployeeProfileDocument } from '../employee-profile/models/employee-profile.schema';
import { LeaveStatus } from './enums/leave-status.enum';
import { AccrualMethod } from './enums/accrual-method.enum';
import { HolidayType } from '../time-management/models/enums/index';
import { payType, payTypeDocument } from '../payroll-configuration/models/payType.schema';
import { Delegation, DelegationDocument } from './models/delegation.schema';
import { SystemRole } from '../employee-profile/enums/employee-profile.enums';


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
import { CreateHolidayDto } from './dto/create-holiday.dto';
import { UpdateHolidayDto } from './dto/update-holiday.dto';
import { CreateDelegationDto } from './dto/create-delegation.dto';
import { UpdateDelegationDto } from './dto/update-delegation.dto';

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
    @InjectModel(payType.name) private payTypeModel: Model<payTypeDocument>,
    @InjectModel(LeavePolicy.name) private readonly policyModel: Model<LeavePolicy>,
    @InjectModel(Holiday.name) private readonly holidayModel: Model<Holiday>,
    @InjectModel(Calendar.name) private readonly calendarModel: Model<Calendar>,
    @InjectModel(ApprovalWorkflow.name) private readonly workflowModel: Model<ApprovalWorkflow>,
    @InjectModel(LeaveEntitlement.name) private readonly entitlementModel: Model<LeaveEntitlement>,
    @InjectModel(LeaveRequest.name) private readonly requestModel: Model<LeaveRequest>,
    @InjectModel('LeavePaycodeMapping') private readonly paycodeModel: Model<any>,
    @InjectModel('Attachment') private readonly attachmentModel: Model<any>,
    @InjectModel('LeaveAdjustment') private readonly adjustmentModel: Model<any>,
    @InjectModel(EmployeeProfile.name) private readonly employeeModel: Model<EmployeeProfile>,
    @InjectModel(Delegation.name) private readonly delegationModel: Model<DelegationDocument>,
    private readonly notificationLogService: NotificationLogService,
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

  // new version with payroll link
  async getAllLeaveTypes(): Promise<any[]> {
    // fetch all leave types
    const leaveTypes = await this.typeModel.find().lean();

    // fetch approved payroll types
    const payrolls = await this.payTypeModel.find({ status: 'APPROVED' }).lean();

    // map leave types to payroll info
    return leaveTypes.map(lt => {
      const payroll = payrolls.find(p => p.type === lt.code); // link by code -> type
      return {
        ...lt,
        payrollAmount: payroll ? payroll.amount : null,
        payrollStatus: payroll ? payroll.status : null,
      };
    });
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
    // Validate leaveTypeId before anything else
    if (!dto.leaveTypeId || !Types.ObjectId.isValid(dto.leaveTypeId)) {
      throw new BadRequestException('Invalid or missing leaveTypeId');
    }

    const exists = await this.policyModel.findOne({ leaveTypeId: dto.leaveTypeId });
    if (exists) throw new BadRequestException('Policy already exists for this leave type');

    return this.policyModel.create(dto);
  }


  getAllPolicies() {
    return this.policyModel
      .find()
      .populate({
        path: 'leaveTypeId',
        select: 'name code categoryId',
        populate: { path: 'categoryId', select: 'name' },
      })
      .lean()
      .then(policies =>
        policies
          .filter(p => p.leaveTypeId && typeof p.leaveTypeId === 'object') // ✅ skip broken ones
          .map(p => ({
            ...p,
            leaveType: p.leaveTypeId,
            leaveTypeId: (p.leaveTypeId as any)?._id,
          })),
      );
  }


  updatePolicy(id: string, dto: UpdateLeavePolicyDto) {
    return this.policyModel.findByIdAndUpdate(id, dto, { new: true });
  }

  async deletePolicy(id: string) {
    const used = await this.entitlementModel.exists({ policyId: id });
    if (used) throw new BadRequestException('Cannot delete policy linked to entitlements');
    return this.policyModel.findByIdAndDelete(id);
  }
  // ========================
  // HOLIDAYS (Simple CRUD)
  // ========================
  // ======================================================
  // HOLIDAY CRUD (using Time Management schema)
  // ======================================================
  async createHoliday(dto: CreateHolidayDto) {
    // Validate holiday type using the imported enum
    const validTypes = Object.values(HolidayType);
    if (!validTypes.includes(dto.type as HolidayType)) {
      throw new BadRequestException(`Invalid holiday type. Valid types: ${validTypes.join(', ')}`);
    }

    const startDate = new Date(dto.startDate);
    const endDate = dto.endDate ? new Date(dto.endDate) : startDate;

    if (endDate < startDate) {
      throw new BadRequestException('End date must be after or equal to start date');
    }

    // Check for overlapping active holidays
    const overlappingHoliday = await this.holidayModel.findOne({
      active: true,
      $or: [
        { startDate: { $lte: endDate }, endDate: { $gte: startDate } },
      ],
    });

    if (overlappingHoliday) {
      throw new BadRequestException('Holiday overlaps with an existing active holiday');
    }

    return this.holidayModel.create({
      type: dto.type,
      startDate,
      endDate,
      name: dto.name,
      active: true,
    });
  }

  async getAllHolidays(year?: number) {
    const query: any = { active: true };

    if (year) {
      query.$or = [
        { startDate: { $gte: new Date(`${year}-01-01`), $lte: new Date(`${year}-12-31`) } },
        { endDate: { $gte: new Date(`${year}-01-01`), $lte: new Date(`${year}-12-31`) } },
        {
          $and: [
            { startDate: { $lte: new Date(`${year}-01-01`) } },
            { endDate: { $gte: new Date(`${year}-12-31`) } }
          ]
        }
      ];
    }

    return this.holidayModel
      .find(query)
      .sort({ startDate: 1 })
      .exec();
  }

  async updateHoliday(id: string, dto: UpdateHolidayDto) {
    const holiday = await this.holidayModel.findById(id);
    if (!holiday) {
      throw new NotFoundException('Holiday not found');
    }

    const updates: any = {};

    if (dto.type !== undefined) {
      // Validate against the enum
      const validTypes = Object.values(HolidayType);
      if (!validTypes.includes(dto.type as HolidayType)) {
        throw new BadRequestException(`Invalid holiday type. Valid types: ${validTypes.join(', ')}`);
      }
      updates.type = dto.type;
    }

    if (dto.startDate !== undefined) {
      updates.startDate = new Date(dto.startDate);
    }

    if (dto.endDate !== undefined) {
      updates.endDate = new Date(dto.endDate);
    }

    if (dto.name !== undefined) {
      updates.name = dto.name;
    }

    if (dto.active !== undefined) {
      updates.active = dto.active;
    }

    // If updating dates, check for overlaps with other active holidays
    if (dto.startDate || dto.endDate) {
      const startDate = updates.startDate || holiday.startDate;
      const endDate = updates.endDate || holiday.endDate;

      const overlappingHoliday = await this.holidayModel.findOne({
        _id: { $ne: id },
        active: true,
        $or: [
          { startDate: { $lte: endDate }, endDate: { $gte: startDate } },
        ],
      });

      if (overlappingHoliday) {
        throw new BadRequestException('Updated dates overlap with an existing active holiday');
      }
    }

    return this.holidayModel.findByIdAndUpdate(id, updates, { new: true });
  }

  async deleteHoliday(id: string) {
    const holiday = await this.holidayModel.findById(id);
    if (!holiday) {
      throw new NotFoundException('Holiday not found');
    }

    // Check if this holiday is referenced in any calendar
    const calendarsWithHoliday = await this.calendarModel.find({
      holidays: new Types.ObjectId(id),
    });

    if (calendarsWithHoliday.length > 0) {
      throw new BadRequestException(
        'Cannot delete holiday because it is referenced in one or more calendars. Remove it from calendars first.'
      );
    }

    // Soft delete by setting active to false
    holiday.active = false;
    return holiday.save();
  }

  // ======================================================
  // CALENDAR METHODS (same as before)
  // ======================================================
  async createCalendar(dto: CreateCalendarDto) {
    const existingCalendar = await this.calendarModel.findOne({ year: dto.year });
    if (existingCalendar) {
      throw new BadRequestException(`Calendar for year ${dto.year} already exists`);
    }
    return this.calendarModel.create(dto);
  }

  async getCalendarByYear(year: number) {
    const calendar = await this.calendarModel
      .findOne({ year })
      .populate({
        path: 'holidays',
        match: { active: true },
        select: 'type startDate endDate name active',
      })
      .lean();

    if (!calendar) {
      throw new NotFoundException(`Calendar for year ${year} not found`);
    }

    return calendar;
  }

  // ... rest of your calendar methods remain the same
  // (addHoliday, removeHoliday, addBlockedPeriod, removeBlockedPeriod, calculateNetLeaveDays)

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
  async createEntitlementForEmployee(employee: any) {
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
  // ENTITLEMENT CRUD
  // ======================================================
  async getAllEntitlements() {
    return this.entitlementModel
      .find()
      .populate({
        path: 'employeeId',
        select: 'firstName lastName fullName workEmail', // Explicitly select fields
        // Add this to handle null references gracefully:
        options: {
          // This ensures empty results instead of throwing errors
          // Or you can use a different approach:
          // strictPopulate: false
        }
      })
      .populate('leaveTypeId')
      .lean()
      .then(entitlements =>
        entitlements.map(ent => ({
          ...ent,
          // Ensure employeeId has a fallback structure if null
          employeeId: ent.employeeId || {
            _id: null,
            firstName: 'Unknown',
            lastName: 'Employee',
            fullName: 'Unknown Employee',
            workEmail: 'N/A'
          }
        }))
      )

  }

  async getEmployeeEntitlements(employeeId: string) {
    return this.entitlementModel
      .find({ employeeId: new Types.ObjectId(employeeId) })
      .populate('leaveTypeId')
      .exec();
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
  async saveAttachment(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const created = await this.attachmentModel.create({
      originalName: file.originalname,
      filePath: file.path.replace(/\\/g, '/'), // normalize slashes on Windows
      fileType: file.mimetype,
      size: file.size,
    });

    return created;
  }
  // ======================================================
  // PHASE 2 — LEAVE REQUEST SUBMISSION
  // ======================================================
  // Service
  async createLeaveRequest(employeeId: string, dto: CreateLeaveRequestDto) {
    // employeeId here IS the EmployeeProfile._id
    const employeeProfile = await this.employeeModel.findById(employeeId);

    if (!employeeProfile) {
      throw new NotFoundException('Employee profile not found for current user');
    }

    const employeeObjectId = employeeProfile._id; // same as before

    const leaveType = await this.typeModel.findById(dto.leaveTypeId);
    if (!leaveType) throw new NotFoundException('Leave type not found');

    // REQ-028: Enhanced document validation
    if (leaveType.requiresAttachment && !dto.attachmentId) {
      throw new BadRequestException('Attachment is required for this leave type');
    }

    if (dto.attachmentId) {
      const attachment = await this.attachmentModel.findById(dto.attachmentId);
      if (!attachment) {
        throw new NotFoundException('Attachment not found');
      }

      // Validate file type (allow common document types)
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (attachment.fileType && !allowedTypes.includes(attachment.fileType.toLowerCase())) {
        throw new BadRequestException('Invalid file type. Allowed: PDF, JPG, PNG, DOC, DOCX');
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (attachment.size && attachment.size > maxSize) {
        throw new BadRequestException('File size exceeds 10MB limit');
      }
    }

    const from = new Date(dto.from);
    const to = new Date(dto.to);

    if (to < from) throw new BadRequestException('Invalid date range');

    const durationDays =
      Math.ceil((to.getTime() - from.getTime()) / (1000 * 3600 * 24)) + 1;

    const policy = await this.policyModel.findOne({ leaveTypeId: leaveType._id });

    if (policy?.maxConsecutiveDays && durationDays > policy.maxConsecutiveDays)
      throw new BadRequestException(`Exceeds maximum consecutive days`);

    // REQ-031: Fixed post-leave request grace period logic
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // If this is a post-leave request (to date is in the past)
    if (to < today) {
      const gracePeriodDays = policy?.maxGracePeriodDays || policy?.minNoticeDays || 7; // Default 7 days
      const daysSinceEnd = Math.ceil((today.getTime() - to.getTime()) / 86400000);

      if (daysSinceEnd > gracePeriodDays) {
        throw new BadRequestException(
          `Post-leave request grace period exceeded. Maximum ${gracePeriodDays} days allowed after leave end date.`
        );
      }
    }

    // Entitlement uses employeeId referencing EmployeeProfile._id
    const entitlement = await this.entitlementModel.findOne({
      employeeId: employeeObjectId,
      leaveTypeId: leaveType._id,
    });

    if (!entitlement)
      throw new NotFoundException('No entitlement found for employee');

    const remaining = entitlement.remaining;

    // BR-29: Convert excess to unpaid leave instead of blocking
    let paidDays = durationDays;
    let unpaidDays = 0;

    if (durationDays > remaining) {
      unpaidDays = durationDays - remaining;
      paidDays = remaining;

      // If no remaining balance, all days are unpaid
      if (remaining <= 0) {
        paidDays = 0;
        unpaidDays = durationDays;
      }
    }
    // ===============================
    // IRREGULAR PATTERN DETECTION
    // ===============================

    // Define current month range (based on leave start date)
    const startOfMonth = new Date(from.getFullYear(), from.getMonth(), 1);
    const endOfMonth = new Date(from.getFullYear(), from.getMonth() + 1, 0);

    // Count how many leave requests this employee submitted this month
    const monthlyRequestCount = await this.requestModel.countDocuments({
      employeeId: employeeObjectId,
      createdAt: {
        $gte: startOfMonth,
        $lte: endOfMonth,
      },
    });

    // Rule: more than 3 leave requests in the same month
    const FREQUENT_REQUEST_THRESHOLD = 3;
    const frequentLeaveFlag = monthlyRequestCount >= FREQUENT_REQUEST_THRESHOLD;

    // Final irregular flag:
    // - unpaid days
    // - OR too many requests in same month
    const irregularPatternFlag =
      unpaidDays > 0 || frequentLeaveFlag;

    const departmentId = employeeProfile.primaryDepartmentId;
    if (departmentId) {
      const teamMembers = await this.employeeModel
        .find({ primaryDepartmentId: departmentId })
        .select('_id');
      const teamIds = teamMembers.map((e) => e._id.toString());

      const overlaps = await this.requestModel.countDocuments({
        employeeId: { $in: teamIds },
        status: LeaveStatus.APPROVED,
        $or: [{ 'dates.from': { $lte: to }, 'dates.to': { $gte: from } }],
      });

      const maxAllowed = Math.ceil(teamIds.length * 0.3);
      if (overlaps >= maxAllowed)
        throw new BadRequestException('Team scheduling conflict');
    }

    const overlapReq = await this.requestModel.findOne({
      employeeId: employeeObjectId,
      status: LeaveStatus.APPROVED,
      $or: [{ 'dates.from': { $lte: to }, 'dates.to': { $gte: from } }],
    });

    if (overlapReq)
      throw new BadRequestException('Overlaps with approved leave');

    const workflow = await this.workflowModel.findOne({ leaveTypeId: leaveType._id });
    const approvalFlow: ApprovalStepExtended[] = workflow
      ? workflow.flow.map((s) => ({ role: s.role, status: 'pending' }))
      : [];

    // Set escalation time for manager step (48 hours from now)
    const managerStep = approvalFlow.find(s => s.role === 'Manager');
    if (managerStep) {
      managerStep.escalationAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
    }

    const leaveRequest = await this.requestModel.create({
      employeeId: employeeObjectId,
      leaveTypeId: leaveType._id,
      dates: { from, to },
      durationDays,
      paidDays,
      unpaidDays,
      justification: dto.justification,
      attachmentId: dto.attachmentId
        ? new Types.ObjectId(dto.attachmentId)
        : undefined,
      approvalFlow,
      status: LeaveStatus.PENDING,
      irregularPatternFlag,
    });

    // REQ-030, REQ-042: Send notifications
    try {
      // Notify employee
      await this.notificationLogService.sendNotification({
        to: employeeObjectId,
        type: 'Leave Request Submitted',
        message: `Your leave request for ${durationDays} day(s) (${paidDays} paid, ${unpaidDays > 0 ? unpaidDays + ' unpaid' : ''}) has been submitted and is pending approval.`,
      });

      // Find and notify manager
      const manager = await this.employeeModel.findOne({
        primaryDepartmentId: employeeProfile.primaryDepartmentId,
        systemRole: { $in: ['Manager', SystemRole.DEPARTMENT_HEAD] },
      });

      if (manager) {
        await this.notificationLogService.sendNotification({
          to: manager._id,
          type: 'Leave Request Pending Approval',
          message: `${employeeProfile.fullName || employeeProfile.firstName} has submitted a leave request for ${durationDays} day(s) from ${from.toLocaleDateString()} to ${to.toLocaleDateString()}. Please review.`,
        });
      }
    } catch (error) {
      // Log but don't fail the request if notification fails
      console.error('Failed to send notification:', error);
    }

    return leaveRequest;
  }

  // ======================================================
  // PHASE 2 — GET REQUESTS
  // ======================================================
  getAllLeaveRequests() {
    return this.requestModel
      .find()
      .populate({
        path: 'employeeId',
        model: EmployeeProfile.name, // ✅ use the imported model class name
        select: 'firstName lastName fullName workEmail',
      })
      .populate({
        path: 'leaveTypeId',
        model: LeaveType.name, // ✅ same here
        select: 'name',
      })
      .populate({
        path: 'attachmentId',
        select: 'fileName',
      })
      .lean()
      .exec();
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
  async routeToManager(leaveRequestId: string) {
    const leave = await this.requestModel.findById(leaveRequestId);
    if (!leave) throw new NotFoundException('Leave request not found');

    const employee = await this.employeeModel.findById(leave.employeeId);
    if (!employee) throw new NotFoundException('Employee not found');

    const manager = await this.employeeModel.findOne({
      primaryDepartmentId: employee.primaryDepartmentId,
      systemRole: { $in: ['Manager', 'DEPARTMENT_MANAGER', 'DEPARTMENT_HEAD'] },
    });

    if (!manager) {
      throw new NotFoundException('Manager not assigned');
    }

    // 🔹 CHECK DELEGATION
    const delegation = await this.getDelegationByManager(manager._id.toString());

    const step: ApprovalStepExtended = {
      role: 'Manager',
      assignedTo: manager._id,
      status: 'pending',
      escalationAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
    };

    if (delegation) {
      step.delegateTo = new Types.ObjectId(delegation.delegateManagerId);
    }

    leave.approvalFlow.push(step);
    await leave.save();

    return leave;
  }

  private async getEmployeeRoles(employeeId: string): Promise<string[]> {
    // First check employee_system_roles collection
    const systemRoleDoc = await this.employeeModel.aggregate([
      { $match: { _id: new Types.ObjectId(employeeId) } },
      {
        $lookup: {
          from: 'employee_system_roles',
          localField: '_id',
          foreignField: 'employeeProfileId',
          as: 'systemRoles'
        }
      },
      { $unwind: { path: '$systemRoles', preserveNullAndEmptyArrays: true } }
    ]);

    if (systemRoleDoc.length > 0 && systemRoleDoc[0].systemRoles) {
      const roles = systemRoleDoc[0].systemRoles.roles || [];
      console.log('Roles from employee_system_roles:', roles);
      return roles;
    }

    // Fallback: check based on position/department
    const employee = await this.employeeModel.findById(employeeId);
    if (!employee) {
      return [];
    }

    // You can add logic here based on employee's position/title
    // For now, return empty
    return [];
  }




  // ======================================================
  // PHASE 2 — MANAGER DECISION (REQ-021 / REQ-022)
  // ======================================================
  async managerDecision(
    leaveId: string,
    managerId: string,
    decision: 'approved' | 'rejected',
  ) {
    console.log('=== DEBUG MANAGER DECISION START ===');

    // 1. Load leave request
    const leave = await this.requestModel.findById(leaveId);
    if (!leave) throw new NotFoundException('Leave request not found');

    // 2. Get manager trying to approve
    const manager = await this.employeeModel.findById(managerId);
    if (!manager) throw new NotFoundException('Manager not found');

    // 3. Get manager's actual roles from database
    const systemRoleDoc = await this.employeeModel.aggregate([
      { $match: { _id: new Types.ObjectId(managerId) } },
      {
        $lookup: {
          from: 'employee_system_roles',
          localField: '_id',
          foreignField: 'employeeProfileId',
          as: 'systemRoles'
        }
      },
      { $unwind: { path: '$systemRoles', preserveNullAndEmptyArrays: true } }
    ]);

    let managerRoles: string[] = [];
    if (systemRoleDoc.length > 0 && systemRoleDoc[0].systemRoles) {
      managerRoles = systemRoleDoc[0].systemRoles.roles || [];
    }

    console.log('Manager roles from DB:', managerRoles);

    // 4. Check if manager has any manager-like role
    const normalizedRoles = managerRoles.map(role => role.toLowerCase());
    const hasManagerRole = normalizedRoles.some(role =>
      role.includes('manager') ||
      role.includes('head') ||
      role.includes('admin')
    );

    if (!hasManagerRole) {
      console.log('FAIL: No manager role found');
      throw new ForbiddenException('You do not have manager permissions');
    }

    console.log('Authorization PASSED - Manager role found');

    // 5. Determine current step
    const workflow = await this.workflowModel.findOne({ leaveTypeId: leave.leaveTypeId });

    let currentStepRole: string;

    if (!workflow || workflow.flow.length === 0) {
      console.warn(`Approval workflow missing for leaveTypeId: ${leave.leaveTypeId}. Defaulting to Manager step.`);
      currentStepRole = 'Manager';
    } else {
      // Find the first pending step
      const pendingStepIndex = leave.approvalFlow.findIndex((step: any) => step.status === 'pending');

      if (pendingStepIndex === -1) {
        // Check if there are any steps at all
        if (leave.approvalFlow.length === 0) {
          // No steps yet, use first workflow step
          currentStepRole = workflow.flow[0]?.role || 'Manager';
        } else {
          throw new BadRequestException('No pending approval steps found');
        }
      } else {
        currentStepRole = workflow.flow[pendingStepIndex]?.role;
      }
    }

    console.log('Current step role:', currentStepRole);

    // 6. Map workflow role to actual roles (flexible mapping)
    // Since roles are lowercase with spaces, we need flexible matching
    const roleMapping: Record<string, string[]> = {
      'Manager': ['manager', 'department head', 'hr manager'], // Changed  to 'department head'
      'Department Head': ['department head', 'head'],
      'HR': ['hr admin', 'hr employee', 'hr'],
      
    };

    const allowedRolePatterns = roleMapping[currentStepRole] || [currentStepRole.toLowerCase()];
    const hasRequiredRole = normalizedRoles.some(role =>
      allowedRolePatterns.some(pattern => role.includes(pattern))
    );

    if (!hasRequiredRole) {
      console.log('Role mismatch. Manager has:', normalizedRoles, 'Workflow expects:', currentStepRole);

      // Allow department head to approve manager steps as fallback
      const isDepartmentHead = normalizedRoles.some(role => role.includes('head'));
      if (!isDepartmentHead) {
        throw new ForbiddenException(`You need ${currentStepRole} role to approve this step`);
      }
    }

    // 7. Record decision
    const approvalStep: ApprovalStepExtended = {
      role: currentStepRole,
      status: decision,
      decidedBy: new Types.ObjectId(managerId),
      decidedAt: new Date(),
    };

    // If department head overriding manager step
    if (currentStepRole === 'Manager' && normalizedRoles.some(role => role.includes('head'))) {
      approvalStep.overrideManager = true;
    }

    if (!leave.approvalFlow || leave.approvalFlow.length === 0) {
      leave.approvalFlow = [approvalStep];
    } else {
      leave.approvalFlow.push(approvalStep);
    }

    // 8. Update status and deduct entitlement
    leave.status = decision === 'approved' ? LeaveStatus.APPROVED : LeaveStatus.REJECTED;

    if (decision === 'approved') {
      const entitlement = await this.entitlementModel.findOne({
        employeeId: leave.employeeId,
        leaveTypeId: leave.leaveTypeId,
      });

      if (entitlement) {
        const paidDays = (leave as any).paidDays || leave.durationDays || 0;
        console.log('Deducting', paidDays, 'days from entitlement');
        entitlement.taken += paidDays;
        entitlement.remaining = Math.max(0, entitlement.remaining - paidDays);
        await entitlement.save();
      }
    }

    await leave.save();

    console.log('=== DEBUG MANAGER DECISION END ===');
    console.log('Leave saved with status:', leave.status);

    // 9. Send notification
    try {
      await this.notificationLogService.sendNotification({
        to: leave.employeeId,
        type: decision === 'approved' ? 'Manager Approved Leave' : 'Manager Rejected Leave',
        message: `Your leave request has been ${decision} by ${manager.fullName || 'your manager'}`,
      });
    } catch (error) {
      console.error('Failed to send notification:', error);
    }

    return leave;
  }





  // ======================================================
  // PHASE 2 — HR COMPLIANCE (REQ-025 / BR-41, REQ-028)
  // ======================================================
  async hrComplianceReview(
    leaveRequestId: string,
    hrId: string,
    action: 'approved' | 'rejected',
    overrideManager = false,
  ) {
    const leave = await this.requestModel.findById(leaveRequestId).populate('employeeId leaveTypeId attachmentId');
    if (!leave) throw new NotFoundException('Leave request not found');

    const approvalFlow = leave.approvalFlow as ApprovalStepExtended[];
    const managerStep = approvalFlow.find(s => s.role === 'Manager');

    if (!managerStep || (managerStep.status !== 'approved' && !overrideManager))
      throw new BadRequestException('Manager approval required first');

    // REQ-028: Document validation during HR review
    const leaveType = await this.typeModel.findById(leave.leaveTypeId);
    if (leaveType?.requiresAttachment && leave.attachmentId) {
      const attachment = await this.attachmentModel.findById(leave.attachmentId);
      if (!attachment) {
        throw new BadRequestException('Required attachment not found or invalid');
      }
      // Additional validation: check if document is recent (for medical certificates, etc.)
      // This is a placeholder - can be enhanced based on business rules
    } else if (leaveType?.requiresAttachment && !leave.attachmentId) {
      throw new BadRequestException('Required attachment is missing for this leave type');
    }

    const entitlement = await this.entitlementModel.findOne({
      employeeId: leave.employeeId,
      leaveTypeId: leave.leaveTypeId,
    });

    if (!entitlement)
      throw new NotFoundException('Entitlement not found');

    // BR-41: Cumulative limits check
    const paidDays = (leave as any).paidDays || leave.durationDays;
    if (entitlement.taken + paidDays > entitlement.yearlyEntitlement) {
      throw new BadRequestException(
        `Exceeds yearly limit. Already taken: ${entitlement.taken}, Requested: ${paidDays}, Yearly limit: ${entitlement.yearlyEntitlement}`
      );
    }

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

    // REQ-030, REQ-042: Send notifications
    try {
      const employee = await this.employeeModel.findById(leave.employeeId);
      const hr = await this.employeeModel.findById(hrId);
      const leaveType = await this.typeModel.findById(leave.leaveTypeId);
      const manager = managerStep?.decidedBy
        ? await this.employeeModel.findById(managerStep.decidedBy)
        : null;

      // Notify employee
      await this.notificationLogService.sendNotification({
        to: leave.employeeId,
        type: action === 'approved' ? 'Leave Request Approved' : 'Leave Request Rejected',
        message: `Your leave request for ${leaveType?.name || 'leave'} (${leave.durationDays} days) has been ${action} by HR${overrideManager ? ' (override)' : ''}.${action === 'approved' ? ' Your leave balance will be updated accordingly.' : ''}`,
      });

      // Notify manager if approved
      if (action === 'approved' && manager) {
        await this.notificationLogService.sendNotification({
          to: manager._id,
          type: 'Team Member Leave Approved',
          message: `The leave request from ${employee?.fullName || employee?.firstName || 'your team member'} has been approved by HR and finalized.`,
        });
      }
    } catch (error) {
      console.error('Failed to send notification:', error);
    }

    // If approved, finalize the request
    if (action === 'approved') {
      await this.finalizeLeaveRequest(leaveRequestId);
    }

    return leave;
  }

  // ======================================================
  // PHASE 2 — FINALIZATION (REQ-029, BR-19)
  // ======================================================
  async finalizeLeaveRequest(leaveRequestId: string) {
    const leave = await this.requestModel.findById(leaveRequestId).populate('employeeId leaveTypeId');
    if (!leave) throw new NotFoundException('Request not found');

    if (leave.status !== LeaveStatus.APPROVED)
      throw new BadRequestException('Not approved yet');

    const entitlement = await this.entitlementModel.findOne({
      employeeId: leave.employeeId,
      leaveTypeId: leave.leaveTypeId,
    });

    if (entitlement) {
      // REQ-029: Use paidDays for deduction (unpaid days don't affect balance)
      const paidDays = (leave as any).paidDays || leave.durationDays;
      entitlement.taken += paidDays;
      entitlement.remaining = Math.max(0, entitlement.remaining - paidDays);
      await entitlement.save();
    }

    // REQ-030, REQ-042: Send final approval notifications
    try {
      const employee = await this.employeeModel.findById(leave.employeeId);
      const leaveType = await this.typeModel.findById(leave.leaveTypeId);
      const paidDays = (leave as any).paidDays || leave.durationDays;
      const unpaidDays = (leave as any).unpaidDays || 0;

      // Notify employee
      await this.notificationLogService.sendNotification({
        to: leave.employeeId,
        type: 'Leave Request Finalized',
        message: `Your leave request for ${leaveType?.name || 'leave'} has been finalized. ${paidDays} paid day(s)${unpaidDays > 0 ? ` and ${unpaidDays} unpaid day(s)` : ''} from ${new Date(leave.dates.from).toLocaleDateString()} to ${new Date(leave.dates.to).toLocaleDateString()}. Your leave balance has been updated.`,
      });

      // Notify manager
      const employeeProfile = await this.employeeModel.findById(leave.employeeId);
      if (employeeProfile?.primaryDepartmentId) {
        const manager = await this.employeeModel.findOne({
          primaryDepartmentId: employeeProfile.primaryDepartmentId,
          systemRole: { $in: ['Manager', SystemRole.DEPARTMENT_HEAD] },
        });

        if (manager) {
          await this.notificationLogService.sendNotification({
            to: manager._id,
            type: 'Team Member Leave Finalized',
            message: `${employee?.fullName || employee?.firstName || 'A team member'}'s leave request has been finalized and their attendance will be blocked for the leave period.`,
          });
        }
      }
    } catch (error) {
      console.error('Failed to send notification:', error);
    }

    // BR-19: Retroactive deductions for unapproved absences
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
        // Only deduct if there's remaining balance
        if (ent.remaining > 0) {
          const actualDeduction = Math.min(deduction, ent.remaining);
          ent.remaining -= actualDeduction;
          ent.taken += actualDeduction;
          await ent.save();

          // Notify employee about retroactive deduction
          try {
            await this.notificationLogService.sendNotification({
              to: oldReq.employeeId,
              type: 'Retroactive Leave Deduction',
              message: `Your unapproved absence from ${new Date(oldReq.dates.from).toLocaleDateString()} to ${new Date(oldReq.dates.to).toLocaleDateString()} has resulted in a retroactive deduction of ${actualDeduction} day(s) from your leave balance.`,
            });
          } catch (error) {
            console.error('Failed to send retroactive deduction notification:', error);
          }
        }
      }
    }

    return leave;
  }

  // ======================================================
  // PHASE 2 — AUTO-ESCALATION (BR-28)
  // ======================================================
  @Cron(CronExpression.EVERY_HOUR) // Run every hour
  async autoEscalateManagerApprovals() {
    const now = new Date();
    const leavesToEscalate = await this.requestModel.find({
      status: LeaveStatus.PENDING,
      'approvalFlow.role': 'Manager',
      'approvalFlow.status': 'pending',
      'approvalFlow.escalationAt': { $lte: now },
    }).populate('employeeId leaveTypeId');

    let escalatedCount = 0;

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
          // Escalate to HR
          const hrStep = approvalFlow.find(s => s.role === 'HR');
          if (hrStep && hrStep.status === 'pending') {
            hrStep.escalationAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
          } else if (!hrStep) {
            // Add HR step if it doesn't exist
            approvalFlow.push({
              role: 'HR',
              status: 'pending',
              escalationAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
            });
          }

          // Mark manager step as escalated
          step.status = 'escalated';
          updated = true;
          escalatedCount++;
        }
      });

      if (updated) {
        await leave.save();

        // REQ-030, REQ-042: Notify about escalation
        try {
          const employee = await this.employeeModel.findById(leave.employeeId);
          const leaveType = await this.typeModel.findById(leave.leaveTypeId);

          // Notify employee
          await this.notificationLogService.sendNotification({
            to: leave.employeeId,
            type: 'Leave Request Auto-Escalated',
            message: `Your leave request for ${leaveType?.name || 'leave'} (${leave.durationDays} days) has been automatically escalated to HR after 48 hours of no manager response.`,
          });

          // Notify HR
          const hrAdmins = await this.employeeModel.find({
            systemRole: { $in: ['HR_ADMIN', 'HR_EMPLOYEE'] },
          }).limit(5);

          for (const hr of hrAdmins) {
            await this.notificationLogService.sendNotification({
              to: hr._id,
              type: 'Leave Request Escalated',
              message: `A leave request from ${employee?.fullName || employee?.firstName || 'Employee'} has been auto-escalated to HR after manager did not respond within 48 hours.`,
            });
          }
        } catch (error) {
          console.error('Failed to send escalation notification:', error);
        }
      }
    }

    if (escalatedCount > 0) {
      console.log(`Auto-escalated ${escalatedCount} leave request(s)`);
    }

    return escalatedCount;
  }
  // Add this method for employee balance
  // ======================================================
  // PHASE 2 — EMPLOYEE SELF-SERVICE HELPERS
  // ======================================================
  async getEmployeeBalance(employeeId: string) {
    const balance = await this.entitlementModel
      .find({ employeeId: new Types.ObjectId(employeeId) })
      .populate('leaveTypeId')
      .lean();

    return balance;
  }

  async getEmployeeRequests(employeeId: string) {
    const requests = await this.requestModel
      .find({ employeeId: new Types.ObjectId(employeeId) })
      .populate('leaveTypeId')
      .populate('attachmentId')
      .sort({ createdAt: -1 })
      .lean();

    return requests;
  }

  // ======================================================
  // PHASE 2 — MANUAL ADJUSTMENTS (REQ-013)
  // ======================================================
  async createAdjustment(dto: {
    employeeId: string;
    leaveTypeId: string;
    adjustmentType: 'add' | 'deduct' | 'encashment';
    amount: number;
    reason: string;
    hrUserId: string;
  }) {
    const { employeeId, leaveTypeId, adjustmentType, amount, reason, hrUserId } = dto;

    if (!amount || amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    if (!['add', 'deduct', 'encashment'].includes(adjustmentType)) {
      throw new BadRequestException('Invalid adjustment type');
    }

    // Find entitlement
    const entitlement = await this.entitlementModel.findOne({
      employeeId: new Types.ObjectId(employeeId),
      leaveTypeId: new Types.ObjectId(leaveTypeId),
    });

    if (!entitlement) {
      throw new NotFoundException(
        'Entitlement not found for this employee and leave type',
      );
    }

    // Compute new remaining
    let newRemaining = entitlement.remaining;

    if (adjustmentType === 'add') {
      newRemaining += amount;
    } else {
      // both 'deduct' and 'encashment' reduce balance
      newRemaining = Math.max(0, entitlement.remaining - amount);
    }

    entitlement.remaining = newRemaining;
    await entitlement.save();

    // Save adjustment record
    const adjustment = await this.adjustmentModel.create({
      employeeId: new Types.ObjectId(employeeId),
      leaveTypeId: new Types.ObjectId(leaveTypeId),
      adjustmentType,
      amount,
      reason,
      hrUserId: new Types.ObjectId(hrUserId),
      createdAt: new Date(),
    });

    return {
      message: 'Adjustment applied successfully',
      entitlement,
      adjustment,
    };
  }

  // ======================================================
  // PHASE 2 — ENCASHMENT CALCULATION (BR-52/53)
  // ======================================================
  async calculateEncashment(employeeId: string, leaveTypeId: string) {
    const entitlement = await this.entitlementModel.findOne({
      employeeId: new Types.ObjectId(employeeId),
      leaveTypeId: new Types.ObjectId(leaveTypeId),
    });

    if (!entitlement) {
      throw new NotFoundException('Entitlement not found');
    }

    const unusedDays = Math.min(entitlement.remaining, 30); // Cap at 30 days (BR-53)

    // In real system, you'd fetch daily salary rate from Payroll module
    const dailySalaryRate = 100; // Placeholder - should come from Payroll

    const encashmentAmount = dailySalaryRate * unusedDays;

    return {
      unusedDays,
      dailySalaryRate,
      encashmentAmount,
      formula: 'DailySalaryRate × NumberOfUnusedLeaveDays (capped at 30)',
    };
  }

  // ======================================================
  // PHASE 2 — ADJUSTMENT REPORTING
  // ======================================================
  async getAllAdjustments() {
    return this.adjustmentModel
      .find()
      .populate('employeeId')
      .populate('leaveTypeId')
      .populate('hrUserId')
      .exec();
  }
  async getManagerTeamOverview(managerId: string) {
    const managerObjectId = new Types.ObjectId(managerId);

    // --------------------------------------------------
    // 1) Direct reports
    // --------------------------------------------------
    const directEmployees = await this.employeeModel
      .find({ managerId: managerObjectId })
      .select('_id fullName workEmail departmentName positionTitle')
      .lean();

    // --------------------------------------------------
    // 2) Delegations TO this manager
    // --------------------------------------------------
    const delegations = await this.delegationModel.find({
      delegateTo: managerObjectId,
      active: true,
    });

    const delegatedManagerIds = delegations.map(d => d.managerId);

    // --------------------------------------------------
    // 3) Employees of delegated managers
    // --------------------------------------------------
    const delegatedEmployees = delegatedManagerIds.length
      ? await this.employeeModel
        .find({ managerId: { $in: delegatedManagerIds } })
        .select('_id fullName workEmail departmentName positionTitle')
        .lean()
      : [];

    // --------------------------------------------------
    // 4) Merge & de-duplicate employees
    // --------------------------------------------------
    const allEmployeesMap = new Map<string, any>();

    [...directEmployees, ...delegatedEmployees].forEach(emp => {
      allEmployeesMap.set(emp._id.toString(), emp);
    });

    const employees = Array.from(allEmployeesMap.values());

    if (employees.length === 0) {
      return [];
    }

    const employeeIds = employees.map(e => e._id);

    // --------------------------------------------------
    // 5) Leave requests
    // --------------------------------------------------
    const requests = await this.requestModel
      .find({ employeeId: { $in: employeeIds } })
      .populate('leaveTypeId', 'name')
      .lean();

    // --------------------------------------------------
    // 6) Entitlements
    // --------------------------------------------------
    const entitlements = await this.entitlementModel
      .find({ employeeId: { $in: employeeIds } })
      .lean();

    const today = new Date();

    return employees.map(emp => {
      const empIdStr = emp._id.toString();

      const empRequests = requests.filter(
        r => r.employeeId?.toString() === empIdStr,
      );

      const pendingRequests = empRequests.filter(
        r => (r.status || '').toLowerCase() === 'pending',
      );

      const onLeaveTodayReq = empRequests.find(r => {
        if ((r.status || '').toLowerCase() !== 'approved') return false;
        const from = new Date(r.dates.from);
        const to = new Date(r.dates.to);
        return from <= today && to >= today;
      });

      const entitlement = entitlements.find(
        en => en.employeeId?.toString() === empIdStr,
      );

      return {
        _id: emp._id.toString(),
        fullName: emp.fullName,
        workEmail: emp.workEmail,
        departmentName: (emp as any).departmentName,
        positionTitle: (emp as any).positionTitle,
        onLeaveToday: !!onLeaveTodayReq,
        pendingRequestsCount: pendingRequests.length,
        currentLeave: onLeaveTodayReq
          ? {
            from: onLeaveTodayReq.dates.from,
            to: onLeaveTodayReq.dates.to,
            leaveTypeName:
              (onLeaveTodayReq.leaveTypeId as any)?.name ?? 'Leave',
          }
          : null,
        remainingAnnualDays: entitlement?.remaining ?? null,
      };
    });
  }




  // ===============================
  // DELEGATION
  // ===============================

  async createDelegation(managerId: string, dto: CreateDelegationDto) {
    if (new Date(dto.startDate) > new Date(dto.endDate)) {
      throw new BadRequestException('Start date must be before end date');
    }

    return this.delegationModel.create({
      managerId,
      delegateManagerId: dto.delegateManagerId,
      startDate: dto.startDate,
      endDate: dto.endDate,
      active: true,
    });
  }

  async getDelegationByManager(managerId: string) {
    return this.delegationModel.findOne({
      managerId,
      active: true,
    });
  }

  async updateDelegation(id: string, dto: UpdateDelegationDto) {
    return this.delegationModel.findByIdAndUpdate(id, dto, { new: true });
  }

  async deleteDelegation(id: string) {
    return this.delegationModel.findByIdAndDelete(id);
  }


}
