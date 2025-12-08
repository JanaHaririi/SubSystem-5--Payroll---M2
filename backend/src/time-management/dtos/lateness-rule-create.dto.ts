import { IsNotEmpty, IsOptional, IsString, IsNumber, IsBoolean } from "class-validator";

export class LatenessRuleCreateDto {
  
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  gracePeriodMinutes?: number;

  @IsNumber()
  @IsOptional()
  deductionForEachMinute?: number;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
