import { IsEnum, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { ConfigStatus } from '../enums/payroll-configuration-enums';

export class createsigningBonusesDTO {
  @IsString()
  @IsNotEmpty()
  positionName: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  amount: number;

  @IsNotEmpty()
  @IsEnum(ConfigStatus)
  status: ConfigStatus;
}


