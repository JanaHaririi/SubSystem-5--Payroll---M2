import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateRefundStatusDto {
  @IsString()
  @IsNotEmpty()
  status: string;   // APPROVED | REJECTED | PAID | PENDING

  @IsString()
  @IsOptional()
  resolutionComment?: string;

  @IsString()
  @IsOptional()
  financeStaffId?: string;        // FIXED → required by service

  @IsString()
  @IsOptional()
  paidInPayrollRunId?: string;    // FIXED → required by service
}
