import {Controller, Get, Post, Put, Body, Param, Query, UsePipes, ValidationPipe, UseGuards} from '@nestjs/common';
import { PerformanceService } from './performance.service';
import { CreateAppraisalTemplateDto } from './dto/create-appraisal-template.dto';
import { CreateAppraisalCycleDto } from './dto/create-appraisal-cycle.dto';
import { CreateAppraisalRecordDto } from './dto/create-appraisal-record.dto';
import { CreateAppraisalDisputeDto } from './dto/create-appraisal-dispute.dto';
import { UpdateAppraisalDisputeDto } from './dto/update-appraisal-dispute.dto';
import { UpdateAppraisalCycleStatusDto } from './dto/update-appraisal-cycle-status.dto';
import { PublishAppraisalRecordDto } from './dto/publish-appraisal-record.dto';
import { AppraisalCycleStatus, AppraisalDisputeStatus } from './enums/performance.enums';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserData } from '../auth/decorators/current-user.decorator';
import { SystemRole } from '../employee-profile/enums/employee-profile.enums';

@Controller('performance')
@UseGuards(AuthGuard, RolesGuard)
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
export class PerformanceController {
  constructor(private readonly performanceService: PerformanceService) {}

  // APPRAISAL TEMPLATE ENDPOINTS (HR Manager only)
  @Post('templates')
  @Roles(SystemRole.HR_MANAGER, SystemRole.SYSTEM_ADMIN)
  async createAppraisalTemplate(@Body() createTemplateDto: CreateAppraisalTemplateDto) {
    return this.performanceService.createAppraisalTemplate(createTemplateDto);
  }

