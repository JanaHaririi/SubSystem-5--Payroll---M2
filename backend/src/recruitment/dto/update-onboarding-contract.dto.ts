import { IsString, IsDate, IsOptional, IsNumber, IsArray, IsMongoId,
Min, } from 'class-validator';
import { Type } from 'class-transformer';
export class UpdateContractDto {
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  acceptanceDate?: Date;

  @IsNumber()
  @Min(0)
  @IsOptional()
  grossSalary?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  signingBonus?: number;

  @IsString()
  @IsOptional()
  role?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  benefits?: string[];

  @IsMongoId()
  @IsOptional()
  documentId?: string;

  @IsString()
  @IsOptional()
  employeeSignatureUrl?: string;

  @IsString()
  @IsOptional()
  employerSignatureUrl?: string;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  employeeSignedAt?: Date;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  employerSignedAt?: Date;
}