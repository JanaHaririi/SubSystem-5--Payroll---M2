import { IsOptional, IsString, IsMongoId } from 'class-validator';

export class UpdateStructureChangeRequestDto {
  @IsOptional()
  @IsMongoId()
  targetDepartmentId?: string;

  @IsOptional()
  @IsMongoId()
  targetPositionId?: string;

  @IsOptional()
  @IsString()
  details?: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
