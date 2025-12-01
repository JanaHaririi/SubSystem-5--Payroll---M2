import { IsString, IsArray, IsOptional, IsNumber, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { AppraisalRecordStatus } from '../enums/performance.enums';

export class RatingEntryDto {
  @IsString()
  key: string;

  @IsString()
  title: string;

  @IsNumber()
  ratingValue: number;

  @IsOptional()
  @IsString()
  ratingLabel?: string;

  @IsOptional()
  @IsNumber()
  weightedScore?: number;

  @IsOptional()
  @IsString()
  comments?: string;
}

export class CreateAppraisalRecordDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RatingEntryDto)
  ratings: RatingEntryDto[];

  @IsOptional()
  @IsNumber()
  totalScore?: number;

  @IsOptional()
  @IsString()
  overallRatingLabel?: string;

  @IsOptional()
  @IsString()
  managerSummary?: string;

  @IsOptional()
  @IsString()
  strengths?: string;

  @IsOptional()
  @IsString()
  improvementAreas?: string;

  @IsOptional()
  @IsEnum(AppraisalRecordStatus)
  status?: AppraisalRecordStatus;
}