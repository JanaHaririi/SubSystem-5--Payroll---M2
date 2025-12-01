import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEmail } from 'class-validator';

export class AddressDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  streetAddress?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  country?: string;
}

export class UpdateContactInfoDto {
  @ApiProperty({ required: false, example: '+201234567890' })
  @IsOptional()
  @IsString()
  mobilePhone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  homePhone?: string;

  @ApiProperty({ required: false, example: 'john.doe@example.com' })
  @IsOptional()
  @IsEmail()
  personalEmail?: string;

  @ApiProperty({ required: false, type: AddressDto })
  @IsOptional()
  address?: AddressDto;
}
