import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ClaimStatus } from '../enums/payroll-tracking-enum';

export class UpdateClaimStatusDto {
  @IsEnum(ClaimStatus)
  @IsNotEmpty()
  status: ClaimStatus;   // final status set by payroll manager

  @IsString()
  @IsOptional()
  resolutionComment?: string;
}
