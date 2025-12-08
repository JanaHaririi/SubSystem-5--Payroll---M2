import { IsString, IsNumber } from 'class-validator';

export class ValidateExceptionDto {
  @IsString()
  exceptionId: string;

  @IsNumber()
  maxDuration: number;
}
