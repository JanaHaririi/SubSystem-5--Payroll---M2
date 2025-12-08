import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TerminationRequest, TerminationRequestDocument } from '../models/termination-request.schema';
import { CreateTerminationRequestDto } from '../dto/create-termination-request.dto';
import { UpdateTerminationRequestDto } from 'src/recruitment/dto/update-termination-request.dto';
import { ClearanceChecklist, ClearanceChecklistDocument } from 'src/recruitment/models/clearance-checklist.schema';
import { CreateClearanceChecklistDto } from 'src/recruitment/dto/create-clearance-checklist.dto';
import { UpdateClearanceChecklistDto } from 'src/recruitment/dto/update-clearance-checklist.dto';
import { TerminationStatus } from 'src/recruitment/enums/termination-status.enum';
import { TerminationInitiation } from 'src/recruitment/enums/termination-initiation.enum';
import { ApprovalStatus } from 'src/recruitment/enums/approval-status.enum';

//Employee services
import { EmployeeStatus, SystemRole } from 'src/employee-profile/enums/employee-profile.enums';
import { EmployeeCrudService } from 'src/employee-profile/services/employee-crud.service';
import { EmployeeRoleService } from 'src/employee-profile/services/employee-role.service';
import { HrAdminService } from 'src/employee-profile/services/hr-admin.service';
import { PerformanceService } from 'src/performance/performance.service';

//notification service
import { NotificationLogService } from 'src/time-management/services/notification-log.service';

//payroll services and models and enums
import { EmployeeTerminationResignation , EmployeeTerminationResignationDocument } from 'src/payroll-execution/models/EmployeeTerminationResignation.schema';
import { PayrollConfigurationService } from 'src/payroll-configuration/payroll-configuration.service';
import { terminationAndResignationBenefits , terminationAndResignationBenefitsDocument} from 'src/payroll-configuration/models/terminationAndResignationBenefits';
import { PayrollExecutionService } from 'src/payroll-execution/payroll-execution.service';
import { ConfigStatus } from 'src/payroll-configuration/enums/payroll-configuration-enums';
import { BenefitStatus } from 'src/payroll-execution/enums/payroll-execution-enum';


@Injectable()
export class OffboardingService {

  constructor(
    @InjectModel(TerminationRequest.name)
    private terminationRequestModel: Model<TerminationRequestDocument>,

    @InjectModel(ClearanceChecklist.name)
    private clearanceChecklistModel: Model<ClearanceChecklistDocument>,

    //payroll models injection
    @InjectModel(EmployeeTerminationResignation.name)
    private exitBenefitsModel: Model<EmployeeTerminationResignationDocument>,
  
    @InjectModel(terminationAndResignationBenefits.name) 
    private exitBenefitsConfigModel: Model<terminationAndResignationBenefitsDocument>,

    //Time-Management services
    private readonly notificationLogService: NotificationLogService,

    //Employee services
    private readonly hrAdminService: HrAdminService,
    //private readonly employeeCrudService : EmployeeCrudService ,
    private readonly employeeRoleService : EmployeeRoleService ,

    //  performance services
    private readonly performanceService : PerformanceService ,

    //  payroll services
    private readonly payrollExecutionService : PayrollExecutionService,
    private readonly payrollConfigService : PayrollConfigurationService,

    //TODO , INJECT LEAVES SERVICES

  ) {}

