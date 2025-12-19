import { IsString, IsDate, IsEnum, IsOptional, IsMongoId, IsArray, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { OnboardingTaskStatus } from '../enums/onboarding-task-status.enum';

// Sub-DTO for individual tasks
class TaskItemDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  department?: string;

  @IsEnum(OnboardingTaskStatus)
  @IsOptional()
  status?: OnboardingTaskStatus;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  deadline?: Date;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  completedAt?: Date;

  @IsMongoId()
  @IsOptional()
  documentId?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateOnboardingTaskDto {
  @IsMongoId()
  @IsOptional()
  employeeId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaskItemDto)
  @IsOptional()
  tasks?: TaskItemDto[];

  @IsBoolean()
  @IsOptional()
  completed?: boolean;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  completedAt?: Date;
}
``