import { IsArray, IsNotEmpty, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ConfigStatus } from '../enums/payroll-configuration-enums';


export class createInsuranceBracketsDTO {

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsNumber()
    @Min(0)
    amount: number;

    @IsEnum(ConfigStatus)
    status: ConfigStatus;

    @IsNumber()
    @Min(0)
    minSalary: Number;

    @IsNumber()
    @Min(0)
    maxSalary: Number;

    @IsNumber()
    @IsNotEmpty()
    EmployeeRate: Number;

    @IsNumber()
    @IsNotEmpty()
    EmployerRate: Number;

}