  async createTerminationRequest(terminationRequestData: CreateTerminationRequestDto): Promise<TerminationRequestDocument> {
    let shouldCreateRequest = false;
    let performanceIssueDetected = false;

    // USER STORY: HR Manager initiates termination based on performance data
    if (terminationRequestData.initiator === TerminationInitiation.HR || 
        terminationRequestData.initiator === TerminationInitiation.MANAGER) {
      
      try {
        // Get employee's latest appraisal
        const employeeAppraisals = await this.performanceService.getEmployeeAppraisals(
          terminationRequestData.employeeId.toString()
        );

        if (employeeAppraisals && employeeAppraisals.length > 0) {
          const latestAppraisal = employeeAppraisals[0]; // Most recent

          if (latestAppraisal.templateId && latestAppraisal.latestAppraisalId) {
            // Get the template
            const template = await this.performanceService.getAppraisalTemplateById(
              latestAppraisal.templateId.toString()
            );

            // Get the appraisal record
            const appraisalRecord = await this.performanceService.getAppraisalRecordById(
              latestAppraisal.latestAppraisalId.toString()/*latestAppraisalId.toString()*/
            );

            // Check if record exists and has valid data
            if (appraisalRecord && 
                appraisalRecord.totalScore !== undefined && 
                template && 
                template.ratingScale) {
              
              // Compare score with template minimum
              if (appraisalRecord.totalScore < template.ratingScale.min) {
                // Performance below minimum - allow termination request creation
                performanceIssueDetected = true;
                shouldCreateRequest = true;

                // Create the termination request
                const newTerminationRequest = new this.terminationRequestModel(terminationRequestData);
                const savedRequest = await newTerminationRequest.save();

                // Send performance-related notifications
                await this.notificationLogService.sendNotification({
                  to: newTerminationRequest.employeeId,
                  type: 'Termination Notice - Poor Performance',
                  message: `A termination request has been initiated due to performance below minimum acceptable standards. Your latest appraisal score: ${appraisalRecord.totalScore}/${template.ratingScale.max} (Minimum required: ${template.ratingScale.min}). Reason: ${savedRequest.reason}. Please contact HR immediately.`,
                });

                // Notify HR
                const hrManagers = await this.employeeRoleService.getEmployeesByRole(SystemRole.HR_MANAGER);

                if (hrManagers && hrManagers.length > 0) {
                  await this.notificationLogService.sendNotification({
                    to: hrManagers[0].id,
                    type: 'Termination Request - Below Minimum Performance',
                    message: `Termination request created for employee ${savedRequest.employeeId}. Latest appraisal score ${appraisalRecord.totalScore}/${template.ratingScale.max} is below minimum of ${template.ratingScale.min}. Immediate action required.`,
                  });
                }

                return savedRequest;
              } else {
                // Performance is acceptable - do not create termination request
                throw new BadRequestException(
                  `Cannot create termination request for performance reasons. Employee's latest appraisal score (${appraisalRecord.totalScore}/${template.ratingScale.max}) meets or exceeds minimum requirements (${template.ratingScale.min}).`
                );
              }
            }
          }
        }

        // No appraisal data found - cannot create HR/Manager initiated termination
        if (!shouldCreateRequest) {
          throw new BadRequestException(
            'Cannot create termination request. No performance appraisal data found to justify termination.'
          );
        }

      } catch (error) {
        // If it's already a BadRequestException, re-throw it
        if (error instanceof BadRequestException) {
          throw error;
        }
        
        console.error('Error checking performance for termination:', error);
        throw new BadRequestException(
          'Unable to verify performance data. Cannot create termination request.'
        );
      }
    }

    // Employee resignation - always allowed
    if (terminationRequestData.initiator === TerminationInitiation.EMPLOYEE) {
      const newTerminationRequest = new this.terminationRequestModel(terminationRequestData);
      const savedRequest = await newTerminationRequest.save();

      await this.notificationLogService.sendNotification({
        to: savedRequest.employeeId,
        type: 'Resignation Request Submitted',
        message: 'Your resignation request has been submitted successfully and is pending HR review.',
      });

      const hrManagers = await this.employeeRoleService.getEmployeesByRole(SystemRole.HR_MANAGER);
      if (hrManagers && hrManagers.length > 0) {
        await this.notificationLogService.sendNotification({
          to: hrManagers[0].id,
          type: 'New Resignation Request',
          message: `Employee ${savedRequest.employeeId} has submitted a resignation request. Reason: ${savedRequest.reason}`,
        });
      }

      return savedRequest;
    }

    throw new BadRequestException('Invalid termination request');
  }


