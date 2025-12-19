// leaves/dto/update-holiday.dto.ts
import { IsEnum, IsDateString, IsOptional, IsString, IsBoolean } from 'class-validator';
import { HolidayType } from '../../time-management/models/enums/index';

export class UpdateHolidayDto {
  @IsOptional()
  @IsEnum(HolidayType)
  type?: HolidayType;

  @IsOptional()
  @IsDateString()
  startDate?: string;

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