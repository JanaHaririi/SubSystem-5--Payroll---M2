import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateClaimDto {
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  claimType: string;

  @IsNumber()
  @IsNotEmpty()
  amount: number;
}
