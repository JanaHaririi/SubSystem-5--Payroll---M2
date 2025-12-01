import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { OnboardingService } from '../services/onboarding.service';
import { CreateOnboardingTaskDto } from '../dto/create-onboarding-task.dto';
import { UpdateOnboardingTaskDto } from '../dto/update-onboarding-task.dto';
import { CreateContractDto } from '../dto/create-onboarding-contract.dto';
import { UpdateContractDto } from '../dto/update-onboarding-contract.dto';
import { CreateOnboardingDocumentDto } from '../dto/create-onboarding-document.dto';
import { UpdateOnboardingDocumentDto } from '../dto/update-onboarding-document.dto';

@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  // Contract related controller functions

  @Get('contracts')
  async getAllContracts() {
    return this.onboardingService.getAllContracts();
  }

  @Get('contracts/:id')
  async getContract(@Param('id') id: string) {
    return this.onboardingService.getContractById(id);
  }

  @Post('contracts')
  async createContract(@Body() dto: CreateContractDto) {
    return this.onboardingService.createContract(dto);
  }

  @Patch('contracts/:id')
  async updateContract(@Param('id') id: string, @Body() dto: UpdateContractDto) {
    return this.onboardingService.updateContract(id, dto);
  }

  // Document related controller functions

  @Get('documents')
  async getAllDocuments() {
    return this.onboardingService.getAllOnboardingDocuments();
  }

  @Get('documents/:id')
  async getDocument(@Param('id') id: string) {
    return this.onboardingService.getOnboardingDocument(id);
  }

  @Get('documents/candidate/:candidateId')
  async getDocumentsByCandidate(@Param('candidateId') candidateId: string) {
    return this.onboardingService.getDocumentsByCandidate(candidateId);
  }

  @Get('documents/employee/:employeeId')
  async getDocumentsByEmployee(@Param('employeeId') employeeId: string) {
    return this.onboardingService.getDocumentsByEmployee(employeeId);
  }

  @Post('documents')
  async createDocument(@Body() dto: CreateOnboardingDocumentDto) {
    return this.onboardingService.createOnboardingDocument(dto);
  }

  @Patch('documents/:id')
  async updateDocument(@Param('id') id: string, @Body() dto: UpdateOnboardingDocumentDto) {
    return this.onboardingService.updateOnboardingDocument(id, dto);
  }

  @Delete('documents/:id')
  async deleteDocument(@Param('id') id: string) {
    return this.onboardingService.deleteOnboardingDocument(id);
  }

  // Onboarding task related controller functions

  @Get('tasks')
  async getAllTasks() {
    return this.onboardingService.getAllTasks();
  }

  @Get('tasks/:id')
  async getTask(@Param('id') id: string) {
    return this.onboardingService.getTaskById(id);
  }

  @Post('tasks')
  async createTask(@Body() dto: CreateOnboardingTaskDto) {
    return this.onboardingService.createOnboardingTask(dto);
  }

  @Patch('tasks/:id')
  async updateTask(@Param('id') id: string, @Body() dto: UpdateOnboardingTaskDto) {
    return this.onboardingService.updateOnboardingTask(id, dto);
  }

  @Delete('tasks/:id/:taskIndex')
  async deleteTask(@Param('id') id: string, @Param('taskIndex') taskIndex: string) {
    return this.onboardingService.deleteTask(id, +taskIndex);
  }

  @Delete('tasks/:id')
  async deleteOnboardingRecord(@Param('id') id: string) {
    return this.onboardingService.deleteOnboardingRecord(id);
  }
}