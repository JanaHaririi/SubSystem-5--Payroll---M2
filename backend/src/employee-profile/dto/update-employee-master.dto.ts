import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsEmail,
  IsEnum,
  IsDate,
  IsMongoId,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  EmployeeStatus,
  ContractType,
  WorkType,
  Gender,
  MaritalStatus,
} from '../enums/employee-profile.enums';
import { AddressDto } from './update-contact-info.dto';

export class UpdateEmployeeMasterDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  middleName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  nationalId?: string;

  @ApiProperty({ required: false, enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiProperty({ required: false, enum: MaritalStatus })
  @IsOptional()
  @IsEnum(MaritalStatus)
  maritalStatus?: MaritalStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dateOfBirth?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  mobilePhone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  homePhone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  personalEmail?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  workEmail?: string;

  @ApiProperty({ required: false, type: AddressDto })
  @IsOptional()
  address?: AddressDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  biography?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  profilePictureUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dateOfHire?: Date;

  @ApiProperty({ required: false, enum: EmployeeStatus })
  @IsOptional()
  @IsEnum(EmployeeStatus)
  status?: EmployeeStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  statusEffectiveFrom?: Date;

  @ApiProperty({ required: false, enum: ContractType })
  @IsOptional()
  @IsEnum(ContractType)
  contractType?: ContractType;

  @ApiProperty({ required: false, enum: WorkType })
  @IsOptional()
  @IsEnum(WorkType)
  workType?: WorkType;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  contractStartDate?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  contractEndDate?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsMongoId()
  primaryPositionId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsMongoId()
  primaryDepartmentId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsMongoId()
  supervisorPositionId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsMongoId()
  payGradeId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsMongoId()
  accessProfileId?: string;
}
