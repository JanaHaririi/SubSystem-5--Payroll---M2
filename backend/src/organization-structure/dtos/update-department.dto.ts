import { IsOptional, IsString, IsMongoId, IsBoolean } from 'class-validator';

export class UpdateDepartmentDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  description?: string;

  // Department head must ALWAYS be a position, not an employee
  @IsOptional()
  @IsMongoId()
  headPositionId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
