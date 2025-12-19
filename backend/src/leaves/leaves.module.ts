import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';

import { LeavesController } from './leaves.controller';
import { LeavesService } from './leaves.service';

// MODELS
import { LeaveCategory, LeaveCategorySchema } from './models/leave-category.schema';
import { LeaveType, LeaveTypeSchema } from './models/leave-type.schema';
import { LeavePolicy, LeavePolicySchema } from './models/leave-policy.schema';
import { Calendar, CalendarSchema } from './models/calendar.schema';
import { Holiday, HolidaySchema } from '../time-management/models/holiday.schema';
import { ApprovalWorkflow, ApprovalWorkflowSchema } from './models/approval-workflow.schema';
import { LeaveEntitlement, LeaveEntitlementSchema } from './models/leave-entitlement.schema';
import { LeavePaycodeMapping, LeavePaycodeMappingSchema } from './models/leave-paycode-mapping.schema';
import { LeaveRequest, LeaveRequestSchema } from './models/leave-request.schema';
import { Attachment, AttachmentSchema } from './models/attachment.schema';
import { LeaveAdjustment, LeaveAdjustmentSchema } from './models/leave-adjustment.schema';
import { EmployeeProfile, EmployeeProfileSchema } from '../employee-profile/models/employee-profile.schema';
import { TimeManagementModule } from '../time-management/time-management.module';
import { payType, payTypeSchema } from '../payroll-configuration/models/payType.schema';
import { Delegation, DelegationSchema } from './models/delegation.schema';


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LeaveCategory.name, schema: LeaveCategorySchema },
      { name: LeaveType.name, schema: LeaveTypeSchema },
      { name: payType.name, schema: payTypeSchema },
      { name: LeavePolicy.name, schema: LeavePolicySchema },
      { name: Holiday.name, schema: HolidaySchema },
      { name: Calendar.name, schema: CalendarSchema },
      { name: ApprovalWorkflow.name, schema: ApprovalWorkflowSchema },
      { name: LeaveEntitlement.name, schema: LeaveEntitlementSchema },
      { name: LeavePaycodeMapping.name, schema: LeavePaycodeMappingSchema },
      { name: LeaveRequest.name, schema: LeaveRequestSchema },
      { name: Attachment.name, schema: AttachmentSchema },
      { name: LeaveAdjustment.name, schema: LeaveAdjustmentSchema },
      { name: EmployeeProfile.name, schema: EmployeeProfileSchema },
      { name: Delegation.name, schema: DelegationSchema },
    ]),
    forwardRef(() => TimeManagementModule), // For NotificationLogService
    ScheduleModule.forRoot(), // For cron jobs
  ],
  controllers: [LeavesController],
  providers: [LeavesService],
  exports: [LeavesService],
})
export class LeavesModule {}