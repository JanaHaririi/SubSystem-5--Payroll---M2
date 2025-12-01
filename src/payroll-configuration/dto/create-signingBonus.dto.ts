import { IsNotEmpty, Min, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { PolicyType } from '../enums/payroll-configuration-enums';
import { Applicability } from '../enums/payroll-configuration-enums';
import { ConfigStatus } from '../enums/payroll-configuration-enums';

export class createsigningBonusesDTO {
        
        @IsString()
        @IsNotEmpty()
        positionName: string;
    
        @IsNotEmpty()
        @IsNumber()
        @Min(0)
        amount: number;
    
        @IsNotEmpty()
        @IsEnum(ConfigStatus)
        status: ConfigStatus;
    
    
}