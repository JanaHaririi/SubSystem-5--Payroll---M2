// payroll-execution/phase4/dto/generate-payslips.dto.ts
import { IsNotEmpty } from 'class-validator';

export class GeneratePayslipsDto {
  @IsNotEmpty()
  payrollRunId: string;
}
