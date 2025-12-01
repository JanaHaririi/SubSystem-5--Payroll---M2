import { IsDate, IsEnum, IsInt, IsMongoId, IsOptional, IsString, Min } from "class-validator";
import { Type } from "class-transformer";

export class CreateJobRequisitionDto {
  @IsString()
  requisitionId: string;

  @IsInt()
  @Min(1)
  openings: number;

  @IsString()
  location: string;

  @IsMongoId()
  hiringManagerId: string;

  @IsOptional()
  @IsEnum(['draft', 'published', 'closed'])
  publishStatus?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  postingDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  expiryDate?: Date;
}