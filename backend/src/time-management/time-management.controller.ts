import { NotificationLogService } from './services/notification-log.service';
import { Controller, Post, Body, Delete, Param, Get, Put, Patch, BadRequestException, Query, UseGuards } from '@nestjs/common';
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
import { TimeExceptionService } from './services/time-exception.service';
import { OvertimeRuleService } from './services/overtime-rule.service';
import { LatenessRuleService } from './services/lateness-rule.service';
import { TimeExceptionCreateDto } from './dtos/create-time-exception.dto';
import { TimeExceptionUpdateDto } from './dtos/update-time-exception.dto';
import { OvertimeRuleCreateDto } from './dtos/overtime-rule-create.dto';
import { OvertimeRuleUpdateDto } from './dtos/overtime-rule-update.dto';
import { ApplyOvertimeDto } from './dtos/apply-overtime.dto';
import { LatenessRuleCreateDto } from './dtos/lateness-rule-create.dto';
import { LatenessRuleUpdateDto } from './dtos/lateness-rule-update.dto';
import { AttendanceRecordService } from './services/attendance-record.service';
import { CreateAttendancePunchDto } from './dtos/create-attendance-record-dto';
import { CreateAttendanceRecordDto } from './dtos/attendance-record-dto';
import { UpdateAttendanceRecordDto } from './dtos/update-attendance-record-dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { SystemRole } from 'src/employee-profile/enums/employee-profile.enums';

@Controller('time-management')
export class TimeManagementController {
    constructor(
        private readonly shiftAssignmentService: ShiftAssignmentService,
        private readonly notificationLogService: NotificationLogService,
        private readonly scheduleRuleService: ScheduleRuleService,
        private readonly attendanceCorrectionRequestService: AttendanceCorrectionRequestService,
        private readonly holidayService: HolidayService,
        private shiftTypeService:ShiftTypeService,
        private shiftService: ShiftService,
        private timeExceptionService: TimeExceptionService,
        private overtimeRuleService: OvertimeRuleService,
        private latenessRuleService: LatenessRuleService,
        private attendanceRecordService: AttendanceRecordService,
    ){}

    // Shift Assignment Functions (DONE - Authorization)
    @UseGuards(AuthGuard)
    @Roles(SystemRole.SYSTEM_ADMIN, SystemRole.HR_ADMIN)
    @Post('assign-shift') //sys admin, hr admin
    async assignShift(@Body() assignData: ShiftAssignmentCreateDto) {
        return await this.shiftAssignmentService.assignShift(assignData);
    }
    
    @UseGuards(AuthGuard)
    @Roles(SystemRole.SYSTEM_ADMIN, SystemRole.HR_ADMIN)
    @Get('assign-shift') //sys admin, hr admin
    async getAllShiftAssignments(){
        return await this.shiftAssignmentService.getAllShiftAssignments() 
    }
    @UseGuards(AuthGuard)
    @Roles(SystemRole.SYSTEM_ADMIN, SystemRole.HR_ADMIN)
    @Get('assign-shift/expiring') //sys admin, hr admin
    async detectUpcomingExpiry(){
        return await this.shiftAssignmentService.detectUpcomingExpiry()
    }

    @UseGuards(AuthGuard)
    @Roles(SystemRole.SYSTEM_ADMIN, SystemRole.HR_ADMIN)
    @Get('assign-shift/:id') //sys admin, hr admin
    async getShiftAssignmentById(@Param('id')shiftAssignmentId:string){
        return await this.shiftAssignmentService.getShiftAssignmentById(shiftAssignmentId)
    }

    @UseGuards(AuthGuard)
    @Roles(SystemRole.SYSTEM_ADMIN, SystemRole.HR_ADMIN)
    @Put('assign-shift/:id') //sys admin, hr admin
    async updateShiftAssignment(@Param('id')shiftAssignmentId:string, @Body()status:ShiftAssignmentStatus){
        return await this.shiftAssignmentService.updateShiftAssignment(status,shiftAssignmentId)
    }

