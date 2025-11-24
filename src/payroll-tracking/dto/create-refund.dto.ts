import { Type } from 'class-transformer';
import {
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { RefundStatus } from '../enums/payroll-tracking-enum';

/**
 * Nested DTO that represents the structure of the `refundDetails`
 * sub-document on the `refunds` schema.
 */
export class RefundDetailsDto {
  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsNumber()
  amount: number;
}

/**
 * DTO used when creating a new refund record.
 *
 * A refund must be linked to EITHER a claim or a dispute.
 * The service layer should enforce that at least one of
 * `claimId` or `disputeId` is provided.
 */
export class CreateRefundDto {
  @IsOptional()
  @IsMongoId()
  claimId?: string;

  @IsOptional()
  @IsMongoId()
  disputeId?: string;

  @IsNotEmpty()
  @IsMongoId()
  employeeId: string;

  @ValidateNested()
  @Type(() => RefundDetailsDto)
  refundDetails: RefundDetailsDto;
}

/**
 * DTO for updating only the refund status (e.g. when Finance
 * processes it). Kept in same file so all refund-related DTOs
 * are together.
 */
export class UpdateRefundStatusDto {
  @IsNotEmpty()
  @IsEnum(RefundStatus)
  status: RefundStatus;

  @IsOptional()
  @IsMongoId()
  financeStaffId?: string;

  @IsOptional()
  @IsMongoId()
  paidInPayrollRunId?: string;
}
