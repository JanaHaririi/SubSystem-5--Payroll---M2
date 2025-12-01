import { IsString, IsOptional, IsMongoId } from 'class-validator';

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
}
