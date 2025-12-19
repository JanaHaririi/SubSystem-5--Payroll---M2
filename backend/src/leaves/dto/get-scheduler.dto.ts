// src/leaves/dto/get-scheduler.dto.ts
import { IsOptional, IsDateString } from 'class-validator';

export class GetSchedulerDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
