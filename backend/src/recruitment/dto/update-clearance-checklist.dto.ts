import { PartialType } from '@nestjs/mapped-types';
import { CreateClearanceChecklistDto } from './create-clearance-checklist.dto';

export class UpdateClearanceChecklistDto extends PartialType(CreateClearanceChecklistDto) {}