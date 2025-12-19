import { IsNotEmpty, IsOptional, IsEnum, IsString } from "class-validator";
import { TimeExceptionStatus, TimeExceptionType } from "../models/enums/index";
import { Types } from "mongoose";

export class TimeExceptionCreateDto {
  @IsNotEmpty()
  @IsString()
  employeeId: Types.ObjectId;

  @IsNotEmpty()
  @IsEnum(TimeExceptionType)
  type: TimeExceptionType;

  @IsNotEmpty()
  @IsString()
  attendanceRecordId: Types.ObjectId;

  @IsNotEmpty()
  @IsString()
  assignedTo: Types.ObjectId;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsEnum(TimeExceptionStatus)
  status?: TimeExceptionStatus;
}

export class TimeExceptionUpdateDto {
  @IsNotEmpty()
  @IsString()
  @IsOptional()
  employeeId?: Types.ObjectId;

  @IsOptional()
  @IsEnum(TimeExceptionType)
  type?: TimeExceptionType;

  @IsNotEmpty()
  @IsString()
  @IsOptional()
  attendanceRecordId?: Types.ObjectId;

  @IsNotEmpty()
  @IsString()
  @IsOptional()
  assignedTo?: Types.ObjectId;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsEnum(TimeExceptionStatus)
  status?: TimeExceptionStatus;
}
