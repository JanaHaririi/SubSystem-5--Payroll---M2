import { IsMongoId, IsOptional, IsEnum, IsString , IsDate , IsArray ,ValidateNested } from 'class-validator';
import { DocumentType } from '../enums/document-type.enum';
import { Type } from 'class-transformer';
import { OnboardingTaskStatus } from '../enums/onboarding-task-status.enum';

export class OnboardingTaskDto {
  @IsString()
  name: string;

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


export class CreateOnboardingDocumentDto {
  @IsMongoId()
  @IsOptional()
  candidateId?: string;

  @IsMongoId()
  @IsOptional()
  employeeId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OnboardingTaskDto)
  @IsOptional()
  tasks?: OnboardingTaskDto[];

  @IsEnum(DocumentType)
  type: DocumentType;  

  @IsString()
  documentName: string;

  @IsString()
  filePath: string; 
}