
import { IsMongoId, IsOptional, IsArray, IsBoolean, IsNumber } from 'class-validator';
import { Types } from 'mongoose';
import { Punch } from '../models/attendance-record.schema';

export class CreateAttendanceRecordDto {
  @IsMongoId()
  employeeId: Types.ObjectId;

  @IsOptional()
  @IsArray()
  punches?: Punch[];

  @IsOptional()
  @IsNumber()
  totalWorkMinutes?: number;

  @IsOptional()
  @IsBoolean()
  hasMissedPunch?: boolean;

  @IsOptional()
  @IsArray()
  exceptionIds?: Types.ObjectId[];

  @IsOptional()
  @IsBoolean()
  finalisedForPayroll?: boolean;
}
