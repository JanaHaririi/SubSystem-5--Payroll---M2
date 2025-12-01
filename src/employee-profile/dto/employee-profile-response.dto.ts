import { ApiProperty } from '@nestjs/swagger';

export class EmployeeProfileResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  employeeNumber: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  middleName?: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  fullName?: string;

  @ApiProperty()
  nationalId: string;

  @ApiProperty()
  gender?: string;

  @ApiProperty()
  maritalStatus?: string;

  @ApiProperty()
  dateOfBirth?: Date;

  @ApiProperty()
  personalEmail?: string;

  @ApiProperty()
  workEmail?: string;

  @ApiProperty()
  mobilePhone?: string;

  @ApiProperty()
  homePhone?: string;

  @ApiProperty()
  address?: {
    city?: string;
    streetAddress?: string;
    country?: string;
  };

  @ApiProperty()
  profilePictureUrl?: string;

  @ApiProperty()
  biography?: string;

  @ApiProperty()
  dateOfHire: Date;

  @ApiProperty()
  status: string;

  @ApiProperty()
  statusEffectiveFrom?: Date;

  @ApiProperty()
  contractType?: string;

  @ApiProperty()
  workType?: string;

  @ApiProperty()
  contractStartDate?: Date;

  @ApiProperty()
  contractEndDate?: Date;

  @ApiProperty()
  primaryPositionId?: string;

  @ApiProperty()
  primaryDepartmentId?: string;

  @ApiProperty()
  supervisorPositionId?: string;

  @ApiProperty()
  payGradeId?: string;

  @ApiProperty({ description: 'Appraisal history from Performance Module' })
  appraisalHistory?: {
    lastAppraisalDate?: Date;
    lastAppraisalScore?: number;
    lastAppraisalRatingLabel?: string;
  };

  @ApiProperty()
  createdAt?: Date;

  @ApiProperty()
  updatedAt?: Date;
}

export class TeamMemberSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  employeeNumber: string;

  @ApiProperty()
  fullName: string;

  @ApiProperty()
  dateOfHire: Date;

  @ApiProperty()
  status: string;

  @ApiProperty()
  primaryPositionId?: string;

  @ApiProperty()
  primaryDepartmentId?: string;

  @ApiProperty()
  profilePictureUrl?: string;
}
