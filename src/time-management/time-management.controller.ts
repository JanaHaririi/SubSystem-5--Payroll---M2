import { NotificationLogService } from './services/notification-log.service';
import { Controller, Post, Body, Delete, Param, Get, Put, Patch, BadRequestException } from '@nestjs/common';
import { ShiftAssignmentService } from './services/shift-assignment.service';
import { ScheduleRuleService } from './services/schedule-rule.service';
import { AttendanceCorrectionRequestService } from './services/attendance-correction-request.service';
import { ShiftAssignmentCreateDto } from './dtos/shift-assignment-create-dto';
import { NotificationLogCreateDto } from './dtos/notification-log-create-dto';
import { ScheduleRuleCreateDto } from './dtos/schedule-rule-create-dto';
import { ScheduleRuleUpdateDto } from './dtos/schedule-rule-update-dto';
import { AttendanceCorrectionRequestDto, UpdateAttendanceCorrectionRequestDto } from './dtos/create-attendance-correction-request-dto';
import { CreateHolidayDto } from './dtos/holiday-create-dto';
import { HolidayService } from './services/holiday.service';

import { Types } from 'mongoose';
import { ShiftAssignmentUpdateDto } from './dtos/shift-assignment-update-dto';
import { ShiftTypeCreateDto } from './dtos/shift-type-create-dto';
import { ShiftTypeService } from './services/shift-type.service';
import { ShiftAssignmentStatus } from './models/enums';
import { ShiftCreateDto } from './dtos/shift-create-dto';
import { ShiftService } from './services/shift.service';

@Controller('time-management')
export class TimeManagementController {
    constructor(
        private readonly shiftAssignmentService: ShiftAssignmentService,
        private readonly notificationLogService: NotificationLogService,
        private readonly scheduleRuleService: ScheduleRuleService,
        private readonly attendanceCorrectionRequestService: AttendanceCorrectionRequestService,
        private readonly holidayService: HolidayService,
        private shiftTypeService:ShiftTypeService,
        private shiftService: ShiftService
    ){}

    // Shift Assignment Functions (DONE -Authorization)
    @Post('assign-shift')
    async assignShift(@Body() assignData: ShiftAssignmentCreateDto) {
        return await this.shiftAssignmentService.assignShift(assignData);
    }
    @Get('assign-shift')
    async getAllShiftAssignments(){
        return await this.shiftAssignmentService.getAllShiftAssignments() 
    }
    @Get('assign-shift/expiring')
    async detectUpcomingExpiry(){
        return await this.shiftAssignmentService.detectUpcomingExpiry()
    }
    @Get('assign-shift/:id')
    async getShiftAssignmentById(@Param('id')shiftAssignmentId:string){
        return await this.shiftAssignmentService.getShiftAssignmentById(shiftAssignmentId)
    }
    @Put('assign-shift/:id')
    async updateShiftAssignment(@Param('id')shiftAssignmentId:string, @Body()status:ShiftAssignmentStatus){
        return await this.shiftAssignmentService.updateShiftAssignment(status,shiftAssignmentId)
    }
    @Put('assign-shift/extend/:id')
    async extendShiftAssignment(@Param('id')shiftAssignmentId:string,@Body()dto:ShiftAssignmentUpdateDto){
        return await this.shiftAssignmentService.extendShiftAssignment(dto,shiftAssignmentId)
    }

    //Notification Log Functions
    @Post('notification-log')
    async sendNotification(@Body()notifData:NotificationLogCreateDto){
        return this.notificationLogService.sendNotification(notifData);
    }
    @Get('notification-log')
    async getAllNotifications(){
        return this.notificationLogService.getAllNotifications()
    }
    @Get('notification-log/:id')
    async getEmployeeNotifications(@Param('id') employeeId:string){
        return this.notificationLogService.getEmployeeNotifications(employeeId)
    }

    // Schedule Rule Functions
    @Post('schedule-rule')
    async createScheduleRule(@Body() dto: ScheduleRuleCreateDto) {
        const createdRule = await this.scheduleRuleService.createScheduleRule(dto);
        return {
            success: true,
            message: 'Schedule rule created successfully!',
            data: createdRule
        };
    }

    @Get('schedule-rule')
    async getAllScheduleRules() {
        const rules = await this.scheduleRuleService.getAllScheduleRules();
        return {
            success: true,
            data: rules
        };
    }

    @Get('schedule-rule/:id')
    async getScheduleRuleById(@Param('id') id: string) {
        const rule = await this.scheduleRuleService.getScheduleRuleById(new Types.ObjectId(id));
        return {
            success: true,
            data: rule
        };
    }

