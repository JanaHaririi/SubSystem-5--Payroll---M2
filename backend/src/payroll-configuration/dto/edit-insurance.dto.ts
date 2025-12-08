import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ConfigStatus } from '../enums/payroll-configuration-enums';

export class editInsuranceBracketsDTO {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  amount?: number;

  @IsEnum(ConfigStatus)
  @IsOptional()
  status?: ConfigStatus;

  @IsNumber()
  @Min(0)
  @IsOptional()
  minSalary?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  maxSalary?: number;

  @IsNumber()
  @IsOptional()
  EmployeeRate?: number;

  @IsNumber()
  @IsOptional()
  EmployerRate?: number;
}


