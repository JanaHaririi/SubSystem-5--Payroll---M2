import { IsOptional, IsString } from 'class-validator';

export class UpdatePaycodeMappingDto {
  @IsOptional()
  @IsString()
  payrollCode?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
