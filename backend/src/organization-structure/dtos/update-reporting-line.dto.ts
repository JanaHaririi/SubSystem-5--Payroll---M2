import { IsMongoId, IsNotEmpty } from 'class-validator';

export class UpdateReportingLineDto {
  @IsMongoId()
  @IsNotEmpty()
  reportsToPositionId: string;
}
