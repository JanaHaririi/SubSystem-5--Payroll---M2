import { IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

class ApprovalStepDto {
  @IsOptional()
  role?: string;

  @IsOptional()
  order?: number;
}

export class UpdateApprovalWorkflowDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ApprovalStepDto)
  flow?: ApprovalStepDto[];
}