  async updateTerminationRequest(id: string, terminationRequestData: UpdateTerminationRequestDto): Promise<TerminationRequestDocument> {
  // Get current state before update
  const currentTerminationRequest = await this.terminationRequestModel.findById(id).exec();
  if (!currentTerminationRequest) {
    throw new NotFoundException('Termination request not found');
  }

  // Update the termination request
  const updatedTerminationRequest = await this.terminationRequestModel.findByIdAndUpdate(id,terminationRequestData,{ new: true },);

  if (!updatedTerminationRequest) {
    throw new NotFoundException('Termination request not found');
  }

  // NOTIFICATION: Status changed to UNDER_REVIEW - employee tracks termination status
  if (currentTerminationRequest.status !== TerminationStatus.UNDER_REVIEW && updatedTerminationRequest.status === TerminationStatus.UNDER_REVIEW
  ) {
    await this.notificationLogService.sendNotification({
      to: updatedTerminationRequest.employeeId,
      type: 'Resignation Request Under Review',
      message: 'Your resignation request is now being reviewed by HR. You will be notified once a decision is made.',
    });
  }

  // NOTIFICATION: Status changed to APPROVED - employee tracks termination status
  if (currentTerminationRequest.status !== TerminationStatus.APPROVED &&
     updatedTerminationRequest.status === TerminationStatus.APPROVED) {

    const terminationDateStr = updatedTerminationRequest.terminationDate 
      ? new Date(updatedTerminationRequest.terminationDate).toLocaleDateString() 
      : 'to be determined';

    // Notify employee about approval
    await this.notificationLogService.sendNotification({
      to: updatedTerminationRequest.employeeId,
      type: 'Resignation Request Approved',
      message: `Your resignation request has been approved. Your last working day will be ${terminationDateStr}. Please complete your clearance checklist before departure.`,
    });

    // Notify HR Manager for benefits termination
    const hrManagers = await this.employeeRoleService.getEmployeesByRole(SystemRole.HR_MANAGER);
    if (hrManagers && hrManagers.length > 0) {
      await this.notificationLogService.sendNotification({
        to: hrManagers[0].id,
        type: 'Benefits Termination Required',
        message: `Employee ${updatedTerminationRequest.employeeId} termination approved. Last working day: ${terminationDateStr}. Please process: Health insurance termination, benefits cancellation, final settlements. Termination ID: ${id}`,
      });
    }

    // Notify System Admin to revoke access
    const systemAdmins = await this.employeeRoleService.getEmployeesByRole(SystemRole.SYSTEM_ADMIN);
    if (systemAdmins && systemAdmins.length > 0) {
      await this.notificationLogService.sendNotification({
        to: systemAdmins[0].id,
        type: 'Revoke System Access',
        message: `Employee ${updatedTerminationRequest.employeeId} termination approved. Please revoke: Email access, VPN credentials, Internal system access, Database permissions. Termination date: ${terminationDateStr}`,
      });
    }

     const financialStaff = await this.employeeRoleService.getEmployeesByRole(SystemRole.FINANCE_STAFF);
    if (financialStaff && financialStaff.length > 0) {
      await this.notificationLogService.sendNotification({
        to: financialStaff[0].id,
        type: 'financial signature needed',
        message: `Employee ${updatedTerminationRequest.employeeId} termination approved. Please sign off for the employee's financial records. Termination date: ${terminationDateStr}`,
      });
    }

    //As a System Admin, I want to revoke system and account access upon termination, so security is maintained. Deactivate employee/revoke system access profile using HrAdminService if hr initiated it and if employee is on leave
     if (updatedTerminationRequest.initiator === TerminationInitiation.HR){

     // const systemAdminUserId = systemAdmins && systemAdmins.length > 0 ? systemAdmins[0].employeeProfileId.toString() : 'SYSTEM';
    
    await this.hrAdminService.deactivateEmployee(
      updatedTerminationRequest.employeeId.toString(),
      systemAdmins[0].id,
      SystemRole.SYSTEM_ADMIN,
      EmployeeStatus.TERMINATED,
      updatedTerminationRequest.terminationDate || new Date(),
    );
    }

    // Delete employee profile using EmployeeCrudService if hr initiated it 
    // if (updatedTerminationRequest.initiator === TerminationInitiation.HR)
  //   await this.employeeCrudService.delete(updatedTerminationRequest.employeeId.toString());


    //As HR Manager, I want to send offboarding notification to trigger benefits termination and final pay calc (unused leave, deductions), so settlements are accurate. which means you need to trigger service that fills collection that relates user to benefit which is in payroll execution module

    
    // Find the approved exit benefits template from payroll configuration
    const approvedExitBenefitTemplate = await this.exitBenefitsConfigModel.findOne({ status: ConfigStatus.APPROVED }).exec();

    if (!approvedExitBenefitTemplate) throw new NotFoundException('cannot find benefit template') ;
        
      // Create the employee-specific exit benefits record in payroll execution
      const exitBenefitsRecord = new this.exitBenefitsModel({
        employeeId: updatedTerminationRequest.employeeId,
        benefitId: approvedExitBenefitTemplate._id, 
        terminationId: updatedTerminationRequest._id,
        status: BenefitStatus.PENDING,
      });

      await exitBenefitsRecord.save();
      
      const payrollManagers = await this.employeeRoleService.getEmployeesByRole(SystemRole.PAYROLL_MANAGER);
      // Notify Payroll Manager about new exit benefit requiring Phase 0 approval
      if (payrollManagers && payrollManagers.length > 0) {
        await this.notificationLogService.sendNotification({
          to: payrollManagers[0].id,
          type: 'Exit Benefits Approval Required',
          message: ` Exit benefits record auto-created for employee ${updatedTerminationRequest.employeeId}.(Base Amount: ${approvedExitBenefitTemplate.amount} . Require signing`,
        }); }
      
  }

  // NOTIFICATION: Status changed to REJECTED - employee tracks termination status
  if (currentTerminationRequest.status !== TerminationStatus.REJECTED && updatedTerminationRequest.status === TerminationStatus.REJECTED) {

    await this.notificationLogService.sendNotification({
      to: updatedTerminationRequest.employeeId,
      type: 'Resignation Request Rejected',
      message: `Your resignation request has been rejected. ${updatedTerminationRequest.hrComments || 'Please contact HR for more information.'}`,
    });
  }

  return updatedTerminationRequest;
}

async getAllTerminationRequests(employeeId?: string): Promise<TerminationRequestDocument[]> {
    const filter = employeeId ? { employeeId } : {};
    return this.terminationRequestModel.find(filter).exec();
  }

