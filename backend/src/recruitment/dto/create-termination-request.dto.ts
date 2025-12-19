import { IsEnum, IsString, IsOptional, IsDateString, IsMongoId, IsNotEmpty } from 'class-validator';
import { PartialType, OmitType } from '@nestjs/mapped-types';
import { TerminationInitiation } from '../enums/termination-initiation.enum';
import { TerminationStatus } from '../enums/termination-status.enum';

export class CreateTerminationRequestDto {
  @IsMongoId()
  @IsNotEmpty()
  employeeId: string;

  @IsEnum(TerminationInitiation)
  @IsNotEmpty()
  initiator: TerminationInitiation;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsString()
  @IsOptional()
  employeeComments?: string;

  @IsString()
  @IsOptional()
  hrComments?: string;

  @IsEnum(TerminationStatus)
  @IsOptional()
  status?: TerminationStatus;

  @IsDateString()
  @IsOptional()
  terminationDate?: string;

  @IsMongoId()
  @IsNotEmpty()
  contractId: string;
}