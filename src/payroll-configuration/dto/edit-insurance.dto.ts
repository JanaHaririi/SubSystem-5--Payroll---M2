import { IsArray, IsNotEmpty, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ConfigStatus } from '../enums/payroll-configuration-enums';


export class editInsuranceBracketsDTO {

    @IsString()
    @IsOptional()
    name: string;

    @IsNumber()
    @Min(0)
    amount: number;

    @IsEnum(ConfigStatus)
    @IsOptional()
    status: ConfigStatus;

    @IsNumber()
    @Min(0)
    minSalary: Number;

    @IsNumber()
    @Min(0)
    maxSalary: Number;

    @IsNumber()
    @IsOptional()
    EmployeeRate: Number;

    @IsNumber()
    @IsOptional()
    EmployerRate: Number;

}