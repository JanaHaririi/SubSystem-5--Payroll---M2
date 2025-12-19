import { IsString, IsOptional } from 'class-validator';

export class ApproveTimeExceptionDto {
  @IsString()
  approvedBy: string;

  @IsOptional()
  @IsString()
  comment?: string;
}
