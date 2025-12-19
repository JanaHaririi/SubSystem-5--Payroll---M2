import { IsMongoId, IsOptional, IsEnum, IsString, IsDate } from 'class-validator';
import { DocumentType } from '../enums/document-type.enum';
import { Type } from 'class-transformer';

export class CreateOnboardingDocumentDto {
  @IsMongoId()
  @IsOptional()
  ownerId: string;

  @IsEnum(DocumentType)
  type: DocumentType;

  @IsString()
  filePath: string;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  uploadedAt?: Date;
}