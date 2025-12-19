import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateTerminationRequestDto } from './create-termination-request.dto';

export class UpdateTerminationRequestDto extends PartialType(
  OmitType(CreateTerminationRequestDto, ['employeeId', 'contractId'] as const)
) {}