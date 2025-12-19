import { IsNotEmpty, IsString } from 'class-validator';

export class CreateRefundDto {
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @IsNotEmpty()
  refundDetails: any; // or a more specific type if you have one
}
