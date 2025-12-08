 import { IsString, IsEnum, IsOptional } from 'class-validator';
import { TimeExceptionType, TimeExceptionStatus } 
  from '../models/enums';

export class TimeExceptionCreateDto {
  
  @IsString()
  employeeId: string;

  @IsEnum(TimeExceptionType)
  type: TimeExceptionType;

  @IsString()
  attendanceRecordId: string;

  @IsString()
  assignedTo: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
