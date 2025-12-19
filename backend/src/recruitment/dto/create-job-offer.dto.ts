import {IsArray, IsDate, IsEmail, IsEnum, IsInt, IsMongoId, IsOptional,  IsString,  Min, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { OfferResponseStatus } from '../enums/offer-response-status.enum';
import { OfferFinalStatus } from '../enums/offer-final-status.enum';
//import { ApprovalStatus } from '../enums/approval-status.enum';

export class CreateJobOfferDto {

  @IsMongoId()
  applicationId: string;

  @IsMongoId()
  candidateId: string;

  @IsOptional()
  @IsMongoId()
  hrEmployeeId?: string;

  @IsInt()
  @Min(0)
  grossSalary: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  signingBonus: number;

  @IsOptional()
  @IsArray()
  @IsString()
  benefits: string;

  @IsOptional()
  @IsString()
  conditions: string;

  @IsOptional()
  @IsString()
  insurances: string;

  @IsString()
  content: string;

  @IsString()
  role: string

  @IsDate()
  @Type(() => Date)
  deadline: Date;

  @IsOptional()
  @IsEnum(OfferResponseStatus)
  applicantResponse?: OfferResponseStatus;

  // @IsOptional()
  // @IsArray()
  // @ValidateNested({ each: true })
  // @Type(() => ApproverDto)
  // approvers?: ApproverDto[];

  @IsOptional()
  @IsEnum(OfferFinalStatus)
  finalStatus?: OfferFinalStatus;

}
