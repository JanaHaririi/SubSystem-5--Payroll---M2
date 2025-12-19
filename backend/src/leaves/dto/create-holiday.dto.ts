// leaves/dto/create-holiday.dto.ts
import { IsEnum, IsDateString, IsOptional, IsString, IsBoolean } from 'class-validator';
import { HolidayType } from '../../time-management/models/enums/index';

export class CreateHolidayDto {
  @IsEnum(HolidayType)
  type: HolidayType;

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
  active?: boolean = true;
}