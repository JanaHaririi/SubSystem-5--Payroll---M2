 import { IsString, IsNumber } from 'class-validator';

export class ApplyOvertimeDto {
  @IsString()
  employeeId: string;

  @IsString()
  date: string;

  @IsNumber()
  workedHours: number;

  @IsNumber()
  scheduledHours: number;
}
