import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateJobOfferDto } from '../dto/create-job-offer.dto';
import { UpdateJobOfferDto } from '../dto/update-job-offer.dto';
import { Offer, OfferDocument } from '../models/offer.schema';
import { CreateReferralDto } from '../dto/create-referral.dto';
import { Referral, ReferralDocument } from '../models/referral.schema';
import { CreateInterviewDto } from '../dto/create-interview.dto';
import { UpdateInterviewDto } from '../dto/update-interview.dto';
import { Interview, InterviewDocument } from '../models/interview.schema';
import { CreateFeedbackDto } from '../dto/create-feedback.dto';
import { AssessmentResult, AssessmentResultDocument } from '../models/assessment-result.schema';
import { UpdateFeedbackDto } from '../dto/update-feedback.dto';
import { CreateApplicationDto } from '../dto/create-application.dto';
import { UpdateApplicationDto } from '../dto/update-application.dto';
import { Application, ApplicationDocument } from '../models/application.schema';
import { JobTemplate, JobTemplateDocument } from '../models/job-template.schema';
import { JobRequisition, JobRequisitionDocument } from '../models/job-requisition.schema';
import { CreateJobTemplateDto } from '../dto/create-job-template.dto';
import { CreateJobRequisitionDto } from '../dto/create-job-requisition.dto';
import { Onboarding, OnboardingDocument } from '../models/onboarding.schema';
import { ApplicationStatus } from '../enums/application-status.enum';
import { Contract, ContractDocument } from '../models/contract.schema';
import { NotificationLogService } from 'src/time-management/services/notification-log.service';
import { ApplicationStage } from '../enums/application-stage.enum';
import { ApplicationStatusHistory, ApplicationStatusHistoryDocument } from '../models/application-history.schema';
import { OnboardingService } from './onboarding.service';
import { OfferResponseStatus } from '../enums/offer-response-status.enum';
import { OnboardingTaskStatus } from '../enums/onboarding-task-status.enum';


@Injectable()
export class RecruitmentService {
  constructor(
    @InjectModel(Offer.name)
    private readonly offerModel: Model<OfferDocument>,

    @InjectModel(Referral.name)
    private readonly referralModel: Model<ReferralDocument>,

    @InjectModel(Interview.name)
    private readonly interviewModel: Model<InterviewDocument>,

    @InjectModel(AssessmentResult.name)
    private readonly assessmentResultModel: Model<AssessmentResultDocument>,

    @InjectModel(Application.name)
    private readonly applicationModel: Model<ApplicationDocument>,

    @InjectModel(JobTemplate.name)
    private readonly jobTemplateModel: Model<JobTemplateDocument>,

    @InjectModel(JobRequisition.name)
    private readonly jobRequisitionModel: Model<JobRequisitionDocument>,

    @InjectModel(Onboarding.name)
    private readonly onboardingModel: Model<OnboardingDocument>,

    @InjectModel(Contract.name)
    private readonly contractModel: Model<ContractDocument>,

    @InjectModel(ApplicationStatusHistory.name)
    private readonly applicationHistoryModel: Model<ApplicationStatusHistoryDocument>,

    // Only inject NotificationService, NOT the Notification model
    private readonly notificationLogService: NotificationLogService,
    private readonly onboardingService: OnboardingService,
  ) {}

  // offer services

  async createOffer(jobOfferData: CreateJobOfferDto): Promise<OfferDocument> {
  const newOffer = new this.offerModel(jobOfferData);
  const savedOffer = await newOffer.save();

  await this.notificationLogService.sendNotification({
    to: savedOffer.candidateId,
    type: 'Job Offer',
    message: 'Congratulations! Please review your job offer.',
  });

  return savedOffer;
}

  async getAllOffers(): Promise<OfferDocument[]> {
  return this.offerModel
    .find()
    /*.populate('candidateId') */
    .populate('applicationId')
    .exec();
}

async getOffer(id: string): Promise<OfferDocument> {
  const offer = await this.offerModel
    .findById(id)
      /*.populate('candidateId') */
      /*.populate('applicationId') */
    .exec();
    
  if (!offer) throw new NotFoundException('offer not found');
  return offer;
}

