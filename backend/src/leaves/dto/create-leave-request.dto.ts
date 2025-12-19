// src/leaves/dto/create-leave-request.dto.ts
import { IsMongoId, IsDateString, IsString, IsOptional } from 'class-validator';

export class CreateLeaveRequestDto {
  // Employee is taken from JWT – no need in body
  // @IsMongoId()
  // employeeId: string;

  @IsMongoId()
  leaveTypeId: string;

  @IsDateString()
  from: string;

  @IsDateString()
  to: string;

  @IsOptional()
  @IsString()
  justification?: string;

  @IsOptional()
  @IsMongoId()
  attachmentId?: string;
}

