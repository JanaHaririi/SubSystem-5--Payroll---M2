import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { DisputeStatus } from '../enums/payroll-tracking-enum';

export class UpdateDisputeStatusDto {
  @IsEnum(DisputeStatus)
  @IsNotEmpty()
  status: DisputeStatus;   // final status set by payroll manager


  @IsString()
  @IsOptional()
  resolutionComment?: string;
}