    @UseGuards(AuthGuard)
    @Roles(SystemRole.SYSTEM_ADMIN, SystemRole.HR_ADMIN)
    @Put('assign-shift/extend/:id') //sys admin, hr admin
    async extendShiftAssignment(@Param('id')shiftAssignmentId:string,@Body()dto:ShiftAssignmentUpdateDto){
        return await this.shiftAssignmentService.extendShiftAssignment(dto,shiftAssignmentId)
    }

    // Notification Log Functions (kol da hr admin)

    @UseGuards(AuthGuard)
    @Roles(SystemRole.HR_ADMIN)
    @Post('notification-log') 
    async sendNotification(@Body()notifData:NotificationLogCreateDto){
        return this.notificationLogService.sendNotification(notifData);
    }

    @UseGuards(AuthGuard)
    @Roles(SystemRole.HR_ADMIN)
    @Get('notification-log') 
    async getAllNotifications(){
        return this.notificationLogService.getAllNotifications()
    }

    @UseGuards(AuthGuard)
    @Get('notification-log/:notifId')
    async getNotificationbyId(@Param('notifId')notifId:string){
        return this.notificationLogService.getNotificationById(notifId)
    }

    @UseGuards(AuthGuard)
    @Roles(SystemRole.HR_ADMIN)
    @Get('notification-log/employee/:id') 
    async getEmployeeNotifications(@Param('id') employeeId:string){
        return this.notificationLogService.getEmployeeNotifications(employeeId)
    }


    // Schedule Rule Functions
    @UseGuards(AuthGuard)
    @Roles(SystemRole.HR_ADMIN)
    @Post('schedule-rule') // hr manager
    async createScheduleRule(@Body() dto: ScheduleRuleCreateDto) {
        const createdRule = await this.scheduleRuleService.createScheduleRule(dto);
        return {
            success: true,
            message: 'Schedule rule created successfully!',
            data: createdRule
        };
    }


    @UseGuards(AuthGuard)
    @Roles(SystemRole.SYSTEM_ADMIN, SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE, SystemRole.DEPARTMENT_EMPLOYEE)
    @Get('schedule-rule') //sys admin (read-only), hr manager, employees (read-only)
    async getAllScheduleRules() {
        const rules = await this.scheduleRuleService.getAllScheduleRules();
        return {
            success: true,
            data: rules
        };
    }

    @UseGuards(AuthGuard)
    @Roles(SystemRole.SYSTEM_ADMIN, SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE, SystemRole.DEPARTMENT_EMPLOYEE)
    @Get('schedule-rule/:id') //sys admin (read-only) , hr manager, employees (read-only)
    async getScheduleRuleById(@Param('id') id: string) {
        const rule = await this.scheduleRuleService.getScheduleRuleById(new Types.ObjectId(id));
        return {
            success: true,
            data: rule
        };
    }

    @UseGuards(AuthGuard)
    @Roles(SystemRole.HR_MANAGER)
    @Patch('schedule-rule/:id') //sys admin (read only), hr manager
    async updateScheduleRule(@Param('id') id: string, @Body() dto: ScheduleRuleUpdateDto) {
        const updatedRule = await this.scheduleRuleService.updateScheduleRule(new Types.ObjectId(id), dto);
        return {
            success: true,
            message: 'Schedule rule updated successfully!',
            data: updatedRule
        };
    }

    @UseGuards(AuthGuard)
    @Roles(SystemRole.HR_MANAGER)
    @Delete('schedule-rule/:id') //sys admin (read only), hr manager
    async deleteScheduleRule(@Param('id') id: string) {
        const result = await this.scheduleRuleService.deleteScheduleRule(new Types.ObjectId(id));
        return result;
    }

    // Attendance Record Functions

