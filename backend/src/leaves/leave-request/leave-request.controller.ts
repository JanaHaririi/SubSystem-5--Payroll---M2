// src/leaves/leave-request/leave-request.controller.ts
import {
  Controller,
  Post,
  Body,
  Param,
  Patch,
  Get,
  Query,
} from '@nestjs/common';
import { LeaveRequestService } from './leave-request.service';
import { CreateLeaveRequestDto } from '../dto/create-leave-request.dto';
import { DecisionLeaveRequestDto } from '../dto/decision-leave-request.dto';


@Controller('leave-requests')
export class LeaveRequestController {
  constructor(private readonly service: LeaveRequestService) {}

  // Employee creates a request
  @Post()
  async create(@Body() dto: CreateLeaveRequestDto) {
    return this.service.createRequest(dto);
  }

  // Approver decides (approve/reject)
  @Patch('decision')
  async decide(@Body() dto: DecisionLeaveRequestDto) {
    return this.service.decideRequest(dto);
  }

  // Employee cancels request
  @Patch('cancel/:requestId')
async cancel(@Param('requestId') requestId: string) {
  return this.service.cancelRequest(requestId);
}


  // List requests for an employee (optional query)
  @Get('employee/:employeeId')
  async listForEmployee(@Param('employeeId') employeeId: string, @Query('status') status?: string) {
    return this.service.getRequestsForEmployee(employeeId, status);
  }

  // Get single request
  @Get(':id')
  async get(@Param('id') id: string) {
    return this.service.getRequestById(id);
  }
}
