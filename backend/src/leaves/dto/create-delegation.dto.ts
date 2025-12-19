import { IsNotEmpty, IsString, IsDateString } from 'class-validator';

export class CreateDelegationDto {
  @IsString()
  @IsNotEmpty()
  delegateManagerId: string; // <-- match what your service expects

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}
