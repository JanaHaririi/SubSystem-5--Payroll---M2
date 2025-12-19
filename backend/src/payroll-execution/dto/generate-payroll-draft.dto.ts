//meant for generating the draft (Phase 1.1) — not exporting a file.
import { IsNotEmpty } from 'class-validator';

export class GeneratePayrollDraftDto {
  @IsNotEmpty()
  payrollRunId: string;

  @IsNotEmpty()
  payrollSpecialistId: string;
}
