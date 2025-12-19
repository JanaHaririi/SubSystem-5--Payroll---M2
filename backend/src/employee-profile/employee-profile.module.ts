import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EmployeeProfileController } from './employee-profile.controller';
import { EmployeeProfileService } from './employee-profile.service';
import { EmployeeRoleService } from './services/employee-role.service';
import { EmployeeCrudService } from './services/employee-crud.service';
import { EmployeeSelfServiceService } from './services/employee-self-service.service';
import { ChangeRequestService } from './services/change-request.service';
import { FileUploadService } from './services/file-upload.service';
import { HrAdminService } from './services/hr-admin.service';
import { CandidateRegistrationService } from './services/candidate-registration.service';
import { Candidate, CandidateSchema } from './models/candidate.schema';
import {
  EmployeeProfile,
  EmployeeProfileSchema,
} from './models/employee-profile.schema';
import {
  EmployeeSystemRole,
  EmployeeSystemRoleSchema,
} from './models/employee-system-role.schema';
import {
  EmployeeProfileChangeRequest,
  EmployeeProfileChangeRequestSchema,
} from './models/ep-change-request.schema';
import {
  EmployeeQualification,
  EmployeeQualificationSchema,
} from './models/qualification.schema';
import { PerformanceModule } from '../performance/performance.module';
import { TimeManagementModule } from '../time-management/time-management.module';
import { OrganizationStructureModule } from '../organization-structure/organization-structure.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Candidate.name, schema: CandidateSchema },
      { name: EmployeeProfile.name, schema: EmployeeProfileSchema },
      { name: EmployeeSystemRole.name, schema: EmployeeSystemRoleSchema },
      {
        name: EmployeeProfileChangeRequest.name,
        schema: EmployeeProfileChangeRequestSchema,
      },
      { name: EmployeeQualification.name, schema: EmployeeQualificationSchema },
    ]),
    forwardRef(() => PerformanceModule),
    forwardRef(() => OrganizationStructureModule),
    forwardRef(() => TimeManagementModule),
  ],

  controllers: [EmployeeProfileController],
  providers: [
    EmployeeProfileService,
    EmployeeRoleService,
    EmployeeCrudService,
    EmployeeSelfServiceService,
    ChangeRequestService,
    FileUploadService,
    HrAdminService,
    CandidateRegistrationService,
  ],
  exports: [    
    EmployeeProfileService,
    EmployeeRoleService,
    EmployeeCrudService,
    EmployeeSelfServiceService,
    ChangeRequestService,
    FileUploadService,
    HrAdminService,
    CandidateRegistrationService,
  ],
})
export class EmployeeProfileModule {}