 async updateOffer(id: string, jobOfferData: UpdateJobOfferDto): Promise<OfferDocument> {
  const currentOffer = await this.offerModel.findById(id);
  if (!currentOffer) throw new NotFoundException('offer not found');

  const updatedOffer = await this.offerModel.findByIdAndUpdate(id, jobOfferData, { new: true });
  if (!updatedOffer) throw new NotFoundException('offer not found');

  // Trigger pre-boarding when offer is accepted
  if (
    currentOffer.applicantResponse !== OfferResponseStatus.ACCEPTED &&  updatedOffer.applicantResponse === OfferResponseStatus.ACCEPTED) {
    const startDate = updatedOffer.deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    
    // Create onboarding record with all pre-boarding tasks
    await this.onboardingService.createOnboardingTask({
      employeeId: updatedOffer.candidateId.toString(),
      tasks: [
        {
          name: 'Contract Signing',
          department: 'HR',
          status: OnboardingTaskStatus.PENDING,
          deadline: new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000),
          notes: 'Review and sign employment contract before start date',
        },
        {
          name: 'Complete Personal Forms',
          department: 'HR',
          status: OnboardingTaskStatus.PENDING,
          deadline: new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000),
          notes: 'Fill out tax forms, emergency contact, and bank details',
        },
        {
          name: 'Submit Required Documents',
          department: 'HR',
          status: OnboardingTaskStatus.PENDING,
          deadline: new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000),
          notes: 'Upload ID, certificates, and other required documents',
        },
      ],
      completed: false,
    });

    // Send notification
    await this.notificationLogService.sendNotification({
      to: updatedOffer.candidateId,
      type: 'Pre-Boarding Tasks',
      message: 'Welcome! Please complete your pre-boarding tasks before your start date: contract signing, personal forms, and document submission.',
    });
  }

  return updatedOffer;
}

  //referral services

  async createReferral(referralData: CreateReferralDto): Promise<ReferralDocument> {
    const newReferral = new this.referralModel(referralData);
    return newReferral.save();
  }

  async getReferral(id: string): Promise<ReferralDocument> {
    const referral = await this.referralModel.findById(id).exec();
    if (!referral) throw new NotFoundException('referral not found');
    return referral;
  }

  //interview services

  async createInterview(interviewData: CreateInterviewDto): Promise<InterviewDocument> {
  const newInterview = new this.interviewModel(interviewData);

  const application = await this.applicationModel.findById(newInterview.applicationId).exec();
  if (!application) throw new NotFoundException('Application not found');

  const savedInterview = await newInterview.save();

  // Notify candidate
  await this.notificationLogService.sendNotification({
    to: application.candidateId,
    type: 'Interview Scheduled',
    message: `Your interview has been scheduled.\nDate: ${savedInterview.scheduledDate}\nMethod: ${savedInterview.method}\n${savedInterview.videoLink ? `Link: ${savedInterview.videoLink}` : ''}`,
  });

  // NEW: Notify each panel member (interviewers/recruiters)
  if (savedInterview.panel && savedInterview.panel.length > 0) {
    for (const panelMemberId of savedInterview.panel) {
      await this.notificationLogService.sendNotification({
        to: panelMemberId,
        type: 'Interview Panel Assignment',
        message: `You have been assigned to an interview panel.\nDate: ${savedInterview.scheduledDate}\nStage: ${savedInterview.stage}\nMethod: ${savedInterview.method}\n${savedInterview.videoLink ? `Link: ${savedInterview.videoLink}` : ''}`,
      });
    }
  }

  return savedInterview;
}

  async getAllInterviews(): Promise<InterviewDocument[]> {
    return this.interviewModel.find().exec();
  }

  async getInterview(id: string): Promise<InterviewDocument> {
    const interview = await this.interviewModel.findById(id).exec();
    if (!interview) throw new NotFoundException('interview not found');
    return interview;
  }

  async updateInterview(id: string, interviewData: UpdateInterviewDto): Promise<InterviewDocument> {
    const updatedInterview = await this.interviewModel.findByIdAndUpdate(id, interviewData, { new: true });
    if (!updatedInterview) throw new NotFoundException('interview not found');
    return updatedInterview;
  }

  //allow HR to see all interviews a panel member is assigned to to avoid schedule conflicts
  async getInterviewsByPanelMember(userId: string): Promise<InterviewDocument[]> {
  return this.interviewModel
    .find({ panel: userId })
    .populate('applicationId')
    .sort({ scheduledDate: 1 })
    .exec();
}

  //feedback services

  async createFeedback(feedbackData: CreateFeedbackDto): Promise<AssessmentResultDocument> {
    const newFeedback = new this.assessmentResultModel(feedbackData);

    const savedFeedback = await newFeedback.save();

    //autlink feedback to interview
    await this.interviewModel.findByIdAndUpdate(
    feedbackData.interviewId,
    { feedbackId: savedFeedback._id }
    );

    return newFeedback.save();
  }

  async getAllFeedback(): Promise<AssessmentResultDocument[]> {
    return this.assessmentResultModel.find().exec();
  }

  async getFeedback(id: string): Promise<AssessmentResultDocument> {
    const feedback = await this.assessmentResultModel.findById(id).exec();
    if (!feedback) throw new NotFoundException('feedback not found');
    return feedback;
  }

  //multiple panel members can create feedback during an interview - could be useful for HR to view all feedback
