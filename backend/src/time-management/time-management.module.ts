import { forwardRef, Module } from '@nestjs/common';
import { TimeManagementController } from './time-management.controller';
import { TimeManagementService } from './time-management.service';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationLogSchema, NotificationLog } from './models/notification-log.schema';
import { AttendanceCorrectionRequestSchema, AttendanceCorrectionRequest } from './models/attendance-correction-request.schema';
import { ShiftTypeSchema, ShiftType } from './models/shift-type.schema';
import { ScheduleRuleSchema, ScheduleRule } from './models/schedule-rule.schema';
import { AttendanceRecordSchema, AttendanceRecord } from './models/attendance-record.schema';
import { TimeExceptionSchema, TimeException } from './models/time-exception.schema';
import { OvertimeRuleSchema, OvertimeRule } from './models/overtime-rule.schema';
import { ShiftSchema, Shift } from './models/shift.schema';
import { ShiftAssignmentSchema, ShiftAssignment } from './models/shift-assignment.schema';
import { LatenessRule, latenessRuleSchema } from './models/lateness-rule.schema';
import { HolidaySchema, Holiday } from './models/holiday.schema';
import { EmployeeProfileModule } from '../employee-profile/employee-profile.module';
import { OrganizationStructureModule } from '../organization-structure/organization-structure.module';
import { NotificationLogService } from './services/notification-log.service';
import { ShiftAssignmentService } from './services/shift-assignment.service';
import { EmployeeProfile, EmployeeProfileSchema } from '../employee-profile/models/employee-profile.schema';
import { Department, DepartmentSchema } from '../organization-structure/models/department.schema';
import { Position, PositionSchema } from '../organization-structure/models/position.schema';
import { ScheduleRuleService } from './services/schedule-rule.service';
import { AttendanceRecordService } from './services/attendance-record.service';
import { AttendanceCorrectionRequestService } from './services/attendance-correction-request.service';  
import { HolidayService } from './services/holiday.service';
import { ShiftTypeService } from './services/shift-type.service';
import { ShiftService } from './services/shift.service';
import { LatenessRuleService } from './services/lateness-rule.service';
import { OvertimeRuleService } from './services/overtime-rule.service';
import { TimeExceptionService } from './services/time-exception.service';



@Module({
  imports: [MongooseModule.forFeature([
    { name: NotificationLog.name, schema: NotificationLogSchema },
    { name: AttendanceCorrectionRequest.name, schema: AttendanceCorrectionRequestSchema },
    { name: ShiftType.name, schema: ShiftTypeSchema },
    { name: ScheduleRule.name, schema: ScheduleRuleSchema },
    { name: AttendanceRecord.name, schema: AttendanceRecordSchema },
    { name: TimeException.name, schema: TimeExceptionSchema },
    { name: OvertimeRule.name, schema: OvertimeRuleSchema },
    { name: Shift.name, schema: ShiftSchema },
    { name: ShiftAssignment.name, schema: ShiftAssignmentSchema },
    { name: LatenessRule.name, schema: latenessRuleSchema },
    { name: Holiday.name, schema: HolidaySchema }
    
  ]),
  forwardRef(()=>EmployeeProfileModule),
  OrganizationStructureModule

  ],
  controllers: [TimeManagementController],
  providers: [    
    TimeManagementService,
    NotificationLogService,
    ShiftAssignmentService,
    ScheduleRuleService,
    ShiftTypeService,
    ShiftService,
    AttendanceCorrectionRequestService,
    HolidayService,
    LatenessRuleService,
    OvertimeRuleService,
    TimeExceptionService,
    AttendanceRecordService
  ],
  exports: [
        TimeManagementService,
    NotificationLogService,
    ShiftAssignmentService,
    ScheduleRuleService,
    ShiftTypeService,
    ShiftService,
    AttendanceCorrectionRequestService,
    HolidayService,
    LatenessRuleService,
    OvertimeRuleService,
    TimeExceptionService,
    AttendanceRecordService
  ]
})
export class TimeManagementModule {}