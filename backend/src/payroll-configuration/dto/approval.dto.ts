import { IsString, IsNotEmpty, IsIn } from 'class-validator';

/**
 * Generic approval DTO used by the payroll configuration service.
 * - `model`: which collection/model to act on (e.g. 'payGrade', 'payType', 'allowance', ...)
 * - `id`: document id
 * - `action`: 'approve' or 'reject'
 */
export class ApprovalDto {
  @IsString()
  @IsNotEmpty()
  model: string;

  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsIn(['approve', 'reject'])
  action: 'approve' | 'reject';
}
