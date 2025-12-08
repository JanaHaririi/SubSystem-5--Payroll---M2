import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class UpdateDisputeStatusDto {
  @IsNotEmpty()
  @IsString()
  status: string;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsString()
  @IsOptional()
  resolutionComment?:string
}
