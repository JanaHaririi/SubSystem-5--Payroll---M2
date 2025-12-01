import { Controller, Get, Post, Put, Delete, Body, Param, HttpCode, HttpStatus, Patch, Query } from '@nestjs/common';
import { OffboardingService } from '../services/offboarding.service';
import { CreateTerminationRequestDto } from '../dto/create-termination-request.dto';
import { UpdateTerminationRequestDto } from '../dto/update-termination-request.dto';
import { CreateClearanceChecklistDto } from '../dto/create-clearance-checklist.dto';
import { UpdateClearanceChecklistDto } from '../dto/update-clearance-checklist.dto';

@Controller('offboarding')
export class OffboardingController {
  constructor(private readonly offboardingService: OffboardingService) {}

  // termination request endpoints

  @Post('requests')
  @HttpCode(HttpStatus.CREATED)
  async createTerminationRequest(@Body() createDto: CreateTerminationRequestDto) {
    return this.offboardingService.createTerminationRequest(createDto);
  }

  @Get('requests')
async getAllTerminationRequests(@Query('employeeId') employeeId?: string) {
  return this.offboardingService.getAllTerminationRequests(employeeId);
}

  @Get('requests/:id')
  async getTerminationRequest(@Param('id') id: string) {
    return this.offboardingService.getTerminationRequest(id);
  }

  @Patch('requests/:id')
  async updateTerminationRequest(
    @Param('id') id: string,
    @Body() updateDto: UpdateTerminationRequestDto,
  ) {
    return this.offboardingService.updateTerminationRequest(id, updateDto);
  }

  // Clearance Checklist Endpoints 

  @Post('checklists')
  @HttpCode(HttpStatus.CREATED)
  async createClearanceChecklist(@Body() createDto: CreateClearanceChecklistDto) {
    return this.offboardingService.createClearanceChecklist(createDto);
  }

  @Get('checklists')
  async getAllClearanceChecklists(@Query('terminationId') terminationId?: string) {
    return this.offboardingService.getAllClearanceChecklists(terminationId);
  }

  @Get('checklists/:id')
  async getClearanceChecklist(@Param('id') id: string) {
    return this.offboardingService.getClearanceChecklist(id);
  }

  @Patch('checklists/:id')
  async updateClearanceChecklist(
    @Param('id') id: string,
    @Body() updateDto: UpdateClearanceChecklistDto,
  ) {
    return this.offboardingService.updateClearanceChecklist(id, updateDto);
  }

  @Delete('checklists/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteClearanceChecklist(@Param('id') id: string) {
    return this.offboardingService.deleteClearanceChecklist(id);
  }
}