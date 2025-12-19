import { IsNumber, IsOptional, IsString, IsNotEmpty } from 'class-validator';

export class CreatePayrollDisputeDto {
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @IsOptional()
  amount?: number;
}

