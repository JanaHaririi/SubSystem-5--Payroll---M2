import { IsArray, IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, isString, IsString, Min } from 'class-validator';
import { ConfigStatus } from '../enums/payroll-configuration-enums';


export class createResigAndTerminBenefitsDTO {

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsNumber()
    @Min(0)
    amount: number;

    @IsString()
    @IsOptional()
    terms: string;

    @IsEnum(ConfigStatus)
    status: ConfigStatus;

}