import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EmployeeProfile, EmployeeProfileDocument } from '../models/employee-profile.schema';
import { EmployeeProfileChangeRequest } from '../models/ep-change-request.schema';
import { CreateChangeRequestDto } from '../dto/create-change-request.dto';
import { ProcessChangeRequestDto } from '../dto/process-change-request.dto';
import { ProfileChangeStatus, SystemRole } from '../enums/employee-profile.enums';
import { NotificationLogService } from '../../time-management/services/notification-log.service';
import { OrganizationStructureService } from '../../organization-structure/organization-structure.service';

@Injectable()
export class ChangeRequestService {
  constructor(
    @InjectModel(EmployeeProfile.name)
    private employeeProfileModel: Model<EmployeeProfileDocument>,
    @InjectModel(EmployeeProfileChangeRequest.name)
    private changeRequestModel: Model<EmployeeProfileChangeRequest>,
    private notificationLogService: NotificationLogService,
    @Inject(forwardRef(() => OrganizationStructureService))
    private organizationStructureService: OrganizationStructureService,
  ) {}

  // Create a change request (US-E6-02, US-E2-06)
  async createChangeRequest(
    employeeId: string,
    _userId: string, // Not used - schema simplified
    createDto: CreateChangeRequestDto,
  ): Promise<EmployeeProfileChangeRequest> {
    // Generate unique request ID
    const requestId = `CR-${Date.now()}-${employeeId.slice(-6)}`;

    console.log('=== Creating Change Request ===');
    console.log('DTO received:', JSON.stringify(createDto, null, 2));

    // Build full description including field changes
    let fullDescription = createDto.requestDescription;

    if (createDto.requestedChanges && Object.keys(createDto.requestedChanges).length > 0) {
      const changes = Object.entries(createDto.requestedChanges)
        .map(([field, value]) => {
          const fieldName = field
            .replace(/([A-Z])/g, ' $1')
            .replace('primary', '')
            .trim();
          return `${fieldName}: ${value}`;
        })
        .join(', ');

      fullDescription = `${createDto.requestDescription}\n\nRequested Changes: ${changes}`;
      console.log('Full description built:', fullDescription);
    } else {
      console.log('No requestedChanges found in DTO');
    }

    const newRequest = new this.changeRequestModel({
      requestId,
      requestDescription: fullDescription,
      employeeProfileId: employeeId,
      reason: createDto.reason,
      status: ProfileChangeStatus.PENDING,
    });

    const savedRequest = await newRequest.save();

    // Send notification to HR Admin/Manager about new change request from employee
    const hrAdmins = await this.employeeProfileModel.find({
      roles: { $in: ['HR Admin', 'HR Manager', 'hr admin', 'hr manager', 'HR_ADMIN', 'HR_MANAGER'] }
    }).select('_id');

    console.log(`📧 Sending notification to ${hrAdmins.length} HR Admin/Manager(s)`);

    for (const admin of hrAdmins) {
      await this.notificationLogService.sendNotification({
        to: new Types.ObjectId(admin._id.toString()),
        type: 'New Profile Change Request',
        message: `A new profile change request has been submitted by an employee. Reason: ${createDto.reason}. Please review and process.`,
      });
    }

    return savedRequest;
  }

  // Get my change requests
  async getMyChangeRequests(employeeId: string): Promise<EmployeeProfileChangeRequest[]> {
    return await this.changeRequestModel
      .find({ employeeProfileId: employeeId })
      .sort({ submittedAt: -1 })
      .exec();
  }

  // Get all change requests (BR-22: Audit trail)
  async getAllChangeRequests(): Promise<EmployeeProfileChangeRequest[]> {
    return await this.changeRequestModel
      .find()
      .populate('employeeProfileId')
      .sort({ submittedAt: -1 })
      .exec();
  }

