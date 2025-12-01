// payroll-execution/dto/review-payroll-draft.dto.ts
import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';

export class ReviewPayrollDraftDto {
  @IsNotEmpty()
  @IsString()
  payrollRunId: string;

  @IsOptional()
  @IsString()
  payrollSpecialistId?: string;

  // optional tuning parameter: spike threshold (e.g. 1.5 means +50% is suspicious)
  @IsOptional()
  @IsNumber()
  spikeThreshold?: number;
}
