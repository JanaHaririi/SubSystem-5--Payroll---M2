import { IsEnum, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { PolicyType } from '../enums/payroll-configuration-enums';
import { Applicability } from '../enums/payroll-configuration-enums';
import { ConfigStatus } from '../enums/payroll-configuration-enums';

export class createPayrollPoliciesDto {
  @IsString()
  policyName: string;

  @IsNotEmpty()
  @IsEnum(PolicyType)
  policyType: PolicyType;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNotEmpty()
  effectiveDate: Date;

  @IsNumber()
  @Min(0)
  ruleDefinition: {
    percentage: number;
    fixedAmount: number;
    thresholdAmount: number;
  };

  @IsNotEmpty()
  @IsEnum(Applicability)
  applicability: Applicability;

  @IsNotEmpty()
  @IsEnum(ConfigStatus)
  ConfigStatus: ConfigStatus;
}