    @UseGuards(AuthGuard)
    @Roles(SystemRole.HR_EMPLOYEE, SystemRole.DEPARTMENT_EMPLOYEE)
    @Post('attendance-record/clock-in') // employee
    async recordClockIn(@Body() dto: CreateAttendancePunchDto) {
        return this.attendanceRecordService.recordClockIn(dto);
    }

    @Roles(SystemRole.HR_EMPLOYEE, SystemRole.DEPARTMENT_EMPLOYEE,)
    @UseGuards(AuthGuard)
    @Post('attendance-record/clock-out') // employee
    async recordClockOut(@Body() dto: CreateAttendancePunchDto) {
        return this.attendanceRecordService.recordClockOut(dto);
    }

    @Roles(SystemRole.HR_EMPLOYEE, SystemRole.DEPARTMENT_EMPLOYEE, SystemRole.DEPARTMENT_HEAD, SystemRole.PAYROLL_MANAGER, SystemRole.PAYROLL_SPECIALIST)
    @UseGuards(AuthGuard)
    @Get('attendance-record/:employeeId/missed-punches') // employee, line manager, payroll officer
    async detectMissedPunches(@Param('employeeId') employeeId: string) {
        return this.attendanceRecordService.detectMissedPunches(employeeId);
    }

    @UseGuards(AuthGuard)
    @Roles(SystemRole.HR_EMPLOYEE, SystemRole.DEPARTMENT_EMPLOYEE, SystemRole.DEPARTMENT_HEAD, SystemRole.PAYROLL_MANAGER, SystemRole.PAYROLL_SPECIALIST, SystemRole.SYSTEM_ADMIN)
    @Get('attendance-record/:employeeId') // employee, line manager, payroll officer, sys admin
    async listAttendanceForEmployee(
        @Param('employeeId') employeeId: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string
    ) {
        return this.attendanceRecordService.listAttendanceForEmployee(employeeId, startDate, endDate);
    }

    @UseGuards(AuthGuard)
    @Roles(SystemRole.HR_EMPLOYEE, SystemRole.DEPARTMENT_EMPLOYEE, SystemRole.SYSTEM_ADMIN)
    @Patch('attendance-record/:employeeId/punch') // employee, sys admin
    async updatePunchByTime(
        @Param('employeeId') employeeId: string,
        @Body('punchTime') punchTime: string,
        @Body('update') update: { time?: string; type?: 'IN' | 'OUT' }
    ) {
        return this.attendanceRecordService.updatePunchByTime(employeeId, punchTime, update);
    }

    @UseGuards(AuthGuard)
    @Roles(SystemRole.HR_EMPLOYEE, SystemRole.DEPARTMENT_EMPLOYEE, SystemRole.SYSTEM_ADMIN)
    @Delete('attendance-record/:employeeId/punch') // employee, sys admin
    async deletePunchByTime(
        @Param('employeeId') employeeId: string,
        @Body('punchTime') punchTime: string
    ) {
        return this.attendanceRecordService.deletePunchByTime(employeeId, punchTime);
    }

    @UseGuards(AuthGuard)
    @Roles(SystemRole.DEPARTMENT_HEAD, SystemRole.SYSTEM_ADMIN)
    @Delete('attendance-record/:employeeId/punches') // line manager, sys admin
    async deletePunchesForDate(
        @Param('employeeId') employeeId: string,
        @Query('date') date: string
    ) {
        return this.attendanceRecordService.deletePunchesForDate(employeeId, date);
    }

    @UseGuards(AuthGuard)
    @Roles(SystemRole.DEPARTMENT_HEAD)
    @Post('attendance-record') // line manager
    async createAttendanceRecord(@Body() dto: CreateAttendanceRecordDto) {
        return this.attendanceRecordService.createAttendanceRecord(dto);
    }

    @UseGuards(AuthGuard)
    @Roles(SystemRole.DEPARTMENT_HEAD)
    @Patch('attendance-record/:id') // line manager
    async updateAttendanceRecord(@Param('id') id: string, @Body() dto: UpdateAttendanceRecordDto) {
        return this.attendanceRecordService.updateAttendanceRecord(id, dto);
    }

