import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateDisputeDto {
  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsString()
  payslipId: string;

  @IsOptional()
  @IsString()
  evidenceUrl?: string;
}
