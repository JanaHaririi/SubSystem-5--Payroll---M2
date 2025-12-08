import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
export class CreateClaimDto {
  @IsNotEmpty()
  @IsString()
  description: string;

    @IsNotEmpty()
    @IsString()
    employeeId: string;

    @IsNotEmpty()
    @IsString()
    payslipId: string;

    @IsOptional()
    @IsString()
    evidence?: string;
}
