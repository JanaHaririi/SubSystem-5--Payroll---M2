import { IsArray, IsOptional, IsString } from "class-validator";

export class CreateJobTemplateDto {
  @IsString()
  title: string;

  @IsString()
  department: string;

  @IsArray()
  @IsString({ each: true })
  qualifications: string[];

  @IsArray()
  @IsString({ each: true })
  skills: string[];

  @IsOptional()
  @IsString()
  description?: string;
}