    @UseGuards(AuthGuard)
    @Roles(SystemRole.HR_MANAGER)
    @Get('attendance-record/:employeeId/repeated-lateness') // hr manager
    async flagRepeatedLateness(@Param('employeeId') employeeId: string) {
        return this.attendanceRecordService.flagRepeatedLateness(employeeId);
    }

    // Attendance Correction Request Functions
    @UseGuards(AuthGuard)
    @Roles(SystemRole.HR_EMPLOYEE, SystemRole.DEPARTMENT_EMPLOYEE)
    @Post('attendance-correction-request') // employee
    async submitCorrectionRequest(@Body() dto: AttendanceCorrectionRequestDto) {
        const result = await this.attendanceCorrectionRequestService.submitCorrectionRequest(dto);
        return {
            success: true,
            message: 'Correction request submitted successfully!',
            data: result
        };
    }

    @UseGuards(AuthGuard)
    @Roles(SystemRole.SYSTEM_ADMIN, SystemRole.HR_ADMIN, SystemRole.DEPARTMENT_HEAD)
    @Patch('attendance-correction-request/:id') // sys admin, hr admin, line manager
    async updateCorrectionRequest(@Param('id') id: string, @Body() dto: UpdateAttendanceCorrectionRequestDto) {
        const result = await this.attendanceCorrectionRequestService.updateCorrectionRequest(id, dto);
        return {
            success: true,
            message: 'Correction request updated successfully!',
            data: result
        };
    }

    @UseGuards(AuthGuard)
    @Roles(SystemRole.SYSTEM_ADMIN, SystemRole.HR_ADMIN)
    @Patch('attendance-correction-request/:id/approve') // sys admin, hr admin
    async approveCorrectionRequest(@Param('id') id: string) {
        const result = await this.attendanceCorrectionRequestService.approveCorrectionRequest(id);
        return {
            success: true,
            message: 'Correction request approved!',
            data: result
        };
    }

    @UseGuards(AuthGuard)
    @Roles(SystemRole.SYSTEM_ADMIN, SystemRole.HR_ADMIN)
    @Patch('attendance-correction-request/:id/reject') // sys admin, hr admin
    async rejectCorrectionRequest(@Param('id') id: string, @Body('reason') reason: string) {
        if (!reason) throw new BadRequestException('Rejection reason is required.');
        const result = await this.attendanceCorrectionRequestService.rejectCorrectionRequest(id, reason);
        return {
            success: true,
            message: 'Correction request rejected!',
            data: result
        };
    }

    @UseGuards(AuthGuard)
    @Roles(SystemRole.HR_EMPLOYEE, SystemRole.DEPARTMENT_EMPLOYEE)
    @Get('attendance-correction-request/employee/:employeeId') // employee
    async listEmployeeRequests(@Param('employeeId') employeeId: string) {
        const result = await this.attendanceCorrectionRequestService.listEmployeeCorrectionRequests(employeeId);
        return {
            success: true,
            message: 'Employee correction requests fetched.',
            data: result
        };
    }

    @UseGuards(AuthGuard)
    @Roles(SystemRole.SYSTEM_ADMIN, SystemRole.HR_ADMIN)
    @Post('attendance-correction-request/auto-escalate') // sys admin, hr admin
    async autoEscalate() {
        const result = await this.attendanceCorrectionRequestService.autoEscalatePendingCorrections();
        return {
            success: true,
            message: 'Pending correction requests auto-escalated.',
            data: result
        };
    }

    // Holiday Functions
    @UseGuards(AuthGuard)
    @Roles(SystemRole.SYSTEM_ADMIN, SystemRole.HR_ADMIN, SystemRole.HR_MANAGER)
    @Post('holiday') // hr manager, employee read only, sys admin, hr admin
    async createHoliday(@Body() dto: CreateHolidayDto) {
        const result = await this.holidayService.createHoliday(dto);
        return {
            success: true,
            message: 'Holiday created successfully!',
            data: result
        };
    }

