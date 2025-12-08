import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ConfigStatus } from '../enums/payroll-configuration-enums';

export class editPayTypeDTO {
  @IsString()
  @IsOptional()
  type?: string;

  @IsOptional()
  @IsNumber()
  @Min(6000)
  amount?: number;

  @IsOptional()
  @IsEnum(ConfigStatus)
  status?: ConfigStatus;
}


