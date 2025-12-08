import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ConfigStatus } from '../enums/payroll-configuration-enums';

export class editPayGradeDTO {
  @IsString()
  @IsOptional()
  grade?: string;

  @IsOptional()
  @IsNumber()
  @Min(6000)
  baseSalary?: number;

  @IsOptional()
  @IsNumber()
  @Min(6000)
  grossSalary?: number;

  @IsOptional()
  @IsEnum(ConfigStatus)
  status?: ConfigStatus;
}


