import { IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePaycodeMappingDto {
  @IsMongoId()
  leaveTypeId: string;

  @IsString()
  @IsNotEmpty()
  payrollCode: string;

  @IsOptional()
  @IsString()
  description?: string;
}
