import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { PolicyType } from '../enums/payroll-configuration-enums';
import { Applicability } from '../enums/payroll-configuration-enums';
import { ConfigStatus } from '../enums/payroll-configuration-enums';

export class updatePayrollPoliciesDto {
  @IsString()
  @IsOptional()
  policyName?: string;

  @IsOptional()
  @IsEnum(PolicyType)
  policyType?: PolicyType;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  effectiveDate?: Date;

  @IsOptional()
  @IsNumber()
  ruleDefinition?: {
    percentage?: number;
    fixedAmount?: number;
    thresholdAmount?: number;
  };

  @IsOptional()
  @IsEnum(Applicability)
  applicability?: Applicability;

  @IsOptional()
  @IsEnum(ConfigStatus)
  ConfigStatus?: ConfigStatus;
}