  // Get all pending change requests
  async getPendingChangeRequests(): Promise<EmployeeProfileChangeRequest[]> {
    return await this.changeRequestModel
      .find({ status: ProfileChangeStatus.PENDING })
      .populate('employeeProfileId')
      .sort({ submittedAt: -1 })
      .exec();
  }

  // Get change request by ID
  async getChangeRequestById(requestId: string): Promise<EmployeeProfileChangeRequest> {
    const request = await this.changeRequestModel
      .findById(requestId)
      .populate('employeeProfileId')
      .exec();

    if (!request) {
      throw new NotFoundException('Change request not found');
    }

    return request;
  }

  // Process change request (approve/reject) (US-E2-03)
  async processChangeRequest(
    requestId: string,
    userId: string,
    userRole: string,
    processDto: ProcessChangeRequestDto,
  ): Promise<EmployeeProfileChangeRequest> {
    // Verify user has permission
    if (
      ![SystemRole.HR_ADMIN, SystemRole.HR_MANAGER].includes(
        userRole as SystemRole,
      )
    ) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const request = await this.changeRequestModel.findById(requestId);

    if (!request) {
      throw new NotFoundException('Change request not found');
    }

    if (request.status !== ProfileChangeStatus.PENDING) {
      throw new BadRequestException('Request has already been processed');
    }

    // Update request status
    request.status = processDto.approved
      ? ProfileChangeStatus.APPROVED
      : ProfileChangeStatus.REJECTED;
    request.processedAt = new Date();

    // Extract employee ID (handle both populated and non-populated cases)
    const employeeId = typeof request.employeeProfileId === 'object' && request.employeeProfileId?._id
      ? request.employeeProfileId._id
      : request.employeeProfileId;

    // Extract changed fields from the request description
    let changedFieldsText = '';
    if (request.requestDescription) {
      const changesMatch = request.requestDescription.match(/Requested Changes: (.+)/);
      if (changesMatch && changesMatch[1]) {
        changedFieldsText = changesMatch[1];
      }
    }

    // If approved, apply changes to employee profile
    if (processDto.approved) {
      console.log('✅ Change request approved - updating employee profile');

      // Note: HR Admin must manually apply the changes described in the request
      // This just updates the last modified timestamp
      await this.employeeProfileModel.findByIdAndUpdate(
        employeeId,
        {
          lastModifiedBy: userId,
          lastModifiedAt: new Date(),
        },
      );

      // N-037: Notify employee that request was approved
      let approvalMessage = `Your profile change request (${request.requestId}) has been APPROVED by HR.`;

      if (changedFieldsText) {
        approvalMessage += ` The following fields have been updated: ${changedFieldsText}.`;
      } else {
        approvalMessage += ' Your profile has been updated.';
      }

      if (processDto.comments) {
        approvalMessage += ` HR Comments: ${processDto.comments}`;
      }

      await this.notificationLogService.sendNotification({
        to: new Types.ObjectId(employeeId.toString()),
        type: 'N-037: Profile Change Approved',
        message: approvalMessage,
      });

      console.log(`✅ Notification N-037 sent: Change request ${request.requestId} approved`);
    } else {
      console.log('❌ Change request rejected');

      // N-037: Notify employee that request was rejected
      let rejectionMessage = `Your profile change request (${request.requestId}) has been REJECTED by HR.`;

      if (changedFieldsText) {
        rejectionMessage += ` Requested changes were: ${changedFieldsText}.`;
      }

      if (processDto.comments) {
        rejectionMessage += ` Reason: ${processDto.comments}`;
      } else {
        rejectionMessage += ' Please contact HR for more information.';
      }

      await this.notificationLogService.sendNotification({
        to: new Types.ObjectId(employeeId.toString()),
        type: 'N-037: Profile Change Rejected',
        message: rejectionMessage,
      });

      console.log(`✅ Notification N-037 sent: Change request ${request.requestId} rejected`);
    }

    return await request.save();
  }
}