//   async getFeedbackByInterview(interviewId: string): Promise<AssessmentResultDocument[]> {
//   return this.assessmentResultModel
//     .find({ interviewId })
//     .populate('interviewerId')
//     .exec();
// }


  async updateFeedback(id: string, feedbackData: UpdateFeedbackDto): Promise<AssessmentResultDocument> {
    const updatedFeedback = await this.assessmentResultModel.findByIdAndUpdate(id, feedbackData, { new: true });
    if (!updatedFeedback) throw new NotFoundException('feedback not found');
    return updatedFeedback;
  }


  //application services


  async createApplication(applicationData: CreateApplicationDto): Promise<ApplicationDocument> {
    const newApplication = new this.applicationModel(applicationData);

    // Use notificationLogService
    await this.notificationLogService.sendNotification({
      to: newApplication.candidateId,
      type: 'Application Submitted',
      message: 'Your application has been successfully submitted.',
    });

    return newApplication.save();
  }

 async getAllApplications(): Promise<ApplicationDocument[]> {
  return this.applicationModel
    .find()
    /*.populate('candidateId') */
    .populate('requisitionId')
    .exec();
}

async getApplication(id: string): Promise<ApplicationDocument> {
  const application = await this.applicationModel
    .findById(id)
   /* .populate('candidateId') */
    .populate('requisitionId')
    .exec();
    
  if (!application) throw new NotFoundException('application not found');
  return application;
}

  async updateApplication(id: string, applicationData: UpdateApplicationDto): Promise<ApplicationDocument> {
    const currentApplication = await this.applicationModel.findById(id);
    if (!currentApplication) throw new NotFoundException('Application not found');

    const updatedApplication = await this.applicationModel.findByIdAndUpdate(id, applicationData, { new: true });
    if (!updatedApplication) throw new NotFoundException('Application not found');

    // Track history when stage or status changes
    if (currentApplication.currentStage !== updatedApplication.currentStage || currentApplication.status !== updatedApplication.status) {
      const changedBy = updatedApplication.assignedHr;
      await this.createApplicationHistory({
        applicationId: updatedApplication._id,
        oldStage: currentApplication.currentStage,
        newStage: updatedApplication.currentStage,
        oldStatus: currentApplication.status,
        newStatus: updatedApplication.status,
        changedBy: changedBy,
      });
    }

    //  Notify on HR Assignment
    if (!currentApplication.assignedHr && updatedApplication.assignedHr) {
      await this.notificationLogService.sendNotification({
        to: updatedApplication.candidateId,
        type: 'Application In Process',
        message: 'Your application is now being reviewed by our HR team.',
      });
    }

    //  Notify on stage changes
    if (currentApplication.currentStage !== updatedApplication.currentStage) {
      let stageMessage = '';
      
      switch (updatedApplication.currentStage) {
        case ApplicationStage.SCREENING:
          stageMessage = 'Your application is being screened by our recruitment team.';
          break;
        case ApplicationStage.DEPARTMENT_INTERVIEW:
          stageMessage = 'Your application has progressed to the department interview stage.';
          break;
        case ApplicationStage.HR_INTERVIEW:
          stageMessage = 'Your application has progressed to the HR interview stage.';
          break;
        case ApplicationStage.OFFER:
          stageMessage = 'Congratulations! Your application has reached the offer stage.';
          break;
        default:
          stageMessage = `Your application stage has been updated to: ${updatedApplication.currentStage}`;
      }

      await this.notificationLogService.sendNotification({
        to: updatedApplication.candidateId,
        type: 'Application Stage Update',
        message: stageMessage,
      });
    }

    // Notify on status changes
    if (currentApplication.status !== updatedApplication.status) {
      let statusMessage = '';
      
      switch (updatedApplication.status) {
        case ApplicationStatus.SUBMITTED:
          statusMessage = 'Your application has been submitted successfully.';
          break;
        case ApplicationStatus.IN_PROCESS:
          statusMessage = 'Your application is currently being processed.';
          break;
        case ApplicationStatus.OFFER:
          statusMessage = 'Congratulations! You have received a job offer. HR will contact you with details soon.';
          break;
        case ApplicationStatus.HIRED:
          statusMessage = 'Congratulations! You have been hired. Welcome to the team!';
          break;
        case ApplicationStatus.REJECTED:
          statusMessage = 'Thank you for your interest. Unfortunately, we have decided to move forward with other candidates.';
          break;
        default:
          statusMessage = `Your application status has been updated to: ${updatedApplication.status}`;
      }

      await this.notificationLogService.sendNotification({
        to: updatedApplication.candidateId,
        type: 'Application Status Update',
        message: statusMessage,
      });
    }

    return updatedApplication;
  }

 
  //application history service

  private async createApplicationHistory(historyData: any): Promise<ApplicationStatusHistoryDocument> {
  const newHistory = new this.applicationHistoryModel(historyData);
  return newHistory.save();
}

