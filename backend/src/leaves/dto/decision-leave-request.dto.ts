// src/leaves/dto/decision-leave-request.dto.ts
import { IsMongoId, IsString, IsEnum, IsOptional } from 'class-validator';
import { LeaveStatus } from '../enums/leave-status.enum';

export class DecisionLeaveRequestDto {
  @IsMongoId()
  requestId: string;

  @IsMongoId()
  approverId: string;

  @IsEnum(LeaveStatus)
  decision: LeaveStatus; // should be LeaveStatus.APPROVED or LeaveStatus.REJECTED

  @IsOptional()
  @IsString()
  comment?: string;
}