    @Patch('schedule-rule/:id')
    async updateScheduleRule(@Param('id') id: string, @Body() dto: ScheduleRuleUpdateDto) {
        const updatedRule = await this.scheduleRuleService.updateScheduleRule(new Types.ObjectId(id), dto);
        return {
            success: true,
            message: 'Schedule rule updated successfully!',
            data: updatedRule
        };
    }

    @Delete('schedule-rule/:id')
    async deleteScheduleRule(@Param('id') id: string) {
        const result = await this.scheduleRuleService.deleteScheduleRule(new Types.ObjectId(id));
        return result;
    }

    // Attendance Correction Request Functions
    @Post('attendance-correction-request')
    async submitCorrectionRequest(
    @Body() dto: AttendanceCorrectionRequestDto
    ) {
    const result = await this.attendanceCorrectionRequestService.submitCorrectionRequest(dto);
    return {
        success: true,
        message: 'Correction request submitted successfully!',
        data: result
    };
    }


    @Patch('attendance-correction-request/:id')
    async updateCorrectionRequest(
    @Param('id') id: string,
    @Body() dto: UpdateAttendanceCorrectionRequestDto
    ) {
    const result = await this.attendanceCorrectionRequestService.updateCorrectionRequest(
        id, 
        dto
    );
    return {
        success: true,
        message: 'Correction request updated successfully!',
        data: result
    };
    }


    @Patch('attendance-correction-request/:id/approve')
    async approveCorrectionRequest(@Param('id') id: string) {
    const result = await this.attendanceCorrectionRequestService.approveCorrectionRequest(
        id 
    );
    return {
        success: true,
        message: 'Correction request approved!',
        data: result
    };
    }


    @Patch('attendance-correction-request/:id/reject')
    async rejectCorrectionRequest(
    @Param('id') id: string,
    @Body('reason') reason: string
    ) {
    if (!reason) throw new BadRequestException('Rejection reason is required.');
    const result = await this.attendanceCorrectionRequestService.rejectCorrectionRequest(
        id, 
        reason
    );
    return {
        success: true,
        message: 'Correction request rejected!',
        data: result
    };
    }

    // Holiday Functions 
    @Post('holiday')
    async createHoliday(@Body() dto: CreateHolidayDto) {
    const result = await this.holidayService.createHoliday(dto);
    return {
        success: true,
        message: 'Holiday created successfully!',
        data: result
    };
}

    @Get('holiday')
    async getAllHolidays() {
    const result = await this.holidayService.getAllHolidays();
    return {
        success: true,
        message: 'Holidays fetched successfully!',
        data: result
    };


    }

    @Get('attendance-correction-request/employee/:employeeId')
    async listEmployeeRequests(@Param('employeeId') employeeId: string) {
    const result = await this.attendanceCorrectionRequestService
        .listEmployeeCorrectionRequests(employeeId);

    return {
        success: true,
        message: 'Employee correction requests fetched.',
        data: result
    };
    }

    @Post('attendance-correction-request/auto-escalate')
    async autoEscalate() {
        const result = await this.attendanceCorrectionRequestService
            .autoEscalatePendingCorrections();

        return {
            success: true,
            message: 'Pending correction requests auto-escalated.',
            data: result
        };
    }

    //Shift Type Functions
    @Post('shift-type')
    async createShiftType(@Body()shiftTypeData:ShiftTypeCreateDto){
        return this.shiftTypeService.createShiftType(shiftTypeData);
    }
    @Get('shift-type')
    async getAllShiftTypes(){
        return this.shiftTypeService.getAllShiftTypes();
    }
    @Get('shift-type/:id')
    async getShiftTypeById(@Param('id')shiftTypeId:string){
        return this.shiftTypeService.getShiftTypeById(shiftTypeId)
    }
    @Delete('shift-type/:id')
    async deleteShiftType(@Param('id')shiftTypeId:string){
        return this.shiftTypeService.deleteShiftType(shiftTypeId)
    }

    //Shift Functions
    @Post('shift')
    async createShift(@Body()shiftData:ShiftCreateDto){ //Working
        return this.shiftService.createShift(shiftData)
    }
    @Get('shift')
    async getAllShifts(){ //Working
        return this.shiftService.getAllShifts()
    }
    @Get('shift/:id')
    async getShiftById(@Param('id')shiftId:string){ //Working
        return this.shiftService.getShiftById(shiftId)
    }
    @Put('shift/deactivate/:id')
    async deactivateShift(@Param('id')shiftId:string){ //Working
        return this.shiftService.deactivateShift(shiftId)
    }
    @Put('shift/activate/:id')
    async activateShift(@Param('id')shiftId:string){ //Working
        return this.shiftService.activateShit(shiftId)
    }
    @Delete('shift/:id')
    async deleteShift(@Param('id')shiftId:string){ //Working
        return this.shiftService.deleteShift(shiftId)
    }

}


