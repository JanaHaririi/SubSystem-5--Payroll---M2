import { IsOptional, IsString, IsDateString } from 'class-validator';

export class UpdatePositionAssignmentDto {
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
