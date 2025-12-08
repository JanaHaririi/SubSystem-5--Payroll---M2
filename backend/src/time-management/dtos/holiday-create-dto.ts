import { IsNotEmpty, IsOptional, IsEnum, IsDateString, IsBoolean, IsString } from "class-validator";
import { HolidayType } from "../models/enums/index";

export class CreateHolidayDto {
  @IsNotEmpty()
  @IsEnum(HolidayType)
  type: HolidayType;

  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
 