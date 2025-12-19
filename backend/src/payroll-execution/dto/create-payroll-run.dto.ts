import { IsNotEmpty, IsDateString } from 'class-validator';

export class CreatePayrollRunDto {
  @IsNotEmpty()
  runId: string; // business display id, e.g. PR-2025-0001

  @IsNotEmpty()
  entity: string;

  @IsNotEmpty()
  @IsDateString()
  payrollPeriod: string; // YYYY-MM-DD

  @IsNotEmpty()
  payrollSpecialistId: string; // creator employee id
}
