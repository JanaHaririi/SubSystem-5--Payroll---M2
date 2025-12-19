import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateDisputeDto {
  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsString()
  employeeId: string;  // will map to ObjectId

  @IsNotEmpty()
  @IsString()
  payslipId: string;   // ObjectId as string

  @IsOptional()
  @IsString()
  evidence?: string;   // matches schema exactly
}