  async getTerminationRequest(id: string): Promise<TerminationRequestDocument> {
    const terminationRequest = await this.terminationRequestModel.findById(id).exec();
    if (!terminationRequest) {
      throw new NotFoundException('Termination request not found');
    }
    return terminationRequest;
  }

  // CLEARANCE CHECKLIST SERVICES

  async createClearanceChecklist(clearanceChecklistData: CreateClearanceChecklistDto): Promise<ClearanceChecklistDocument> {
    const newClearanceChecklist = new this.clearanceChecklistModel(clearanceChecklistData);
    const savedChecklist = await newClearanceChecklist.save();

    // Get termination request to find employee ID
    const terminationRequest = await this.terminationRequestModel.findById(savedChecklist.terminationId).exec();
    
    if (terminationRequest) {
      // Notify employee about clearance checklist creation
      await this.notificationLogService.sendNotification({
        to: terminationRequest.employeeId,
        type: 'Clearance Checklist Created',
        message: 'Your offboarding clearance checklist has been created. Please complete all items before your last working day.',
      });

      // TODO: USER STORY - Multi-department clearance notifications
      // Notify IT Department
      // await this.notificationLogService.sendNotification({
      //   to: itManagerId,
      //   type: 'IT Clearance Required',
      //   message: `Employee ${terminationRequest.employeeId} offboarding initiated. Please ensure: Laptop returned, Access card collected, Software licenses revoked, Hardware inventory checked.`,
      // });

      // TODO: Notify Finance Department
      // await this.notificationLogService.sendNotification({
      //   to: financeManagerId,
      //   type: 'Finance Clearance Required',
      //   message: `Employee ${terminationRequest.employeeId} offboarding initiated. Please verify: Company credit card returned, Outstanding expenses settled, Financial documents submitted.`,
      // });

      // TODO: Notify Facilities Department
      // await this.notificationLogService.sendNotification({
      //   to: facilitiesManagerId,
      //   type: 'Facilities Clearance Required',
      //   message: `Employee ${terminationRequest.employeeId} offboarding initiated. Please ensure: Office keys returned, Parking pass collected, Desk cleared, Building access revoked.`,
      // });

      // TODO: Notify Line Manager
      // await this.notificationLogService.sendNotification({
      //   to: lineManagerId,
      //   type: 'Manager Clearance Required',
      //   message: `Employee ${terminationRequest.employeeId} offboarding initiated. Please complete: Knowledge transfer session, Project handover, Team notification, Final performance review.`,
      // });
    }

    return savedChecklist;
  }

  async getAllClearanceChecklists(terminationId?: string): Promise<ClearanceChecklistDocument[]> {
    const filter = terminationId ? { terminationId } : {};
    return this.clearanceChecklistModel.find(filter).exec();
  }

  async getClearanceChecklist(id: string): Promise<ClearanceChecklistDocument> {
    const clearanceChecklist = await this.clearanceChecklistModel.findById(id).exec();
    if (!clearanceChecklist) {
      throw new NotFoundException('Clearance checklist not found');
    }
    return clearanceChecklist;
  }

