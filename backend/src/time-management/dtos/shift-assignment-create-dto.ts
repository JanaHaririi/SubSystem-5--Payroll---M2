import {
  IsDateString,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';
import { Types } from 'mongoose';

export class ShiftAssignmentCreateDto {
  @IsOptional()
  @IsMongoId()
  employeeId?: Types.ObjectId;

  @IsOptional()
  @IsMongoId()
  departmentId?: Types.ObjectId;

  @IsOptional()
  @IsMongoId()
  positionId?: Types.ObjectId;

  @IsNotEmpty()
  @IsMongoId()
  shiftId: Types.ObjectId;

  @IsOptional()
  @IsMongoId()
  scheduleRuleId?: Types.ObjectId;

  @IsNotEmpty()
  @IsDateString()
  startDate: Date;

  @IsOptional()
  @IsDateString()
  endDate?: Date;
}