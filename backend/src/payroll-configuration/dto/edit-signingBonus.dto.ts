import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ConfigStatus } from '../enums/payroll-configuration-enums';

export class editsigningBonusDTO {
  @IsString()
  @IsOptional()
  positionName?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsEnum(ConfigStatus)
  status?: ConfigStatus;
}


