import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateClaimDto {
  @IsNotEmpty()
  @IsString()
  status: string;  

    @IsOptional()
    @IsString()
    remarks?: string;
}