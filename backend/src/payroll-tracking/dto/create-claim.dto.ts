import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class CreateClaimDto {
  @IsNotEmpty()
  @IsString()
  employeeId: string;

  @IsNotEmpty()
  @IsString()
  claimType: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNumber()
  amount: number;
}
