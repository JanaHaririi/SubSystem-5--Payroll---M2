import { IsEnum } from 'class-validator';
import { AppraisalCycleStatus } from '../enums/performance.enums';

export class UpdateAppraisalCycleStatusDto {
  @IsEnum(AppraisalCycleStatus)
  status: AppraisalCycleStatus;
}