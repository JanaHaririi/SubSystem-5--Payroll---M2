import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
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


@Controller('recruitment')
export class RecruitmentController {
  constructor(private readonly recruitmentService: RecruitmentService) {}

  //template routes 
  
  @Post('templates')
  createJobTemplate(@Body() createJobTemplateDto: CreateJobTemplateDto) {
    return this.recruitmentService.createJobTemplate(createJobTemplateDto);
  }

  @Get('templates')
  getAllJobTemplates() {
    return this.recruitmentService.getAllJobTemplates();
  }

  @Get('templates/:id')
  getJobTemplate(@Param('id') id: string) {
    return this.recruitmentService.getJobTemplate(id);
  }

  @Patch('templates/:id')
  updateJobTemplate(@Param('id') templateId: string, @Body() dto: UpdateJobTemplateDto) {
    return this.recruitmentService.updateJobTemplate(templateId, dto);
  }

  @Delete('templates/:id')
  deleteJobTemplate(@Param('id') id: string) {
    return this.recruitmentService.deleteJobTemplate(id);
  }

  // requisition routes

  @Post('requisitions/:templateId')
  createJobRequisition(@Param('templateId') templateId: string, @Body() createJobRequisitionDto: CreateJobRequisitionDto) {
    return this.recruitmentService.createJobRequisition(createJobRequisitionDto, templateId);
  }

  @Get('requisitions')
  getAllJobRequisitions() {
    return this.recruitmentService.getAllJobRequisitions();
  }

  @Get('requisitions/:id')
  getJobRequisition(@Param('id') id: string) {
    return this.recruitmentService.getJobRequisition(id);
  }

  @Patch('requisitions/:id')
  updateJobRequisition(@Param('id') id: string, @Body() dto: UpdateJobRequisitionDto) {
    return this.recruitmentService.updateJobRequisition(id, dto);
  }

  @Delete('requisitions/:id')
  deleteJobRequisition(@Param('id') id: string) {
    return this.recruitmentService.deleteJobRequisition(id);
  }

  //offer routes

  @Post('offers')
  createOffer(@Body() createJobOfferDto: CreateJobOfferDto) {
    return this.recruitmentService.createOffer(createJobOfferDto);
  }

  @Get('offers')
  getAllOffers() {
    return this.recruitmentService.getAllOffers();
  }

  @Get('offers/:id')
  getOffer(@Param('id') id: string) {
    return this.recruitmentService.getOffer(id);
  }

  @Patch('offers/:id')
  updateOffer(@Param('id') id: string, @Body() updateJobOfferDto: UpdateJobOfferDto) {
    return this.recruitmentService.updateOffer(id, updateJobOfferDto);
  }

  //referral

  @Post('referrals')
  createReferral(@Body() createReferralDto: CreateReferralDto) {
    return this.recruitmentService.createReferral(createReferralDto);
  }

  @Get('referrals/:id')
  getReferral(@Param('id') id: string) {
    return this.recruitmentService.getReferral(id);
  }

  //interview

  @Post('interviews')
createInterview(@Body() createInterviewDto: CreateInterviewDto) {
  return this.recruitmentService.createInterview(createInterviewDto);
}

  @Get('interviews')
  getAllInterviews() {
    return this.recruitmentService.getAllInterviews();
  }

  @Get('interviews/panel-member/:userId')
  getInterviewsByPanelMember(@Param('userId') userId: string) {
    return this.recruitmentService.getInterviewsByPanelMember(userId);
  }


  @Get('interviews/:id')
  getInterview(@Param('id') id: string) {
    return this.recruitmentService.getInterview(id);
  }

  @Patch('interviews/:id')
  updateInterview(@Param('id') id: string, @Body() updateInterviewDto: UpdateInterviewDto) {
    return this.recruitmentService.updateInterview(id, updateInterviewDto);
  }

  //feedback

  @Post('feedback')
  createFeedback(@Body() createFeedbackDto: CreateFeedbackDto) {
    return this.recruitmentService.createFeedback(createFeedbackDto);
  }

  @Get('feedback')
  getAllFeedback() {
    return this.recruitmentService.getAllFeedback();
  }

  // @Get('feedback/by-interview/:interviewId') 
  // getFeedbackByInterview(@Param('interviewId') interviewId: string) {
  //   return this.recruitmentService.getFeedbackByInterview(interviewId);
  // }

  @Get('feedback/:id')
  getFeedback(@Param('id') id: string) {
    return this.recruitmentService.getFeedback(id);
  }

  @Patch('feedback/:id')
  updateFeedback(@Param('id') id: string, @Body() updateFeedbackDto: UpdateFeedbackDto) {
    return this.recruitmentService.updateFeedback(id, updateFeedbackDto);
  }

  // application history routes

  @Get('applications/:id/history')
  getApplicationHistory(@Param('id') id: string) {
    return this.recruitmentService.getApplicationHistory(id);
  }

  //application routes

  @Post('applications')
  createApplication(@Body() createApplicationDto: CreateApplicationDto) {
    return this.recruitmentService.createApplication(createApplicationDto);
  }

  @Get('applications')
  getAllApplications() {
    return this.recruitmentService.getAllApplications();
  }

  @Get('applications/:id')
  getApplication(@Param('id') id: string) {
    return this.recruitmentService.getApplication(id);
  }

  @Patch('applications/:id')
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