    @UseGuards(AuthGuard)
    @Get('holiday') // hr manager, employee , sys admin , hr admin
    async getAllHolidays() {
        const result = await this.holidayService.getAllHolidays();
        return {
            success: true,
            message: 'Holidays fetched successfully!',
            data: result
        };
    }

    // Shift Type Functions
    @UseGuards(AuthGuard)
    @Roles(SystemRole.SYSTEM_ADMIN, SystemRole.DEPARTMENT_HEAD)
    @Post('shift-type') //sys admin, hr manager
    async createShiftType(@Body()shiftTypeData:ShiftTypeCreateDto){
        return this.shiftTypeService.createShiftType(shiftTypeData);
    }

    @UseGuards(AuthGuard)
    @Roles(SystemRole.SYSTEM_ADMIN, SystemRole.DEPARTMENT_HEAD,SystemRole.DEPARTMENT_EMPLOYEE, SystemRole.HR_EMPLOYEE)
    @Get('shift-type') //sys admin, hr manager, employees (read-only)
    async getAllShiftTypes(){
        return this.shiftTypeService.getAllShiftTypes();
    }

    @UseGuards(AuthGuard)
    @Roles(SystemRole.SYSTEM_ADMIN, SystemRole.DEPARTMENT_HEAD,SystemRole.DEPARTMENT_EMPLOYEE, SystemRole.HR_EMPLOYEE)
    @Get('shift-type/:id') //sys admin, hr manager, employees (read-only)
    async getShiftTypeById(@Param('id')shiftTypeId:string){
        return this.shiftTypeService.getShiftTypeById(shiftTypeId)
    }

    @UseGuards(AuthGuard)
    @Roles(SystemRole.SYSTEM_ADMIN, SystemRole.HR_MANAGER)
    @Delete('shift-type/:id') //sys admin, hr manager
    async deleteShiftType(@Param('id')shiftTypeId:string){
        return this.shiftTypeService.deleteShiftType(shiftTypeId)
    }

    // Shift Functions (sys admin, hr admin)
    @UseGuards(AuthGuard)
    @Roles(SystemRole.SYSTEM_ADMIN, SystemRole.HR_ADMIN)
    @Post('shift') 
    async createShift(@Body()shiftData:ShiftCreateDto){
        return this.shiftService.createShift(shiftData)
    }

    @UseGuards(AuthGuard)
    @Roles(SystemRole.SYSTEM_ADMIN, SystemRole.HR_ADMIN)
    @Get('shift') // sys admin, hr admin, employees (read-only)
    async getAllShifts(){
        return this.shiftService.getAllShifts()
    }

    @UseGuards(AuthGuard)
    @Roles(SystemRole.SYSTEM_ADMIN, SystemRole.HR_ADMIN)
    @Get('shift/:id') // sys admin, hr admin, employees (read-only)
    async getShiftById(@Param('id')shiftId:string){
        return this.shiftService.getShiftById(shiftId)
    }

    @UseGuards(AuthGuard)
    @Roles(SystemRole.SYSTEM_ADMIN, SystemRole.HR_ADMIN)
    @Put('shift/deactivate/:id') 
    async deactivateShift(@Param('id')shiftId:string){
        return this.shiftService.deactivateShift(shiftId) // sys admin, hr admin
    }

    @UseGuards(AuthGuard)
    @Roles(SystemRole.SYSTEM_ADMIN, SystemRole.HR_ADMIN)
    @Put('shift/activate/:id') 
    async activateShift(@Param('id')shiftId:string){
        return this.shiftService.activateShit(shiftId) // sys admin, hr admin
    }

    @UseGuards(AuthGuard)
    @Roles(SystemRole.SYSTEM_ADMIN, SystemRole.HR_ADMIN)
    @Delete('shift/:id') 
    async deleteShift(@Param('id')shiftId:string){
        return this.shiftService.deleteShift(shiftId) // sys admin, hr admin
    }

