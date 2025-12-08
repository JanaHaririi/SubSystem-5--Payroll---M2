import { IsNumber, IsArray, IsOptional, IsMongoId } from 'class-validator';

export class CreateCalendarDto {
  @IsNumber()
  year: number;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  holidays?: string[];

  @IsOptional()
  blockedPeriods?: {
    from: Date;
    to: Date;
    reason: string;
  }[];
}
