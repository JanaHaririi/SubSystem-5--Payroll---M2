import { IsNotEmpty, Min, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { PolicyType } from '../enums/payroll-configuration-enums';
import { Applicability } from '../enums/payroll-configuration-enums';
import { ConfigStatus } from '../enums/payroll-configuration-enums';

export class editPayGradeDTO {
        
        @IsString()
        @IsOptional()
        grade: string;
    
        @IsOptional()
        @IsNumber()
        @Min(6000)
        baseSalary: number;

        @IsOptional()
        @IsNumber()
        @Min(6000)
        grossSalary: number;
    
        @IsOptional()
        @IsEnum(ConfigStatus)
        status: ConfigStatus;
    
    
}