async getApplicationHistory(applicationId: string): Promise<ApplicationStatusHistoryDocument[]> {
  return this.applicationHistoryModel.find({ applicationId }).populate('changedBy').sort({ createdAt: -1 }).exec();
}

  //template services

  async createJobTemplate(jobTemplateData: CreateJobTemplateDto): Promise<JobTemplateDocument> {
    const newJobTemplate = new this.jobTemplateModel(jobTemplateData);
    return newJobTemplate.save();
  }

  async getAllJobTemplates(): Promise<JobTemplateDocument[]> {
    return this.jobTemplateModel.find().exec();
  }

  async getJobTemplate(id: string): Promise<JobTemplateDocument> {
    const template = await this.jobTemplateModel.findById(id).exec();
    if (!template) throw new NotFoundException('template not found');
    return template;
  }

  async updateJobTemplate(templateId: string, dto: Partial<CreateJobTemplateDto>): Promise<JobTemplateDocument> {
    const updatedTemplate = await this.jobTemplateModel.findByIdAndUpdate(templateId, dto, {
      new: true,
      runValidators: true,
    });
    if (!updatedTemplate) throw new NotFoundException('template not found');
    return updatedTemplate;
  }

  async deleteJobTemplate(id: string): Promise<JobTemplateDocument> {
    const deletedTemplate = await this.jobTemplateModel.findByIdAndDelete(id).exec();
    if (!deletedTemplate) throw new NotFoundException('template not found');
    return deletedTemplate;
  }

  //requisition services

  async createJobRequisition(requisitionData: CreateJobRequisitionDto, templateId: string): Promise<JobRequisitionDocument> {
    const template = await this.jobTemplateModel.findById(templateId);
    if (!template) throw new NotFoundException('template not found');

    const newRequisition = new this.jobRequisitionModel({
      ...requisitionData,
      templateId,
    });

    return newRequisition.save();
  }

  async getAllJobRequisitions(): Promise<JobRequisitionDocument[]> {
    return this.jobRequisitionModel.find().populate('templateId').exec();
  }

  async getJobRequisition(id: string): Promise<JobRequisitionDocument> {
    const requisition = await this.jobRequisitionModel.findById(id).populate('templateId').exec();
    if (!requisition) throw new NotFoundException('requisition not found');
    return requisition;
  }

  async updateJobRequisition(requisitionId: string, dto: Partial<CreateJobRequisitionDto>): Promise<JobRequisitionDocument> {
    const updatedRequisition = await this.jobRequisitionModel.findByIdAndUpdate(requisitionId, dto, {
      new: true,
      runValidators: true,
    });
    if (!updatedRequisition) throw new NotFoundException('requisition not found');
    return updatedRequisition;
  }

  async deleteJobRequisition(id: string): Promise<JobRequisitionDocument> {
    const deletedRequisition = await this.jobRequisitionModel.findByIdAndDelete(id).exec();
    if (!deletedRequisition) throw new NotFoundException('requisition not found');
    return deletedRequisition;
  }
}


