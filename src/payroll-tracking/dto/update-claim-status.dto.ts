import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class UpdateClaimStatusDto {
  @IsNotEmpty()
  @IsString()
  status: string;   // UNDER_REVIEW, APPROVED, REJECTED

  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @IsOptional()
  @IsString()
  resolutionComment?: string;
}
