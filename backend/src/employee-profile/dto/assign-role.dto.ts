import { IsArray, IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SystemRole } from '../enums/employee-profile.enums';

export class AssignRoleDto {
  @ApiProperty({
    description: 'Array of system roles to assign to the employee',
    enum: SystemRole,
    isArray: true,
    example: ['HR Manager', 'System Admin'],
  })
  @IsArray()
  @IsEnum(SystemRole, { each: true })
  roles: SystemRole[];

  @ApiProperty({
    description: 'Array of permission strings',
    example: ['read:employees', 'write:employees', 'delete:employees'],
    required: false,
  })
  @IsArray()
  @IsOptional()
  permissions?: string[];

  @ApiProperty({
    description: 'Whether the role assignment is active',
    example: true,
    required: false,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
