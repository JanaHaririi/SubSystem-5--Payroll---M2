import { IsArray, IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { allowance } from '../models/allowance.schema';
import { ConfigStatus } from '../enums/payroll-configuration-enums';

export class createAllowanceDto {
    @IsString()
    name: string;

    @IsNumber()
    @Min(0)
    amount: number;

    @IsEnum(ConfigStatus)
    status?: ConfigStatus;


}