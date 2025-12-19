import { IsString, IsOptional, IsMongoId, IsBoolean } from 'class-validator';

export class CreateDepartmentDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

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
