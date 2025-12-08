import { IsString } from 'class-validator';

export class PublishAppraisalRecordDto {
  @IsString()
  publishedByEmployeeId: string;
}