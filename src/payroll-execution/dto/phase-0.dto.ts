import { IsString, IsNumber, IsOptional } from 'class-validator';

// export class RejectDto {
//   @IsString()
//   reason?: string;
// }

export class EditSigningBonusDto {
  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class EditExitBenefitsDto {
  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
