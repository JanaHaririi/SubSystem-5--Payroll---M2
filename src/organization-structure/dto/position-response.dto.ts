import { ApiProperty } from '@nestjs/swagger';

export class PositionResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty()
  departmentId: any;

  @ApiProperty({ required: false })
  reportsToPositionId?: any;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