  @Get('templates')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN, SystemRole.DEPARTMENT_HEAD)
  async getAllAppraisalTemplates() {
    return this.performanceService.getAllAppraisalTemplates();
  }

  @Get('templates/:id')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN, SystemRole.DEPARTMENT_HEAD)
  async getAppraisalTemplateById(@Param('id') id: string) {
    return this.performanceService.getAppraisalTemplateById(id);
  }

  @Put('templates/:id')
  @Roles(SystemRole.HR_MANAGER, SystemRole.SYSTEM_ADMIN)
  async updateAppraisalTemplate(
    @Param('id') id: string,
    @Body() updateTemplateDto: CreateAppraisalTemplateDto,
  ) {
    return this.performanceService.updateAppraisalTemplate(id, updateTemplateDto);
  }

  // APPRAISAL CYCLE ENDPOINTS (HR Manager/Admin)
  @Post('cycles')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async createAppraisalCycle(@Body() createCycleDto: CreateAppraisalCycleDto) {
    return this.performanceService.createAppraisalCycle(createCycleDto);
  }

  @Get('cycles')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN, SystemRole.DEPARTMENT_HEAD)
  async getAllAppraisalCycles() {
    return this.performanceService.getAllAppraisalCycles();
  }

  @Get('cycles/:id')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN, SystemRole.DEPARTMENT_HEAD)
  async getAppraisalCycleById(@Param('id') id: string) {
    return this.performanceService.getAppraisalCycleById(id);
  }

  @Put('cycles/:id/status')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async updateAppraisalCycleStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateAppraisalCycleStatusDto,
  ) {
    return this.performanceService.updateAppraisalCycleStatus(id, updateStatusDto.status);
  }

  // APPRAISAL ASSIGNMENT ENDPOINTS
  @Post('cycles/:cycleId/assignments')
  @Roles(SystemRole.HR_ADMIN, SystemRole.HR_MANAGER, SystemRole.SYSTEM_ADMIN)
  async createAppraisalAssignments(@Param('cycleId') cycleId: string) {
    return this.performanceService.createAppraisalAssignments(cycleId);
  }

  @Get('employees/:employeeProfileId/appraisals')
  async getEmployeeAppraisals(@Param('employeeProfileId') employeeProfileId: string,  @CurrentUser() user: CurrentUserData) {
    return this.performanceService.getEmployeeAppraisals(employeeProfileId);
  }

  @Get('managers/:managerProfileId/assignments')
  @Roles(SystemRole.DEPARTMENT_HEAD, SystemRole.HR_ADMIN, SystemRole.HR_MANAGER, SystemRole.SYSTEM_ADMIN)
  async getManagerAppraisalAssignments(@Param('managerProfileId') managerProfileId: string) {
    return this.performanceService.getManagerAppraisalAssignments(managerProfileId);
  }

  // APPRAISAL RECORD ENDPOINTS
  @Post('assignments/:assignmentId/record')
  @Roles(SystemRole.DEPARTMENT_HEAD, SystemRole.HR_ADMIN, SystemRole.HR_MANAGER, SystemRole.SYSTEM_ADMIN)
  async createOrUpdateAppraisalRecord(
    @Param('assignmentId') assignmentId: string,
    @Body() createRecordDto: CreateAppraisalRecordDto,
  ) {
    return this.performanceService.createOrUpdateAppraisalRecord(assignmentId, createRecordDto);
  }

  @Put('assignments/:assignmentId/submit')
  @Roles(SystemRole.DEPARTMENT_HEAD, SystemRole.HR_ADMIN, SystemRole.HR_MANAGER, SystemRole.SYSTEM_ADMIN)
  async submitAppraisalRecord(@Param('assignmentId') assignmentId: string) {
    return this.performanceService.submitAppraisalRecord(assignmentId);
  }

  @Put('assignments/:assignmentId/publish')
  @Roles(SystemRole.HR_ADMIN, SystemRole.HR_MANAGER, SystemRole.SYSTEM_ADMIN)
  async publishAppraisalRecord(
    @Param('assignmentId') assignmentId: string,
    @Body() publishDto: PublishAppraisalRecordDto,
  ) {
    return this.performanceService.publishAppraisalRecord(assignmentId, publishDto.publishedByEmployeeId);
  }

  // APPRAISAL DISPUTE ENDPOINTS
  @Post('disputes')
  async createAppraisalDispute(@Body() createDisputeDto: CreateAppraisalDisputeDto, @CurrentUser() user: CurrentUserData) {
    return this.performanceService.createAppraisalDispute(createDisputeDto);
  }

  @Get('disputes')
  @Roles(SystemRole.HR_ADMIN, SystemRole.HR_MANAGER, SystemRole.SYSTEM_ADMIN)
  async getAppraisalDisputes(@Query('cycleId') cycleId?: string) {
    return this.performanceService.getAppraisalDisputes(cycleId);
  }

  @Put('disputes/:disputeId/status')
  @Roles(SystemRole.HR_ADMIN, SystemRole.HR_MANAGER, SystemRole.SYSTEM_ADMIN)
  async updateDisputeStatus(
    @Param('disputeId') disputeId: string,
    @Body() updateDisputeDto: UpdateAppraisalDisputeDto,
  ) {
    return this.performanceService.updateDisputeStatus(
      disputeId,
      updateDisputeDto.status,
      {
        resolvedByEmployeeId: updateDisputeDto.resolvedByEmployeeId,
        resolutionSummary: updateDisputeDto.resolutionSummary
      }
    );
  }

  // ADDITIONAL CONVENIENCE ENDPOINTS
  @Get('cycles/:cycleId/assignments')
  @Roles(SystemRole.HR_ADMIN, SystemRole.HR_MANAGER, SystemRole.SYSTEM_ADMIN, SystemRole.DEPARTMENT_HEAD)
  async getCycleAssignments(@Param('cycleId') cycleId: string) {
    return this.performanceService.getAppraisalAssignmentsByCycle(cycleId);
  }

  @Get('assignments/:assignmentId')
  async getAppraisalAssignment(@Param('assignmentId') assignmentId: string, @CurrentUser() user: CurrentUserData) {
    return this.performanceService.getAppraisalAssignmentById(assignmentId);
  }

  @Get('records/:recordId')
  async getAppraisalRecord(@Param('recordId') recordId: string, @CurrentUser() user: CurrentUserData) {
    return this.performanceService.getAppraisalRecordById(recordId);
  }

  @Get('disputes/:disputeId')
  @Roles(SystemRole.HR_ADMIN, SystemRole.HR_MANAGER, SystemRole.SYSTEM_ADMIN)
  async getAppraisalDispute(@Param('disputeId') disputeId: string) {
    return this.performanceService.getAppraisalDisputeById(disputeId);
  }

  // STATUS MANAGEMENT ENDPOINTS
  @Put('assignments/:assignmentId/status')
  @Roles(SystemRole.HR_ADMIN, SystemRole.HR_MANAGER, SystemRole.SYSTEM_ADMIN)
  async updateAssignmentStatus(
    @Param('assignmentId') assignmentId: string,
    @Body('status') status: string,
  ) {
    return this.performanceService.updateAppraisalAssignmentStatus(assignmentId, status);
  }

  @Put('records/:recordId/status')
  @Roles(SystemRole.HR_ADMIN, SystemRole.HR_MANAGER, SystemRole.SYSTEM_ADMIN)
  async updateRecordStatus(
    @Param('recordId') recordId: string,
    @Body('status') status: string,
  ) {
    return this.performanceService.updateAppraisalRecordStatus(recordId, status);
  }

  @Put('disputes/:disputeId/assign-reviewer')
  @Roles(SystemRole.HR_ADMIN, SystemRole.HR_MANAGER, SystemRole.SYSTEM_ADMIN)
  async assignDisputeReviewer(
    @Param('disputeId') disputeId: string,
    @Body('reviewerId') reviewerId: string,
  ) {
    return this.performanceService.assignDisputeReviewer(disputeId, reviewerId);
  }

  // ANALYTICS AND DASHBOARD ENDPOINTS
  @Get('analytics')
  @Roles(SystemRole.HR_ADMIN, SystemRole.HR_MANAGER, SystemRole.SYSTEM_ADMIN)
  async getPerformanceAnalytics(@Query('cycleId') cycleId?: string) {
    return this.performanceService.getPerformanceAnalytics(cycleId);
  }

  @Get('analytics/department/:departmentId')
  @Roles(SystemRole.HR_ADMIN, SystemRole.HR_MANAGER, SystemRole.SYSTEM_ADMIN, SystemRole.DEPARTMENT_HEAD)
  async getDepartmentPerformanceAnalytics(
    @Param('departmentId') departmentId: string,
    @Query('cycleId') cycleId?: string,
  ) {
    return this.performanceService.getDepartmentPerformanceAnalytics(departmentId, cycleId);
  }

  @Get('analytics/trends')
  @Roles(SystemRole.HR_ADMIN, SystemRole.HR_MANAGER, SystemRole.SYSTEM_ADMIN, SystemRole.DEPARTMENT_HEAD)
  async getHistoricalTrendAnalysis(@Query('employeeProfileId') employeeProfileId?: string) {
    return this.performanceService.getHistoricalTrendAnalysis(employeeProfileId);
  }

  @Get('reports/export')
  @Roles(SystemRole.HR_ADMIN, SystemRole.HR_MANAGER, SystemRole.SYSTEM_ADMIN)
  async exportPerformanceReport(@Query('cycleId') cycleId?: string) {
    return this.performanceService.exportPerformanceReport(cycleId);
  }
}
