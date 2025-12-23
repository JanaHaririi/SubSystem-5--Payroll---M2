import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateClaimStatusDto {
  @IsString()
  @IsNotEmpty()
  status: string;   // e.g. APPROVED | REJECTED | UNDER_REVIEW

  @IsString()
  @IsOptional()
  resolutionComment?: string;
}
