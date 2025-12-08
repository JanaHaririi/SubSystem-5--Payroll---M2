import {
  IsArray,IsDate,IsEnum,IsMongoId,IsOptional,IsString ,IsUrl} from "class-validator";
import { Type } from "class-transformer";
import { InterviewMethod } from "../enums/interview-method.enum";
import { InterviewStatus } from "../enums/interview-status.enum";
import { ApplicationStage } from "../enums/application-stage.enum";

export class CreateInterviewDto {
  @IsMongoId()
  applicationId: string;

  @IsEnum(ApplicationStage)
  stage: ApplicationStage;

  @IsDate()
  @Type(() => Date)
  scheduledDate: Date;

  @IsEnum(InterviewMethod)
  method: InterviewMethod;

  @IsArray()
  @IsMongoId({ each: true })
  panel: string[];

  @IsOptional()
  @IsString()
  calendarEventId?: string;

  @IsOptional()
  @IsUrl()
  videoLink?: string;

  @IsOptional()
  @IsEnum(InterviewStatus)
  status?: InterviewStatus;

  @IsOptional()
  @IsMongoId()
  feedbackId?: string;

  @IsOptional()
  @IsString()
  candidateFeedback?: string;
}