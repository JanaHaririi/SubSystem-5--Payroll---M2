import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApprovalDecision } from '../enums/organization-structure.enums';

export class UpdateStructureApprovalDto {
  @IsEnum(ApprovalDecision)
  decision: ApprovalDecision;

  @IsOptional()
  @IsString()
  comments?: string;
}
