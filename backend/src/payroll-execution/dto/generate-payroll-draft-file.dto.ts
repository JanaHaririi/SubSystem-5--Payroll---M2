import { IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class GeneratePayrollDraftFileDto {
  @IsNotEmpty()
  payrollRunId: string;

  @IsOptional()
  @IsIn(['csv', 'xlsx'])
  format?: 'csv' | 'xlsx';
}
