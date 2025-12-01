import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsObject } from 'class-validator';

export class CreateChangeRequestDto {
  @ApiProperty({
    description: 'Description of the requested change',
    example: 'Request to update job title from Junior Developer to Senior Developer',
  })
  @IsNotEmpty()
  @IsString()
  requestDescription: string;

  @ApiProperty({
    description: 'Reason for the change request',
    example: 'Promotion effective from January 2025',
    required: false,
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({
    description: 'Requested changes as key-value pairs',
    example: { jobTitle: 'Senior Developer', department: 'Engineering' },
    required: false,
  })
  @IsOptional()
  @IsObject()
  requestedChanges?: Record<string, any>;
}
