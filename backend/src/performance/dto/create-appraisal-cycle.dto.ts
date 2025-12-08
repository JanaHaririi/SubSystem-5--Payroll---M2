import { IsString, IsEnum, IsArray, IsOptional, IsDate, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AppraisalTemplateType, AppraisalCycleStatus } from '../enums/performance.enums';

export class CycleTemplateAssignmentDto {
  @IsString()
  templateId: string;

  @IsArray()
  @IsString({ each: true })
  departmentIds: string[];
}

export class CreateAppraisalCycleDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(AppraisalTemplateType)
  cycleType: AppraisalTemplateType;

  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @IsDate()
  @Type(() => Date)
  endDate: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  managerDueDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  employeeAcknowledgementDueDate?: Date;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CycleTemplateAssignmentDto)
  templateAssignments: CycleTemplateAssignmentDto[];

  @IsOptional()
  @IsEnum(AppraisalCycleStatus)
  status?: AppraisalCycleStatus;
}