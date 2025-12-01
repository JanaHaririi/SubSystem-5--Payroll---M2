import { IsString, IsOptional, IsMongoId } from 'class-validator';

export class CreateDepartmentDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsMongoId()
  headPositionId?: string;
}
