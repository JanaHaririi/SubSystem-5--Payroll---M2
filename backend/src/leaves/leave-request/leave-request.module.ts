// src/leaves/leave-request/leave-request.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LeaveRequestController } from './leave-request.controller';
import { LeaveRequestService } from './leave-request.service';

import { LeaveRequest, LeaveRequestSchema } from '../models/leave-request.schema';
import { ApprovalWorkflow, ApprovalWorkflowSchema } from '../models/approval-workflow.schema';
import { LeaveEntitlement, LeaveEntitlementSchema } from '../models/leave-entitlement.schema';
import { LeavePolicy, LeavePolicySchema } from '../models/leave-policy.schema';
import { Calendar, CalendarSchema } from '../models/calendar.schema';
import { LeaveType, LeaveTypeSchema } from '../models/leave-type.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LeaveRequest.name, schema: LeaveRequestSchema },
      { name: ApprovalWorkflow.name, schema: ApprovalWorkflowSchema },
      { name: LeaveEntitlement.name, schema: LeaveEntitlementSchema },
      { name: LeavePolicy.name, schema: LeavePolicySchema },
      { name: Calendar.name, schema: CalendarSchema },
      { name: LeaveType.name, schema: LeaveTypeSchema },
    ]),
  ],
  controllers: [LeaveRequestController],
  providers: [LeaveRequestService],
  exports: [LeaveRequestService],
})
export class LeaveRequestModule {}
