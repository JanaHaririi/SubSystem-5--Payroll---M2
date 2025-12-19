import { IsMongoId, IsOptional, IsString } from 'class-validator';

export class CreateStructureApprovalDto {
  @IsMongoId()
  changeRequestId: string;

  @IsMongoId()
  approverEmployeeId: string;

  @IsOptional()
  @IsString()
  comments?: string;
}
