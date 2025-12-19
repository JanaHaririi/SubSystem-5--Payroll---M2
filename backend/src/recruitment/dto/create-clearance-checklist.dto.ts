import { IsMongoId, IsNotEmpty, IsArray, IsOptional, IsBoolean, IsString, IsDateString, IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApprovalStatus } from '../enums/approval-status.enum';

// Sub-DTO for checklist items (department approvals)
class ChecklistItemDto {
  @IsString()
  @IsNotEmpty()
  department: string;

  @IsEnum(ApprovalStatus)
  @IsOptional()
  status?: ApprovalStatus;

  @IsString()
  @IsOptional()
  comments?: string;

  @IsMongoId()
  @IsOptional()
  updatedBy?: string;

  @IsDateString()
  @IsOptional()
  updatedAt?: string;
}

// Sub-DTO for equipment items
class EquipmentItemDto {
  @IsMongoId()
  @IsOptional()
  equipmentId?: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsBoolean()
  @IsOptional()
  returned?: boolean;

  @IsString()
  @IsOptional()
  condition?: string;
}

// Main DTO
export class CreateClearanceChecklistDto {
  @IsMongoId()
  @IsNotEmpty()
  terminationId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChecklistItemDto)
  @IsOptional()
  items?: ChecklistItemDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EquipmentItemDto)
  @IsOptional()
  equipmentList?: EquipmentItemDto[];

  @IsBoolean()
  @IsOptional()
  cardReturned?: boolean;
}