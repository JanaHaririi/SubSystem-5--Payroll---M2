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

    // Generate description from requested changes
    const changeFields = Object.keys(createDto.requestedChanges || {}).join(', ');
    const requestDescription = `Request to update: ${changeFields || 'profile data'}`;

    const newRequest = new this.changeRequestModel({
      requestId,
      requestDescription,
      employeeProfileId: employeeId,
      requestedChanges: createDto.requestedChanges,
      reason: createDto.reason,
      status: ProfileChangeStatus.PENDING,
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

    // If approved, apply changes to employee profile
    if (processDto.approved) {
      // Check if change request involves Position or Department (Dependency 13)
      const involvesOrgStructure =
        request.requestedChanges?.['primaryPositionId'] ||
        request.requestedChanges?.['primaryDepartmentId'];

      if (involvesOrgStructure) {
        // INTEGRATION: Validate Position/Department changes with Org Structure Module
        console.log('[INTEGRATION] Position/Department change detected. Validating with Org Structure...');

        // Validate position exists and is valid
        if (request.requestedChanges?.['primaryPositionId']) {
          try {
            await this.organizationStructureService.getPositionById(
              request.requestedChanges['primaryPositionId'].toString()
            );
          } catch (error) {
            throw new BadRequestException(
              `Invalid position ID: ${request.requestedChanges['primaryPositionId']}. Position does not exist.`
            );
          }
        }

        // Validate department exists and is active
        if (request.requestedChanges?.['primaryDepartmentId']) {
          try {
            await this.organizationStructureService.getDepartmentById(
              request.requestedChanges['primaryDepartmentId'].toString()
            );
          } catch (error) {
            throw new BadRequestException(
              `Invalid department ID: ${request.requestedChanges['primaryDepartmentId']}. Department does not exist.`
            );
          }
        }

        console.log('[INTEGRATION] Position/Department validation successful.');
      }

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
