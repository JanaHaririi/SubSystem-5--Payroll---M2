import { IsEnum, IsOptional, IsString } from 'class-validator';
import { DisputeReviewStatus } from '../enums/payroll-tracking-enum';

export class UpdateDisputeReviewDto {
  @IsEnum(DisputeReviewStatus)
  @IsOptional()
  reviewStatus: DisputeReviewStatus;

  @IsString()
  @IsOptional()
  reviewComment?: string;
}
