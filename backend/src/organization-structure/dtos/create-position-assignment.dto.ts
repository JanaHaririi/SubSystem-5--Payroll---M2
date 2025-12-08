import { IsString, IsMongoId, IsOptional, IsDateString } from 'class-validator';

export class CreatePositionAssignmentDto {
  @IsMongoId()
  employeeProfileId: string;

  @IsMongoId()
  positionId: string;

  @IsMongoId()
  departmentId: string;

  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
