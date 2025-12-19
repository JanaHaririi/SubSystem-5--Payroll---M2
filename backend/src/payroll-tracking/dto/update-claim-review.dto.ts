import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ClaimReviewStatus } from '../enums/payroll-tracking-enum';

export class UpdateClaimReviewDto {
  @IsEnum(ClaimReviewStatus)
  @IsOptional()
  reviewStatus: ClaimReviewStatus;

  @IsString()
  @IsOptional()
  reviewComment?: string;
}
