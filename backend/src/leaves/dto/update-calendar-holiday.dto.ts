import { IsMongoId } from 'class-validator';

export class UpdateCalendarHolidayDto {
  @IsMongoId()
  holidayId: string;
}
