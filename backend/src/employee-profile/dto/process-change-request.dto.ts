import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString, IsOptional } from 'class-validator';

export class ProcessChangeRequestDto {
  @ApiProperty({
    example: true,
    description: 'Whether to approve or reject the change request',
  })
  @IsBoolean()
  approved: boolean;

  @ApiProperty({
    required: false,
    description: 'Comments from the reviewer',
  })
  @IsOptional()
  @IsString()
  comments?: string;
}
