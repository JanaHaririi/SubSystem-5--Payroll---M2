import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { RecruitmentService } from '../services/recruitment.service';
import { CreateJobOfferDto } from '../dto/create-job-offer.dto';
import { UpdateJobOfferDto } from '../dto/update-job-offer.dto';
import { CreateReferralDto } from '../dto/create-referral.dto';
import { CreateInterviewDto } from '../dto/create-interview.dto';
import { UpdateInterviewDto } from '../dto/update-interview.dto';
import { CreateFeedbackDto } from '../dto/create-feedback.dto';
import { UpdateFeedbackDto } from '../dto/update-feedback.dto';
import { CreateApplicationDto } from '../dto/create-application.dto';
import { CreateJobTemplateDto } from '../dto/create-job-template.dto';
import { UpdateJobTemplateDto } from '../dto/update-job-template.dtos';
import { CreateJobRequisitionDto } from '../dto/create-job-requisition.dto';
import { UpdateJobRequisitionDto } from '../dto/update-job-requisition.dto';
import { UpdateApplicationDto } from '../dto/update-application.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { SystemRole } from 'src/employee-profile/enums/employee-profile.enums';
import { Public } from 'src/payroll-tracking/decorators/public.decorator';


@Controller('recruitment')
@UseGuards(AuthGuard, RolesGuard)
export class RecruitmentController {
  constructor(private readonly recruitmentService: RecruitmentService) {}

  //template routes 
  
  @Post('templates')
  @Roles(SystemRole.HR_MANAGER)
  createJobTemplate(@Body() createJobTemplateDto: CreateJobTemplateDto) {
    return this.recruitmentService.createJobTemplate(createJobTemplateDto);
  }

  @Get('templates')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE)
  getAllJobTemplates() {
    return this.recruitmentService.getAllJobTemplates();
  }

  @Get('templates/:id')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE)
  getJobTemplate(@Param('id') id: string) {
    return this.recruitmentService.getJobTemplate(id);
  }

  @Patch('templates/:id')
  @Roles(SystemRole.HR_MANAGER)
  updateJobTemplate(@Param('id') templateId: string, @Body() dto: UpdateJobTemplateDto) {
    return this.recruitmentService.updateJobTemplate(templateId, dto);
  }

  @Delete('templates/:id')
  @Roles(SystemRole.HR_MANAGER)
  deleteJobTemplate(@Param('id') id: string) {
    return this.recruitmentService.deleteJobTemplate(id);
  }

  // requisition routes

  @Post('requisitions/:templateId')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE)
  createJobRequisition(@Param('templateId') templateId: string, @Body() createJobRequisitionDto: CreateJobRequisitionDto) {
    return this.recruitmentService.createJobRequisition(createJobRequisitionDto, templateId);
  }

  @Get('requisitions')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE , SystemRole.JOB_CANDIDATE, SystemRole.DEPARTMENT_EMPLOYEE)
  getAllJobRequisitions() {
    return this.recruitmentService.getAllJobRequisitions();
  }

  @Get('requisitions/:id')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE)
  getJobRequisition(@Param('id') id: string) {
    return this.recruitmentService.getJobRequisition(id);
  }

  @Patch('requisitions/:id')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE)
  updateJobRequisition(@Param('id') id: string, @Body() dto: UpdateJobRequisitionDto) {
    return this.recruitmentService.updateJobRequisition(id, dto);
  }

  @Delete('requisitions/:id')
  @Roles(SystemRole.HR_MANAGER)
  deleteJobRequisition(@Param('id') id: string) {
    return this.recruitmentService.deleteJobRequisition(id);
  }

  //offer routes

  @Post('offers')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE)
  createOffer(@Body() createJobOfferDto: CreateJobOfferDto) {
    return this.recruitmentService.createOffer(createJobOfferDto);
  }

  @Get('offers')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE )
  getAllOffers() {
    return this.recruitmentService.getAllOffers();
  }

  @Get('offers/:id')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE)
  getOffer(@Param('id') id: string) {
    return this.recruitmentService.getOffer(id);
  }

  // Get offers by candidate ID
  @Get('offers/candidate/:candidateId')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE, SystemRole.JOB_CANDIDATE)
  getOffersByCandidate(@Param('candidateId') candidateId: string) {
    return this.recruitmentService.getOffersByCandidate(candidateId);
  }


  @Patch('offers/:id')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE , SystemRole.JOB_CANDIDATE)
  updateOffer(@Param('id') id: string, @Body() updateJobOfferDto: UpdateJobOfferDto) {
    return this.recruitmentService.updateOffer(id, updateJobOfferDto);
  }

  //referral

  @Post('referrals')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE)
  createReferral(@Body() createReferralDto: CreateReferralDto) {
    return this.recruitmentService.createReferral(createReferralDto);
  }

  @Get('referrals/:id')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE)
  getReferral(@Param('id') id: string) {
    return this.recruitmentService.getReferral(id);
  }

  //interview

  @Post('interviews')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE)
  createInterview(@Body() createInterviewDto: CreateInterviewDto) {
    return this.recruitmentService.createInterview(createInterviewDto);
  }

   @Get('interviews/panel-member/:userId')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE)
  getInterviewsByPanelMember(@Param('userId') userId: string) {
    return this.recruitmentService.getInterviewsByPanelMember(userId);
  }
  @Get('interviews/applications/:applicationId')
  @Roles(SystemRole.JOB_CANDIDATE )
  getInterviewByApplicationId( @Param('applicationId') applicationId: string){
  return this.recruitmentService.getInterviewByApplicationId(applicationId);
  }
   @Get('interviews/:id')
  @Roles(SystemRole.HR_MANAGER , SystemRole.HR_EMPLOYEE)
  getInterview(@Param('id') id: string) {
    return this.recruitmentService.getInterview(id);
  }

  @Get('interviews')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE)
  getAllInterviews() {
    return this.recruitmentService.getAllInterviews();
  }

  @Patch('interviews/:id')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE)
  updateInterview(@Param('id') id: string, @Body() updateInterviewDto: UpdateInterviewDto) {
    return this.recruitmentService.updateInterview(id, updateInterviewDto);
  }

  //feedback

  @Post('feedback')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE)
  createFeedback(@Body() createFeedbackDto: CreateFeedbackDto) {
    return this.recruitmentService.createFeedback(createFeedbackDto);
  }

  @Get('feedback')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE)
  getAllFeedback() {
    return this.recruitmentService.getAllFeedback();
  }

  @Get('feedback/by-interview/:interviewId') 
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE)
  getFeedbackByInterview(@Param('interviewId') interviewId: string) {
    return this.recruitmentService.getFeedbackByInterview(interviewId);
  }

  @Get('feedback/:id')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE)
  getFeedback(@Param('id') id: string) {
    return this.recruitmentService.getFeedback(id);
  }

  @Patch('feedback/:id')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE)
  updateFeedback(@Param('id') id: string, @Body() updateFeedbackDto: UpdateFeedbackDto) {
    return this.recruitmentService.updateFeedback(id, updateFeedbackDto);
  }

  // application history routes

 @Get('applications/:id/history')
