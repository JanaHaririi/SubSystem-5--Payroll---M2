// payroll-execution/dto/update-payroll-period.dto.ts
import { IsNotEmpty, IsDateString } from 'class-validator';

export class UpdatePayrollPeriodDto {
  @IsNotEmpty()
  payrollRunId: string;

  @IsNotEmpty()
  @IsDateString()
  payrollPeriod: string; // ex: "2025-01-31"
}
