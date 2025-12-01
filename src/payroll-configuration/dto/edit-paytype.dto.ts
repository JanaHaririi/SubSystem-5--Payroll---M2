import { IsNotEmpty, Min, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { PolicyType } from '../enums/payroll-configuration-enums';
import { Applicability } from '../enums/payroll-configuration-enums';
import { ConfigStatus } from '../enums/payroll-configuration-enums';

export class editPayTypeDTO {
        
        @IsString()
        @IsOptional()
        type: string;
    
        @IsOptional()
        @IsNumber()
        @Min(6000)
        amount: number;
    
        @IsOptional()
        @IsEnum(ConfigStatus)
        status: ConfigStatus;
    
    
}