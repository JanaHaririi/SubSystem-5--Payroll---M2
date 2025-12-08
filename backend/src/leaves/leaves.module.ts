import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { LeavesController } from './leaves.controller';
import { LeavesService } from './leaves.service';

// MODELS
import { LeaveCategory, LeaveCategorySchema } from './models/leave-category.schema';
import { LeaveType, LeaveTypeSchema } from './models/leave-type.schema';
import { LeavePolicy, LeavePolicySchema } from './models/leave-policy.schema';
import { Calendar, CalendarSchema } from './models/calendar.schema';

import { ApprovalWorkflow, ApprovalWorkflowSchema } from './models/approval-workflow.schema';
import { LeaveEntitlement, LeaveEntitlementSchema } from './models/leave-entitlement.schema';
import { LeavePaycodeMapping, LeavePaycodeMappingSchema } from './models/leave-paycode-mapping.schema';
import { LeaveRequest, LeaveRequestSchema } from './models/leave-request.schema';
import { Attachment, AttachmentSchema } from './models/attachment.schema';
import { EmployeeProfile, EmployeeProfileSchema } from '../employee-profile/models/employee-profile.schema';

// PHASE 3 MODULES
import { LeaveTrackingModule } from './leave-tracking/leave-tracking.module';
import { LeaveRequestModule } from './leave-request/leave-request.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LeaveCategory.name, schema: LeaveCategorySchema },
      { name: LeaveType.name, schema: LeaveTypeSchema },
      { name: LeavePolicy.name, schema: LeavePolicySchema },
      { name: Calendar.name, schema: CalendarSchema },
      { name: ApprovalWorkflow.name, schema: ApprovalWorkflowSchema },
      { name: LeaveEntitlement.name, schema: LeaveEntitlementSchema },
      { name: LeavePaycodeMapping.name, schema: LeavePaycodeMappingSchema },
      { name: LeaveRequest.name, schema: LeaveRequestSchema },
      { name: Attachment.name, schema: AttachmentSchema },
      { name: EmployeeProfile.name, schema: EmployeeProfileSchema },
    ]),
    LeaveTrackingModule,
    LeaveRequestModule,
  ],
  controllers: [LeavesController],
  providers: [LeavesService],
  exports: [LeavesService],
})
export class LeavesModule {}
