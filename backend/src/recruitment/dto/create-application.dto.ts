import {
  IsEnum,
  IsMongoId,
  IsOptional
} from "class-validator";
import { ApplicationStage } from "../enums/application-stage.enum";
import { ApplicationStatus } from "../enums/application-status.enum";

export class CreateApplicationDto {
  @IsMongoId()
  candidateId: string;

  @IsMongoId()
  requisitionId: string;

  @IsOptional()
  @IsMongoId()
  assignedHr?: string;

  @IsOptional()
  @IsEnum(ApplicationStage)
  currentStage?: ApplicationStage;

  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;
}