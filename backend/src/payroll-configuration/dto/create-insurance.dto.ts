import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ConfigStatus } from '../enums/payroll-configuration-enums';

export class createInsuranceBracketsDTO {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsEnum(ConfigStatus)
  @IsOptional()
  status?: ConfigStatus;

  @IsNumber()
  @Min(0)
  minSalary: number;

  @IsNumber()
  @Min(0)
  maxSalary: number;

  @IsNumber()
  @IsNotEmpty()
  employeeRate: number;

  @IsNumber()
  @IsNotEmpty()
  employerRate: number;
}


