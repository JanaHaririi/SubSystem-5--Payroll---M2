import { IsOptional, IsString, IsNumber, IsBoolean } from 'class-validator';

export class LatenessRuleUpdateDto {
  
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  gracePeriodMinutes?: number;

  @IsOptional()
  @IsNumber()
  deductionForEachMinute?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
