// payroll-execution/dto/start-payroll-run.dto.ts
import { IsNotEmpty } from 'class-validator';

export class StartPayrollRunDto {
  @IsNotEmpty()
  payrollRunId: string;

  @IsNotEmpty()
  payrollSpecialistId: string; // stored in payrollRuns schema
}
