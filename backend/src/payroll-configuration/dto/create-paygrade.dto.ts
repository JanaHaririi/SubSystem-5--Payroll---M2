import { IsEnum, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { ConfigStatus } from '../enums/payroll-configuration-enums';

export class addPayGradeDTO {
  @IsString()
  @IsNotEmpty()
  grade: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(6000)
  baseSalary: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(6000)
  grossSalary: number;

  @IsNotEmpty()
  @IsEnum(ConfigStatus)
  status: ConfigStatus;
}


