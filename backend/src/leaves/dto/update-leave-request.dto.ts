import { IsMongoId, IsEnum, IsOptional, IsString } from 'class-validator';
import { LeaveStatus } from '../enums/leave-status.enum';

export class UpdateLeaveRequestDto {
  @IsOptional()
  @IsEnum(LeaveStatus)
  status?: LeaveStatus;

  @IsOptional()
  @IsMongoId()
  decidedBy?: string;

  @IsOptional()
  @IsString()
  justification?: string;
}
