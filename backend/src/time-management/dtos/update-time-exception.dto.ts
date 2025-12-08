import { IsString, IsEnum, IsOptional } from 'class-validator';
import { TimeExceptionType, TimeExceptionStatus } 
  from '../models/enums';

export class TimeExceptionUpdateDto {
  
  @IsOptional()
  @IsEnum(TimeExceptionType)
  type?: TimeExceptionType;

  @IsOptional()
  @IsString()
  attendanceRecordId?: string;

  @IsOptional()
  @IsString()
  assignedTo?: string;

  @IsOptional()
  @IsEnum(TimeExceptionStatus)
  status?: TimeExceptionStatus;

  @IsOptional()
  @IsString()
  reason?: string;
}
