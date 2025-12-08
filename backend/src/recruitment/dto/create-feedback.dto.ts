import { IsMongoId, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";

export class CreateFeedbackDto {
  @IsMongoId()
  interviewId: string;

  @IsMongoId()
  interviewerId: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  score: number;

  @IsOptional()
  @IsString()
  comments?: string;
}