    // Time Exception Functions
   @UseGuards(AuthGuard)
   @Roles(SystemRole.DEPARTMENT_HEAD, SystemRole.HR_ADMIN)
   @Patch('time-exception/:id/approve') // line manager, hr admin
    async approveTimeException(@Param('id') id: string, @Body('approvedBy') approvedBy: string) {
        return this.timeExceptionService.approve(id, approvedBy);
    }

    @UseGuards(AuthGuard)
    @Roles(SystemRole.DEPARTMENT_HEAD, SystemRole.HR_ADMIN)
    @Patch('time-exception/:id/reject') // line manager, hr admin
    async rejectTimeException(@Param('id') id: string, @Body('rejectedBy') rejectedBy: string, @Body('reason') reason: string) {
        return this.timeExceptionService.reject(id, rejectedBy, reason);
    }

    @UseGuards(AuthGuard)
    @Roles(SystemRole.DEPARTMENT_HEAD, SystemRole.HR_ADMIN)
    @Post('time-exception/auto-escalate') // line manager, hr admin
    async autoEscalateTimeExceptions() {
        return this.timeExceptionService.autoEscalatePending();
    }

    // Overtime Rule Functions
    @UseGuards(AuthGuard)
    @Roles(SystemRole.HR_MANAGER)
    @Post('overtime-rule') // hr manager
    async createOvertimeRule(@Body() dto: OvertimeRuleCreateDto) {
        return this.overtimeRuleService.createOvertimeRule(dto);
    }

    @UseGuards(AuthGuard)
    @Roles(SystemRole.HR_MANAGER)
    @Patch('overtime-rule/:id') // hr manager
    async updateOvertimeRule(@Param('id') id: string, @Body() dto: OvertimeRuleUpdateDto) {
        return this.overtimeRuleService.updateOvertimeRule(id, dto);
    }

    @UseGuards(AuthGuard)
    @Roles(SystemRole.HR_MANAGER)
    @Delete('overtime-rule/:id') //hr manager
    async deleteOvertimeRule(@Param('id') id: string) {
        return this.overtimeRuleService.deleteOvertimeRule(id);
    }

    // Lateness Rule Functions
    @UseGuards(AuthGuard)
    @Roles(SystemRole.HR_MANAGER)
    @Post('lateness-rule') // hr manager
    async createLatenessRule(@Body() dto: LatenessRuleCreateDto) {
        return this.latenessRuleService.createLatenessRule(dto);
    }

    @UseGuards(AuthGuard)
    @Roles(SystemRole.HR_MANAGER, SystemRole.SYSTEM_ADMIN, SystemRole.DEPARTMENT_EMPLOYEE, SystemRole.HR_EMPLOYEE)
    @Get('lateness-rule') // hr manager, sys admin and employees (read-only)
    async getAllLatenessRules() {
        return this.latenessRuleService.listLatenessRules();
    }

    @UseGuards(AuthGuard)
    @Roles(SystemRole.HR_MANAGER, SystemRole.SYSTEM_ADMIN, SystemRole.DEPARTMENT_EMPLOYEE, SystemRole.HR_EMPLOYEE)
    @Get('lateness-rule/:id') // hr manager, sys admins and employees (read-only)
    async getLatenessRuleById(@Param('id') id: string) {
        return this.latenessRuleService.findById(id);
    }

    @UseGuards(AuthGuard)
    @Roles(SystemRole.HR_MANAGER)
    @Patch('lateness-rule/:id') // hr manager
    async updateLatenessRule(@Param('id') id: string, @Body() dto: LatenessRuleUpdateDto) {
        return this.latenessRuleService.updateLatenessRule(id, dto);
    }

    @UseGuards(AuthGuard)
    @Roles(SystemRole.HR_MANAGER)
    @Delete('lateness-rule/:id') // hr manager
    async deleteLatenessRule(@Param('id') id: string) {
        return this.latenessRuleService.deleteLatenessRule(id);
    }

    
}
