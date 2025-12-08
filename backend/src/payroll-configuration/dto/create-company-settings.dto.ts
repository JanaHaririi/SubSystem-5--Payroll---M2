import { IsString, IsNotEmpty } from 'class-validator';

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
}
