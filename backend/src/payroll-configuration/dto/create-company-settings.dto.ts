import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateCompanySettingsDto {
  @IsString()
  @IsNotEmpty()
  payDate: string; 

  @IsString()
  @IsNotEmpty()
  timeZone: string; 
  
  @IsString()
  @IsNotEmpty()
  currency: string; 

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  payCycle?: string;
}
