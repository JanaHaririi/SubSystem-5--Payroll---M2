import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EmployeeProfile, EmployeeProfileDocument } from '../models/employee-profile.schema';
import { EmployeeProfileChangeRequest } from '../models/ep-change-request.schema';
import { CreateChangeRequestDto } from '../dto/create-change-request.dto';
import { ProcessChangeRequestDto } from '../dto/process-change-request.dto';
import { ProfileChangeStatus, SystemRole } from '../enums/employee-profile.enums';
import { NotificationLogService } from '../../time-management/services/notification-log.service';

@Injectable()
export class ChangeRequestService {
  constructor(
    @InjectModel(EmployeeProfile.name)
    private employeeProfileModel: Model<EmployeeProfileDocument>,
    @InjectModel(EmployeeProfileChangeRequest.name)
    private changeRequestModel: Model<EmployeeProfileChangeRequest>,
    private notificationLogService: NotificationLogService,
  ) {}

  // Create a change request (US-E6-02, US-E2-06)
  async createChangeRequest(
    employeeId: string,
    userId: string,
    createDto: CreateChangeRequestDto,
  ): Promise<EmployeeProfileChangeRequest> {
    // Generate unique request ID
    const requestId = `CR-${Date.now()}-${employeeId.slice(-6)}`;

    // Generate description from requested changes
    const changeFields = Object.keys(createDto.requestedChanges || {}).join(', ');
    const requestDescription = `Request to update: ${changeFields || 'profile data'}`;

    const newRequest = new this.changeRequestModel({
      requestId,
      requestDescription,
      employeeProfileId: employeeId,
      requestedBy: userId,
      requestedChanges: createDto.requestedChanges,
      reason: createDto.reason,
      status: ProfileChangeStatus.PENDING,
      requestDate: new Date(),
    });

    const savedRequest = await newRequest.save();

    // Send notification to HR about new change request
    await this.notificationLogService.sendNotification({
      to: new Types.ObjectId(employeeId),
      type: 'Profile Change Request Submitted',
      message: `A new profile change request has been submitted for review. Reason: ${createDto.reason}`,
    });

    return savedRequest;
  }

  // Get my change requests
  async getMyChangeRequests(employeeId: string): Promise<EmployeeProfileChangeRequest[]> {
    return await this.changeRequestModel
      .find({ employeeProfileId: employeeId })
      .sort({ requestDate: -1 })
      .exec();
  }

  // Get all pending change requests
  async getPendingChangeRequests(): Promise<EmployeeProfileChangeRequest[]> {
    return await this.changeRequestModel
      .find({ status: ProfileChangeStatus.PENDING })
      .populate('employeeProfileId')
      .populate('requestedBy')
      .sort({ requestDate: -1 })
      .exec();
  }

  // Get change request by ID
  async getChangeRequestById(requestId: string): Promise<EmployeeProfileChangeRequest> {
    const request = await this.changeRequestModel
      .findById(requestId)
      .populate('employeeProfileId')
      .populate('requestedBy')
      .populate('reviewedBy')
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
      ![SystemRole.HR_ADMIN, SystemRole.HR_MANAGER, SystemRole.SYSTEM_ADMIN].includes(
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
    request.reviewedBy = new Types.ObjectId(userId);
    request.reviewDate = new Date();
    request.reviewComments = processDto.comments;

    // If approved, apply changes to employee profile
    if (processDto.approved) {
      await this.employeeProfileModel.findByIdAndUpdate(
        request.employeeProfileId,
        {
          ...request.requestedChanges,
          lastModifiedBy: userId,
          lastModifiedAt: new Date(),
        },
      );

      // Notify employee that request was approved
      await this.notificationLogService.sendNotification({
        to: new Types.ObjectId(request.employeeProfileId.toString()),
        type: 'Profile Change Request Approved',
        message: `Your profile change request has been approved. ${processDto.comments || ''}`,
      });
    } else {
      // Notify employee that request was rejected
      await this.notificationLogService.sendNotification({
        to: new Types.ObjectId(request.employeeProfileId.toString()),
        type: 'Profile Change Request Rejected',
        message: `Your profile change request has been rejected. ${processDto.comments || ''}`,
      });
    }

    return await request.save();
  }
}
