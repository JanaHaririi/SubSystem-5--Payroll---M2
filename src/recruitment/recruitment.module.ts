import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JobTemplate, JobTemplateSchema } from './models/job-template.schema';
import { JobRequisition,JobRequisitionSchema } from './models/job-requisition.schema';
import { Application,ApplicationSchema } from './models/application.schema';
import { ApplicationStatusHistory,ApplicationStatusHistorySchema } from './models/application-history.schema';
import { Interview,InterviewSchema } from './models/interview.schema';
import { AssessmentResult,AssessmentResultSchema } from './models/assessment-result.schema';
import { Referral,ReferralSchema } from './models/referral.schema';
import { Offer,OfferSchema } from './models/offer.schema';
import { Contract,ContractSchema } from './models/contract.schema';
import { Document,DocumentSchema } from './models/document.schema';
import { TerminationRequest,TerminationRequestSchema } from './models/termination-request.schema';
import { ClearanceChecklist,ClearanceChecklistSchema } from './models/clearance-checklist.schema';
import { Onboarding, OnboardingSchema } from './models/onboarding.schema';

//TO KEEP
import { EmployeeProfileModule } from '../employee-profile/employee-profile.module';
// import time managemnt module and remove time management schema
import { TimeManagementModule } from 'src/time-management/time-management.module';

import { RecruitmentController } from 'src/recruitment/controllers/recruitment.controller';
import { OnboardingController } from 'src/recruitment/controllers/onboarding.controller';
import { OffboardingController } from 'src/recruitment/controllers/offboarding.controller';

import { RecruitmentService } from 'src/recruitment/services/recruitment.service';
import { OnboardingService } from 'src/recruitment/services/onboarding.service';
import { OffboardingService } from 'src/recruitment/services/offboarding.service';

//TO REMOVE
// import { NotificationLogService } from 'src/external-controller-services/services/notification-log.service'; 
// import { EmployeeCrudService } from 'src/external-controller-services/services/employee-crud.service';
// import { EmployeeRoleService } from 'src/external-controller-services/services/employee-role.service';
// import { HrAdminService } from 'src/external-controller-services/services/hr-admin.service';; 

// import { NotificationLog, NotificationLogSchema } from 'src/external-controller-services/models/notification-log.schema';
// import { Candidate,CandidateSchema } from './external-controller-services/models/candidate.schema';
// import { Department,DepartmentSchema } from './external-controller-services/models/department.schema';
// import { EmployeeProfile , EmployeeProfileSchema } from './external-controller-services/models/employee-profile.schema';
// import { EmployeeSystemRole, EmployeeSystemRoleSchema } from './external-controller-services/models/employee-system-role.schema';
// import { EmployeeProfileChangeRequest,EmployeeProfileChangeRequestSchema } from './external-controller-services/models/ep-change-request.schema';
//import { TimeManagementController } from './controllers/time-management.controller';

@Module({
  imports:[MongooseModule.forFeature([
      { name: Onboarding.name, schema: OnboardingSchema },
      { name: JobTemplate.name, schema: JobTemplateSchema },
      { name: JobRequisition.name, schema: JobRequisitionSchema },
      { name: Application.name, schema: ApplicationSchema },
      { name: ApplicationStatusHistory.name, schema: ApplicationStatusHistorySchema },
      { name: Interview.name, schema: InterviewSchema },
      { name: AssessmentResult.name, schema: AssessmentResultSchema },
      { name: Referral.name, schema: ReferralSchema },
      { name: Offer.name, schema: OfferSchema },
      { name: Contract.name, schema: ContractSchema },
      { name: Document.name, schema: DocumentSchema },
      { name: TerminationRequest.name, schema: TerminationRequestSchema },
      { name: ClearanceChecklist.name, schema: ClearanceChecklistSchema },
      //TO REMOVE
      // { name: NotificationLog.name, schema: NotificationLogSchema },
      // { name: Candidate.name, schema: CandidateSchema },
      // { name: Department.name, schema: DepartmentSchema },
      // { name: EmployeeProfile.name, schema: EmployeeProfileSchema },
      // { name: EmployeeSystemRole.name, schema: EmployeeSystemRoleSchema },
      // { name: EmployeeProfileChangeRequest.name, schema: EmployeeProfileChangeRequestSchema },
    ]), EmployeeProfileModule ,TimeManagementModule
  ],

  controllers: [
  //TimeManagementController,
    RecruitmentController,
    OnboardingController,
    OffboardingController,
  ],

  providers: [
    RecruitmentService,
    OnboardingService,
    OffboardingService,
    //TO REMOVE
    // NotificationLogService,
    // EmployeeCrudService,
    // EmployeeRoleService,  // Add here
    // HrAdminService,       // Add here
    // EmployeeCrudService,
    // NotificationLogService,
 
  ],

  exports: [
    RecruitmentService,
    OnboardingService,
    OffboardingService,
    // EmployeeRoleService,
    // HrAdminService,
    // NotificationLogService,

  ]

})
export class RecruitmentModule {}
