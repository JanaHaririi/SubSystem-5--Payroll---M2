import { IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';
import { StructureRequestType } from '../enums/organization-structure.enums';

export class CreateStructureChangeRequestDto {
  @IsEnum(StructureRequestType)
  requestType: StructureRequestType;

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
