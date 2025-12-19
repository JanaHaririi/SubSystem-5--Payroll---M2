import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class createTaxRulesDTO {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  rate: number;
}

