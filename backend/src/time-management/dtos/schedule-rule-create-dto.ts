import { IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";


export class ScheduleRuleCreateDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    pattern: string;

    @IsOptional()
    @IsBoolean()
    active?: boolean; 
}