import { Controller, Get, Post, Put, Delete, Body, Param, HttpCode, HttpStatus, Patch, Query, UseGuards } from '@nestjs/common';
import { OffboardingService } from '../services/offboarding.service';
import { CreateTerminationRequestDto } from '../dto/create-termination-request.dto';
import { UpdateTerminationRequestDto } from '../dto/update-termination-request.dto';
import { CreateClearanceChecklistDto } from '../dto/create-clearance-checklist.dto';
import { UpdateClearanceChecklistDto } from '../dto/update-clearance-checklist.dto';

import { AuthGuard } from '../../auth/guards/auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { SystemRole } from 'src/employee-profile/enums/employee-profile.enums';

@Controller('offboarding')
@UseGuards(AuthGuard, RolesGuard)
export class OffboardingController {
  constructor(private readonly offboardingService: OffboardingService) {}

  // termination request endpoints

  @Post('requests')
  @HttpCode(HttpStatus.CREATED)
  @Roles(SystemRole.HR_MANAGER, SystemRole.DEPARTMENT_EMPLOYEE)
  async createTerminationRequest(@Body() createDto: CreateTerminationRequestDto) {
    return this.offboardingService.createTerminationRequest(createDto);
  }

  @Get('requests')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE, SystemRole.DEPARTMENT_EMPLOYEE)
  async getAllTerminationRequests(@Query('employeeId') employeeId?: string) {
    return this.offboardingService.getAllTerminationRequests(employeeId);
  }

  @Get('requests/:id')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE, SystemRole.DEPARTMENT_EMPLOYEE)
  async getTerminationRequest(@Param('id') id: string) {
    return this.offboardingService.getTerminationRequest(id);
  }

  @Patch('requests/:id')
  @Roles(SystemRole.HR_MANAGER)
  async updateTerminationRequest(
    @Param('id') id: string,
    @Body() updateDto: UpdateTerminationRequestDto,
  ) {
    return this.offboardingService.updateTerminationRequest(id, updateDto);
  }

  // Clearance Checklist Endpoints 

  @Post('checklists')
  @HttpCode(HttpStatus.CREATED)
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE)
  async createClearanceChecklist(@Body() createDto: CreateClearanceChecklistDto) {
    return this.offboardingService.createClearanceChecklist(createDto);
  }

  @Get('checklists')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE, SystemRole.SYSTEM_ADMIN, SystemRole.FINANCE_STAFF, SystemRole.DEPARTMENT_MANAGER, SystemRole.DEPARTMENT_HEAD)
  async getAllClearanceChecklists(@Query('terminationId') terminationId?: string) {
    return this.offboardingService.getAllClearanceChecklists(terminationId);
  }

  @Get('checklists/:id')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE, SystemRole.SYSTEM_ADMIN, SystemRole.FINANCE_STAFF, SystemRole.DEPARTMENT_MANAGER, SystemRole.DEPARTMENT_HEAD, SystemRole.DEPARTMENT_EMPLOYEE)
  async getClearanceChecklist(@Param('id') id: string) {
    return this.offboardingService.getClearanceChecklist(id);
  }

  @Patch('checklists/:id')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE, SystemRole.SYSTEM_ADMIN, SystemRole.FINANCE_STAFF, SystemRole.DEPARTMENT_MANAGER, SystemRole.DEPARTMENT_HEAD)
  async updateClearanceChecklist(
    @Param('id') id: string,
    @Body() updateDto: UpdateClearanceChecklistDto,
  ) {
    return this.offboardingService.updateClearanceChecklist(id, updateDto);
  }

  @Delete('checklists/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(SystemRole.HR_MANAGER)
  async deleteClearanceChecklist(@Param('id') id: string) {
    return this.offboardingService.deleteClearanceChecklist(id);
  }
}