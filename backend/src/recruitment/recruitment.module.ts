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

import { RecruitmentController } from 'src/recruitment/controllers/recruitment.controller';
import { OnboardingController } from 'src/recruitment/controllers/onboarding.controller';
import { OffboardingController } from 'src/recruitment/controllers/offboarding.controller';

import { RecruitmentService } from 'src/recruitment/services/recruitment.service';
import { OnboardingService } from 'src/recruitment/services/onboarding.service';
import { OffboardingService } from 'src/recruitment/services/offboarding.service';
import { AuthModule } from 'src/auth/auth.module';

//external modules
import { PerformanceModule } from 'src/performance/performance.module'; 
import { PayrollExecutionModule } from 'src/payroll-execution/payroll-execution.module';
import { PayrollConfigurationModule } from 'src/payroll-configuration/payroll-configuration.module';
import { EmployeeProfileModule } from '../employee-profile/employee-profile.module';
import { TimeManagementModule } from 'src/time-management/time-management.module';

// Import payroll schemas
// import { employeeSigningBonus, employeeSigningBonusSchema } from '../payroll-execution/models/EmployeeSigningBonus.schema';
// import { employeePayrollDetails, employeePayrollDetailsSchema } from '../payroll-execution/models/employeePayrollDetails.schema';
// import { payrollRuns, payrollRunsSchema } from '../payroll-execution/models/payrollRuns.schema';
// import { signingBonus, signingBonusSchema } from '../payroll-configuration/models/signingBonus.schema';

@Module({
  imports:[
    MongooseModule.forFeature([
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
      
      // Payroll schemas for OnboardingService
      // { name: employeeSigningBonus.name, schema: employeeSigningBonusSchema },
      // { name: employeePayrollDetails.name, schema: employeePayrollDetailsSchema },
      // { name: payrollRuns.name, schema: payrollRunsSchema },
      // { name: signingBonus.name, schema: signingBonusSchema },
    ]), 
    EmployeeProfileModule,
    TimeManagementModule, 
    AuthModule,
    PerformanceModule, 
    PayrollExecutionModule,
    PayrollConfigurationModule
  ],

  controllers: [
    RecruitmentController,
    OnboardingController,
    OffboardingController,
  ],

  providers: [
    RecruitmentService,
    OnboardingService,
    OffboardingService,
  ],

  exports: [
    RecruitmentService,
    OnboardingService,
    OffboardingService,
  ]
})
export class RecruitmentModule {}