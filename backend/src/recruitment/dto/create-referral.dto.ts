import {IsMongoId, IsString } from "class-validator";

export class CreateReferralDto {

  @IsMongoId()
  referringEmployeeId: string;

  @IsMongoId()
  candidateId: string;

  @IsString()
  role: string;

  @IsString()
  level: string ;

}