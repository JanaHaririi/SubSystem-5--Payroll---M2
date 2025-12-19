import { IsEnum, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { ConfigStatus } from '../enums/payroll-configuration-enums';

export class createPayTypeDTO {
  @IsNotEmpty()
  @IsString()
  type: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(6000)
  amount: number;

  @IsNotEmpty()
  @IsEnum(ConfigStatus)
  status: ConfigStatus;
}


