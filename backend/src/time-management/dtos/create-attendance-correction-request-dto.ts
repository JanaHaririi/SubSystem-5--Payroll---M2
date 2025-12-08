import { IsNotEmpty, IsOptional, IsEnum, IsString } from "class-validator";
import { CorrectionRequestStatus } from "../models/enums/index";
import { Types } from "mongoose";


export class AttendanceCorrectionRequestDto {
  @IsNotEmpty()
  @IsString()
  employeeId: Types.ObjectId; 

  @IsNotEmpty()
  @IsString()
  attendanceRecordId: Types.ObjectId; 

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsEnum(CorrectionRequestStatus)
  status?: CorrectionRequestStatus; 
}

export class UpdateAttendanceCorrectionRequestDto {
  @IsNotEmpty()
  @IsString()
  @IsOptional()
  employeeId?: Types.ObjectId; 

  @IsNotEmpty()
  @IsString()
  @IsOptional()
  attendanceRecordId?: Types.ObjectId; 

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsEnum(CorrectionRequestStatus)
  status?: CorrectionRequestStatus; 
}
