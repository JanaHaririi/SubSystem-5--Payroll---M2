// payroll-execution/phase1-1A/dto/process-hr-events.dto.ts
import { IsNotEmpty } from 'class-validator';

export class ProcessHREventsDto {
  @IsNotEmpty()
  payrollRunId: string;

  @IsNotEmpty()
  payrollSpecialistId: string;
}
