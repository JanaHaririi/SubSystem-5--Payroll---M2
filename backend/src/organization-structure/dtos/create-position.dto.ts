import { IsString, IsOptional, IsMongoId, IsBoolean } from 'class-validator';

export class CreatePositionDto {
  @IsString()
  code: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsMongoId()
  departmentId: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
