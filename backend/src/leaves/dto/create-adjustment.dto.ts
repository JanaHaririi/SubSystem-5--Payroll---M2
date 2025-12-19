import { IsEnum, IsMongoId, IsNumber, IsString, Min } from 'class-validator';
import { AdjustmentType } from '../enums/adjustment-type.enum';

export class CreateAdjustmentDto {
  @IsMongoId()
  employeeId: string;

  @IsMongoId()
  leaveTypeId: string;

  @IsEnum(AdjustmentType)
  adjustmentType: AdjustmentType;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  reason: string;
}