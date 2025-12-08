import { IsString } from 'class-validator';

export class RejectTimeExceptionDto {
  @IsString()
  rejectedBy: string;

  @IsString()
  reason: string;
}
