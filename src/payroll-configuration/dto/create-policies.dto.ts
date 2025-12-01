import { IsInt, IsEnum, IsOptional, IsString, Min, IsNotEmpty, IsNumber} from "class-validator";
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
    }

    @IsNotEmpty()
    applicability: Applicability;

    //??
    @IsNotEmpty()
    ConfigStatus: ConfigStatus;

}