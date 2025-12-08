import { IsMongoId, IsArray, ValidateNested, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

class ApprovalStepDto {
  @IsString()
  role: string;

  @IsNumber()
  order: number;
}

export class CreateApprovalWorkflowDto {
  @IsMongoId()
  leaveTypeId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ApprovalStepDto)
  flow: ApprovalStepDto[];
}
