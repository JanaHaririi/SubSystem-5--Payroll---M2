// src/leaves/dto/adjust-leave.dto.ts

import { IsString, IsNumber } from 'class-validator';

export class AdjustLeaveDto {
  @IsString()
  employeeId: string;

  @IsString()
  leaveType: string;

  @IsNumber()
  newBalance: number;

  @IsString()
  hrId: string;

  @IsString()
  reason: string;
}
