import { IsOptional, IsString, IsBoolean } from "class-validator";

export class ScheduleRuleUpdateDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  pattern?: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
