import { IsNotEmpty, IsNumber, IsString, IsUrl } from 'class-validator';

export class CreateTaxDocumentDto {
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @IsNumber()
  year: number;

  @IsUrl()
  downloadUrl: string;
}

