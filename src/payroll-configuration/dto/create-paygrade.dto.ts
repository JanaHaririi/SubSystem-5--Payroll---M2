import { IsNotEmpty, Min, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { PolicyType } from '../enums/payroll-configuration-enums';
import { Applicability } from '../enums/payroll-configuration-enums';
import { ConfigStatus } from '../enums/payroll-configuration-enums';

export class addPayGradeDTO {
        @IsString()
        @IsNotEmpty()
        grade: string;
    
        @IsNotEmpty()
        @IsNumber()
        @Min(6000)
        baseSalary: number;

        @IsNotEmpty()
        @IsNumber()
        @Min(6000)
        grossSalary: number;
    
        @IsNotEmpty()
        @IsEnum(ConfigStatus)
        status: ConfigStatus;
    
    
}