  // TODO: USER STORY - Track clearance checklist by termination request
  // async getClearanceChecklistByTerminationId(terminationId: string): Promise<ClearanceChecklistDocument> {
  //   const checklist = await this.clearanceChecklistModel.findOne({ terminationId }).exec();
  //   if (!checklist) {
  //     throw new NotFoundException('Clearance checklist not found for this termination request');
  //   }
  //   return checklist;
  // }

  async updateClearanceChecklist(id: string, clearanceChecklistData: UpdateClearanceChecklistDto): Promise<ClearanceChecklistDocument> {
    const currentChecklist = await this.clearanceChecklistModel.findById(id).exec();
    if (!currentChecklist) {
      throw new NotFoundException('Clearance checklist not found');
    }

    const updatedClearanceChecklist = await this.clearanceChecklistModel.findByIdAndUpdate(
      id,
      clearanceChecklistData,
      { new: true },
    );

    if (!updatedClearanceChecklist) {
      throw new NotFoundException('Clearance checklist not found');
    }

    // TODO: USER STORY - Multi-department sign-off notifications
    // When a department completes their items, notify employee and HR
    // Check which department just completed their items and send appropriate notifications
    // Example:
    // if (itItemsJustCompleted) {
    //   await this.notificationLogService.sendNotification({
    //     to: terminationRequest.employeeId,
    //     type: 'IT Clearance Completed',
    //     message: 'IT department has approved your clearance. All IT assets have been returned successfully.',
    //   });
    // }

    // Check if all items are completed
    // Check if all items are completed
    const allItemsCompleted = updatedClearanceChecklist.items?.every(item => item.status === ApprovalStatus.APPROVED) ?? false; // Changed
    const allEquipmentReturned = updatedClearanceChecklist.equipmentList?.every(eq => eq.returned) ?? false;
    const cardReturned = updatedClearanceChecklist.cardReturned ?? false;
    // Get termination request to find employee ID
    const terminationRequest = await this.terminationRequestModel.findById(updatedClearanceChecklist.terminationId).exec();

    if (terminationRequest) {
      // TODO: USER STORY - Multi-department clearance complete
      // Notify when checklist is fully completed (all departments signed off)
      if (allItemsCompleted && allEquipmentReturned && cardReturned) {
        // Notify employee
        await this.notificationLogService.sendNotification({
          to: terminationRequest.employeeId,
          type: 'Clearance Checklist Completed',
          message: 'Congratulations! You have completed all clearance checklist items from all departments (IT, Finance, Facilities, Manager). Your final settlement will be processed shortly.',
        });

        // TODO: Get HR/Finance manager ID
        // Notify HR/Finance for final settlement
        await this.notificationLogService.sendNotification({
          to: terminationRequest.employeeId, // TODO: Replace with HR/Finance manager ID
          type: 'Clearance Complete - Process Final Settlement',
          message: `Employee ${terminationRequest.employeeId} has completed all clearance items. All departments have signed off (IT, Finance, Facilities, Manager). All equipment returned. Please process final settlement and close termination request ${updatedClearanceChecklist.terminationId}.`,
        });

        // TODO: Automatically revoke all system access after full clearance
        // await this.employeeSystemRoleService.revokeAllAccess(terminationRequest.employeeId.toString());
      }
    }

    return updatedClearanceChecklist;
  }

  async deleteClearanceChecklist(id: string): Promise<ClearanceChecklistDocument> {
    const deletedClearanceChecklist = await this.clearanceChecklistModel.findByIdAndDelete(id);
    if (!deletedClearanceChecklist) {
      throw new NotFoundException('Clearance checklist not found');
    }
    return deletedClearanceChecklist;
  }

  // TODO: USER STORY - HR Manager views termination justification data
  // Add method to fetch warning and performance history with termination request
  // async getTerminationJustificationData(terminationId: string) {
  //   const termination = await this.terminationRequestModel.findById(terminationId).exec();
  //   if (!termination) {
  //     throw new NotFoundException('Termination request not found');
  //   }
  //   const warnings = await this.employeeWarningService.getWarningsByEmployeeId(termination.employeeId);
  //   const performanceReviews = await this.performanceReviewService.getReviewsByEmployeeId(termination.employeeId);
  //   return {
  //     termination,
  //     warnings,
  //     performanceReviews,
  //   };
  // }
}