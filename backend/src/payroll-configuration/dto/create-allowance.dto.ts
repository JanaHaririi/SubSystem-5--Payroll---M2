import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ConfigStatus } from '../enums/payroll-configuration-enums';

export class createAllowanceDto {
  @IsString()
  name: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsEnum(ConfigStatus)
  status?: ConfigStatus;
}


