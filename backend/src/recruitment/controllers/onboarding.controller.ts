import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { OnboardingService } from '../services/onboarding.service';
import { CreateOnboardingTaskDto } from '../dto/create-onboarding-task.dto';
import { UpdateOnboardingTaskDto } from '../dto/update-onboarding-task.dto';
import { CreateContractDto } from '../dto/create-onboarding-contract.dto';
import { UpdateContractDto } from '../dto/update-onboarding-contract.dto';
import { CreateOnboardingDocumentDto } from '../dto/create-onboarding-document.dto';
import { UpdateOnboardingDocumentDto } from '../dto/update-onboarding-document.dto';

import { AuthGuard } from '../../auth/guards/auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { SystemRole } from 'src/employee-profile/enums/employee-profile.enums';

@Controller('onboarding')
@UseGuards(AuthGuard, RolesGuard)
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  // Contract related controller functions

  @Get('contracts')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE)
  async getAllContracts() {
    return this.onboardingService.getAllContracts();
  }

  @Get('contracts/:id')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE, SystemRole.DEPARTMENT_EMPLOYEE)
  async getContract(@Param('id') id: string) {
    return this.onboardingService.getContractById(id);
  }

  @Post('contracts')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE)
  async createContract(@Body() dto: CreateContractDto) {
    return this.onboardingService.createContract(dto);
  }

  @Patch('contracts/:id')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE, SystemRole.DEPARTMENT_EMPLOYEE)
  async updateContract(@Param('id') id: string, @Body() dto: UpdateContractDto) {
    return this.onboardingService.updateContract(id, dto);
  }

  // Document related controller functions

  @Get('documents')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE)
  async getAllDocuments() {
    return this.onboardingService.getAllOnboardingDocuments();
  }

  @Get('documents/:id')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE, SystemRole.DEPARTMENT_EMPLOYEE)
  async getDocument(@Param('id') id: string) {
    return this.onboardingService.getOnboardingDocument(id);
  }

  @Get('documents/candidate/:candidateId')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE, SystemRole.DEPARTMENT_EMPLOYEE)
  async getDocumentsByCandidate(@Param('candidateId') candidateId: string) {
    return this.onboardingService.getDocumentsByCandidate(candidateId);
  }

  @Get('documents/employee/:employeeId')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE, SystemRole.DEPARTMENT_EMPLOYEE)
  async getDocumentsByEmployee(@Param('employeeId') employeeId: string) {
    return this.onboardingService.getDocumentsByEmployee(employeeId);
  }

  @Post('documents')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE, SystemRole.DEPARTMENT_EMPLOYEE)
  async createDocument(@Body() dto: CreateOnboardingDocumentDto) {
    return this.onboardingService.createOnboardingDocument(dto);
  }

  @Patch('documents/:id')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE, SystemRole.DEPARTMENT_EMPLOYEE)
  async updateDocument(@Param('id') id: string, @Body() dto: UpdateOnboardingDocumentDto) {
    return this.onboardingService.updateOnboardingDocument(id, dto);
  }

  @Delete('documents/:id')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE)
  async deleteDocument(@Param('id') id: string) {
    return this.onboardingService.deleteOnboardingDocument(id);
  }

  // Onboarding task related controller functions

  @Get('tasks')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE, SystemRole.DEPARTMENT_EMPLOYEE)
  async getAllTasks() {
    return this.onboardingService.getAllTasks();
  }

  @Get('tasks/:id')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE, SystemRole.DEPARTMENT_EMPLOYEE)
  async getTask(@Param('id') id: string) {
    return this.onboardingService.getTaskById(id);
  }

  @Post('tasks')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE)
  async createTask(@Body() dto: CreateOnboardingTaskDto) {
    return this.onboardingService.createOnboardingTask(dto);
  }

  @Patch('tasks/:id')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE, SystemRole.DEPARTMENT_EMPLOYEE)
  async updateTask(@Param('id') id: string, @Body() dto: UpdateOnboardingTaskDto) {
    return this.onboardingService.updateOnboardingTask(id, dto);
  }

  @Delete('tasks/:id/:taskIndex')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE)
  async deleteTask(@Param('id') id: string, @Param('taskIndex') taskIndex: string) {
    return this.onboardingService.deleteTask(id, +taskIndex);
  }

  @Delete('tasks/:id')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE)
  async deleteOnboardingRecord(@Param('id') id: string) {
    return this.onboardingService.deleteOnboardingRecord(id);
  }
}