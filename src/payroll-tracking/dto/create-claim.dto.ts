import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateClaimDto {
  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsString()
  claimType: string;   // e.g., medical, travel, etc.

  @IsNotEmpty()
  @IsString()
  employeeId: string;  // will be converted to ObjectId in schema

  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  evidence?: string;   // optional text or URL
}