@Roles(SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE)
async getApplicationHistory(@Param('id') id: string) {  // Add 'async' here
  console.log('Getting history for application:', id);
  const result = await this.recruitmentService.getApplicationHistory(id);  // Add 'await' here
  console.log('History result:', result);
  return result;
}

  //application routes

  @Post('applications')
  @Roles(SystemRole.JOB_CANDIDATE)
  //@Roles(SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE, SystemRole.DEPARTMENT_EMPLOYEE)
  createApplication(@Body() createApplicationDto: CreateApplicationDto) {
    return this.recruitmentService.createApplication(createApplicationDto);
  }

  @Get('applications')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE )
  getAllApplications() {
    return this.recruitmentService.getAllApplications();
  }

  @Get('applications/:id')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE)
  getApplication(@Param('id') id: string) {
    return this.recruitmentService.getApplication(id);
  }

    // Get applications by candidate ID
  @Get('applications/candidate/:candidateId')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE, SystemRole.JOB_CANDIDATE)
  getApplicationsByCandidate(@Param('candidateId') candidateId: string) {
    return this.recruitmentService.getApplicationsByCandidate(candidateId);
  }

  @Patch('applications/:id')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE)
  updateApplication(@Param('id') id:string , @Body() updateApplicationDto: UpdateApplicationDto ){
    return this.recruitmentService.updateApplication(id ,updateApplicationDto )
  }

  //notification routes

  // @Post('notifications')
  // createNotification(@Body() createNotificationDto: CreateNotificationDto) {
  //   return this.recruitmentService.createNotification(createNotificationDto);
  // }

  // @Get('notifications')
  // getAllNotifications() {
  //   return this.recruitmentService.getAllNotifications();
  // }

  // @Get('notifications/:id')
  // getNotificationById(@Param('id') id: string) {
  //   return this.recruitmentService.getNotificationById(id);
  // }
}