//  async updateApplication(id: string, applicationData: UpdateApplicationDto): Promise<ApplicationDocument> {
//   const currentApplication = await this.applicationModel.findById(id);
//   if (!currentApplication) throw new NotFoundException('Application not found');

//   const updatedApplication = await this.applicationModel.findByIdAndUpdate(id, applicationData, { new: true });
//   if (!updatedApplication) throw new NotFoundException('Application not found');

//   //Track history when stage or status changes
//   if (currentApplication.currentStage !== updatedApplication.currentStage || currentApplication.status !== updatedApplication.status) {
//     const changedBy = updatedApplication.assignedHr
//     await this.createApplicationHistory({
//       applicationId: updatedApplication._id,
//       oldStage: currentApplication.currentStage,
//       newStage: updatedApplication.currentStage,
//       oldStatus: currentApplication.status,
//       newStatus: updatedApplication.status,
//       changedBy: changedBy, // Use HR who made the change
//     });
//   }

//   // Notification 1: HR Assigned
//   if (!currentApplication.assignedHr && updatedApplication.assignedHr) {
//     await this.notificationLogService.sendNotification({
//       to: updatedApplication.candidateId,
//       type: 'Application In Process',
//       message: 'Your application is now being reviewed by our HR team.',
//     });
//   }

//   const hrId = updatedApplication.assignedHr;

//   // Notification 2: Offer Status
//   if (
//     currentApplication.status !== ApplicationStatus.OFFER && 
//     updatedApplication.status === ApplicationStatus.OFFER && 
//     hrId != null
//   ) {
//     await this.notificationLogService.sendNotification({
//       to: updatedApplication.candidateId,
//       type: 'Job Offer',
//       message: 'Congratulations! You have received a job offer. HR will contact you with details soon.',
//     });
//   }

//   // Notification 3: Rejected Status
//   if (currentApplication.status !== ApplicationStatus.REJECTED && updatedApplication.status === ApplicationStatus.REJECTED) {
//     await this.notificationLogService.sendNotification({
//       to: updatedApplication.candidateId,
//       type: 'Application Update',
//       message: 'Thank you for your interest. Unfortunately, we have decided to move forward with other candidates.',
//     });
//   }

//   return updatedApplication;
// }
