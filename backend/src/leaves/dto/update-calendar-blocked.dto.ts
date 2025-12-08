import { IsDateString, IsString } from 'class-validator';

export class UpdateCalendarBlockedDto {
  @IsDateString()
  from: Date;

  @IsDateString()
  to: Date;

  @IsString()
  reason: string;
}
