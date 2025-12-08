import { Body, Controller, Get, Param, Patch, Post, Delete } from '@nestjs/common';
import { BadRequestException } from '@nestjs/common';
import { LeavesService } from './leaves.service';

// PHASE 1 DTOS
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

// PHASE 2 DTOS
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { UpdateLeaveRequestDto } from './dto/update-leave-request.dto';

@Controller('leaves')
export class LeavesController {
  constructor(private readonly service: LeavesService) {}

  // ========================
  // CATEGORY
  // ========================
  @Post('categories')
  createCategory(@Body() dto: CreateLeaveCategoryDto) {
    return this.service.createCategory(dto);
  }

  @Get('categories')
  getAllCategories() {
    return this.service.getAllCategories();
  }

  @Patch('categories/:id')
  updateCategory(@Param('id') id: string, @Body() dto: UpdateLeaveCategoryDto) {
    return this.service.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  deleteCategory(@Param('id') id: string) {
    return this.service.deleteCategory(id);
  }

  // ========================
  // LEAVE TYPE
  // ========================
  @Post('types')
  createLeaveType(@Body() dto: CreateLeaveTypeDto) {
    return this.service.createLeaveType(dto);
  }

  @Get('types')
  getAllLeaveTypes() {
    return this.service.getAllLeaveTypes();
  }

  @Patch('types/:id')
  updateLeaveType(@Param('id') id: string, @Body() dto: UpdateLeaveTypeDto) {
    return this.service.updateLeaveType(id, dto);
  }

  @Delete('types/:id')
  deleteLeaveType(@Param('id') id: string) {
    return this.service.deleteLeaveType(id);
  }

  // ========================
  // LEAVE POLICY
  // ========================
  @Post('policies')
  createPolicy(@Body() dto: CreateLeavePolicyDto) {
    return this.service.createPolicy(dto);
  }

  @Get('policies')
  getAllPolicies() {
    return this.service.getAllPolicies();
  }

  @Patch('policies/:id')
  updatePolicy(@Param('id') id: string, @Body() dto: UpdateLeavePolicyDto) {
    return this.service.updatePolicy(id, dto);
  }

  @Delete('policies/:id')
  deletePolicy(@Param('id') id: string) {
    return this.service.deletePolicy(id);
  }

  // ========================
  // CALENDAR
  // ========================
  @Post('calendar')
  createCalendar(@Body() dto: CreateCalendarDto) {
    return this.service.createCalendar(dto);
  }

  @Get('calendar/:year')
  getCalendar(@Param('year') year: string) {
    return this.service.getCalendarByYear(Number(year));
  }

  @Patch('calendar/:year/add-holiday')
  addHoliday(@Param('year') year: number, @Body() dto: UpdateCalendarHolidayDto) {
    return this.service.addHoliday(year, dto);
  }

  @Patch('calendar/:year/remove-holiday')
  removeHoliday(@Param('year') year: number, @Body() dto: UpdateCalendarHolidayDto) {
    return this.service.removeHoliday(year, dto);
  }

  @Patch('calendar/:year/add-blocked')
  addBlocked(@Param('year') year: number, @Body() dto: UpdateCalendarBlockedDto) {
    return this.service.addBlockedPeriod(year, dto);
  }

  @Patch('calendar/:year/remove-blocked/:index')
  removeBlocked(@Param('year') year: number, @Param('index') index: number) {
    return this.service.removeBlockedPeriod(year, index);
  }

  // ========================
  // PAYCODE MAPPING (PHASE 1)
  // ========================
  @Post('paycode-mapping')
  createMapping(@Body() dto: CreatePaycodeMappingDto) {
    return this.service.createPaycodeMapping(dto);
  }

  @Get('paycode-mapping')
  getAllMappings() {
    return this.service.getAllPaycodeMappings();
  }

  @Patch('paycode-mapping/:id')
  updateMapping(@Param('id') id: string, @Body() dto: UpdatePaycodeMappingDto) {
    return this.service.updatePaycodeMapping(id, dto);
  }

  @Delete('paycode-mapping/:id')
  deleteMapping(@Param('id') id: string) {
    return this.service.deletePaycodeMapping(id);
  }

  // ========================
  // APPROVAL WORKFLOW (PHASE 1)
  // ========================
  @Post('approval-workflow')
  createWorkflow(@Body() dto: CreateApprovalWorkflowDto) {
    return this.service.createApprovalWorkflow(dto);
  }

  @Get('approval-workflow/:leaveTypeId')
  getWorkflow(@Param('leaveTypeId') leaveTypeId: string) {
    return this.service.getApprovalWorkflow(leaveTypeId);
  }

  @Patch('approval-workflow/:leaveTypeId')
  updateWorkflow(@Param('leaveTypeId') leaveTypeId: string, @Body() dto: UpdateApprovalWorkflowDto) {
    return this.service.updateApprovalWorkflow(leaveTypeId, dto);
  }

  // ========================
  // LEAVE REQUESTS (PHASE 2)
  // ========================
  @Post('requests')
  createLeaveRequest(@Body() dto: CreateLeaveRequestDto) {
    if (!dto.employeeId) {
      throw new BadRequestException('employeeId is required');
    }
    return this.service.createLeaveRequest(dto.employeeId, dto);
  }

  @Get('requests')
  getAllLeaveRequests() {
    return this.service.getAllLeaveRequests();
  }

  @Get('requests/:id')
  getLeaveRequest(@Param('id') id: string) {
    return this.service.getLeaveRequest(id);
  }

  @Patch('requests/:id')
  updateLeaveRequest(@Param('id') id: string, @Body() dto: UpdateLeaveRequestDto) {
    return this.service.updateLeaveRequest(id, dto);
  }
}
