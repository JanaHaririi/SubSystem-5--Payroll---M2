import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({ required: false, description: 'Short biography' })
  @IsOptional()
  @IsString()
  biography?: string;

  @ApiProperty({ required: false, description: 'Profile picture URL' })
  @IsOptional()
  @IsUrl()
  profilePictureUrl?: string;
}
