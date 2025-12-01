import { Injectable, NotFoundException } from '@nestjs/common';
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

import { EmployeeStatus, SystemRole } from 'src/employee-profile/enums/employee-profile.enums';
import { NotificationLogService } from 'src/time-management/services/notification-log.service';

//ERRORS WILL DISSAPEAR ONCE ALL IS MERGED INTO MAIN -DO NOT REMOVE ANYTHING
import { EmployeeCrudService } from 'src/employee-profile/services/employee-crud.service';
import { EmployeeRoleService } from 'src/employee-profile/services/employee-role.service';
import { HrAdminService } from 'src/employee-profile/services/hr-admin.service';


@Injectable()
export class OffboardingService {

  constructor(
    @InjectModel(TerminationRequest.name)
    private terminationRequestModel: Model<TerminationRequestDocument>,

    @InjectModel(ClearanceChecklist.name)
    private clearanceChecklistModel: Model<ClearanceChecklistDocument>,

    //Time-Management services
    private readonly notificationLogService: NotificationLogService,
    
    // TODO: Inject EmployeeWarningService to fetch warning history- need performance services

    //Employee services
    private readonly hrAdminService: HrAdminService,
    private readonly employeeCrudService : EmployeeCrudService ,
    private readonly employeeRoleService : EmployeeRoleService 
    
    //TODO : inject payroll services

    //TODO , INJECT LEAVES SERVICES
  ) {}

  // TERMINATION REQUEST SERVICES

  async createTerminationRequest(terminationRequestData: CreateTerminationRequestDto): Promise<TerminationRequestDocument> {
    const newTerminationRequest = new this.terminationRequestModel(terminationRequestData);
    const savedRequest = await newTerminationRequest.save();

    // TODO: USER STORY - HR Manager initiates termination based on warnings/performance -NEED PERFORMANCE
    // When HR creates termination request, attach warning history and performance data
    // if (savedRequest.initiator === TerminationInitiation.HR || 
    //     savedRequest.initiator === TerminationInitiation.MANAGER) {
    //   const warnings = await this.employeeWarningService.getWarningsByEmployeeId(savedRequest.employeeId);
    //   const performanceReviews = await this.performanceReviewService.getReviewsByEmployeeId(savedRequest.employeeId);
    //   // Attach to termination request for justification
    // }

    // Notification: Employee submits resignation request - keep employee updated
    if (savedRequest.initiator === TerminationInitiation.EMPLOYEE) {
      await this.notificationLogService.sendNotification({
        to: savedRequest.employeeId,
        type: 'Resignation Request Submitted',
        message: 'Your resignation request has been submitted successfully and is pending HR review.',
      });

      // TODO: Get HR Manager ID from system settings or department -WE CAN BYPASS BY CREATING A REQUEST DASHBOARD FOR HR SHOWING ANY EMPLOYEE TERMINATION REQUEST

      const hrManagers = await this.employeeRoleService.getEmployeesByRole(SystemRole.HR_MANAGER);
      if (hrManagers && hrManagers.length > 0) {
        await this.notificationLogService.sendNotification({
          to: hrManagers[0].id, // Take first HR Manager
          type: 'New Resignation Request',
          message: `Employee ${savedRequest.employeeId} has submitted a resignation request. Reason: ${savedRequest.reason}`,
        });
      }
  
    }

    // Notification: HR or Manager initiates termination
    if (savedRequest.initiator === TerminationInitiation.HR || savedRequest.initiator === TerminationInitiation.MANAGER) {
      // Notify employee about termination initiation
      await this.notificationLogService.sendNotification({
        to: savedRequest.employeeId,
        type: 'Termination Notice',
        message: `A termination request has been initiated. Reason: ${savedRequest.reason}. Please contact HR for details.`,
      });
    }

    return savedRequest;
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

    // Notify Payroll Manager for final pay calculation 
    const payrollManagers = await this.employeeRoleService.getEmployeesByRole(SystemRole.PAYROLL_MANAGER);
    if (payrollManagers && payrollManagers.length > 0) {
      await this.notificationLogService.sendNotification({
        to: payrollManagers[0].id,
        type: 'Final Pay Calculation Required',
        message: `Employee ${updatedTerminationRequest.employeeId} termination approved. Last working day: ${terminationDateStr}. Please calculate: unused leave days, final salary, deductions, and prepare settlement. Termination ID: ${id}`,
      });
    }

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

    //Deactivate employee/revoke system access profile using HrAdminService if hr initiated it and if employee is on leave
     //if (updatedTerminationRequest.initiator === TerminationInitiation.HR){
    const systemAdminUserId = systemAdmins && systemAdmins.length > 0 ? systemAdmins[0].employeeProfileId.toString() : 'SYSTEM';
    
    await this.hrAdminService.deactivateEmployee(
      updatedTerminationRequest.employeeId.toString(),
      systemAdminUserId,
      SystemRole.SYSTEM_ADMIN,
      EmployeeStatus.TERMINATED,
      updatedTerminationRequest.terminationDate || new Date(),
    );
  //}

    // Delete employee profile using EmployeeCrudService if hr initiated it 
    // if (updatedTerminationRequest.initiator === TerminationInitiation.HR)
  //   await this.employeeCrudService.delete(updatedTerminationRequest.employeeId.toString());
  }


  // NOTIFICATION: Status changed to REJECTED - employee tracks termination status
  if (
    currentTerminationRequest.status !== TerminationStatus.REJECTED && 
    updatedTerminationRequest.status === TerminationStatus.REJECTED
  ) {
    await this.notificationLogService.sendNotification({
      to: updatedTerminationRequest.employeeId,
      type: 'Resignation Request Rejected',
      message: `Your resignation request has been rejected. ${updatedTerminationRequest.hrComments || 'Please contact HR for more information.'}`,
    });
  }

  return updatedTerminationRequest;
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