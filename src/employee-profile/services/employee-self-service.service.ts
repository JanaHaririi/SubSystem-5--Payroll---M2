import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EmployeeProfile, EmployeeProfileDocument } from '../models/employee-profile.schema';
import { UpdateContactInfoDto } from '../dto/update-contact-info.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { EmployeeStatus } from '../enums/employee-profile.enums';
import { PerformanceService } from '../../performance/performance.service';
import { NotificationLogService } from '../../time-management/services/notification-log.service';

@Injectable()
export class EmployeeSelfServiceService {
  constructor(
    @InjectModel(EmployeeProfile.name)
    private employeeProfileModel: Model<EmployeeProfileDocument>,
    private performanceService: PerformanceService,
    private notificationLogService: NotificationLogService,
  ) {}

  // Get my employee profile (US-E2-04)
  async getMyProfile(employeeId: string): Promise<any> {
    const profile = await this.employeeProfileModel
      .findById(employeeId)
      .populate('accessProfileId')
      .populate('primaryPositionId')
      .populate('primaryDepartmentId')
      .populate('supervisorPositionId')
      .populate('payGradeId')
      .exec();

    if (!profile) {
      throw new NotFoundException('Employee profile not found');
    }

    // Retrieve appraisal history from Performance module with error handling
    let appraisalHistory: any[] = [];
    try {
      appraisalHistory = await this.performanceService.getEmployeeAppraisals(employeeId);
    } catch (error) {
      // If performance service fails, return empty array for appraisal history
      console.error('Failed to fetch appraisal history:', error.message);
    }

    return {
      ...profile.toObject(),
      appraisalHistory,
    };
  }

  // Update my contact information (US-E2-05)
  async updateMyContactInfo(
    employeeId: string,
    userId: string,
    updateDto: UpdateContactInfoDto,
  ): Promise<EmployeeProfileDocument> {
    const updated = await this.employeeProfileModel.findByIdAndUpdate(
      employeeId,
      {
        ...updateDto,
        lastModifiedBy: userId,
        lastModifiedAt: new Date(),
      },
      { new: true },
    );
    if (!updated) {
      throw new NotFoundException('Employee profile not found');
    }

    // Send N-037 notification to employee
    await this.notificationLogService.sendNotification({
      to: new Types.ObjectId(employeeId),
      type: 'N-037',
      message: 'Your contact information has been updated successfully.',
    });

    return updated;
  }

  // Update my profile (biography and photo) (US-E2-12)
  async updateMyProfile(
    employeeId: string,
    userId: string,
    updateDto: UpdateProfileDto,
  ): Promise<EmployeeProfileDocument> {
    const updated = await this.employeeProfileModel.findByIdAndUpdate(
      employeeId,
      {
        ...updateDto,
        lastModifiedBy: userId,
        lastModifiedAt: new Date(),
      },
      { new: true },
    );
    if (!updated) {
      throw new NotFoundException('Employee profile not found');
    }

    // Send N-037 notification to employee
    await this.notificationLogService.sendNotification({
      to: new Types.ObjectId(employeeId),
      type: 'N-037',
      message: 'Your profile has been updated successfully.',
    });

    return updated;
  }

  // Get team members (US-E4-01, US-E4-02)
  async getTeamMembers(managerPositionId: string): Promise<EmployeeProfileDocument[]> {
    return await this.employeeProfileModel
      .find({ supervisorPositionId: managerPositionId, status: EmployeeStatus.ACTIVE })
      .populate('primaryPositionId')
      .populate('primaryDepartmentId')
      .select('-password -nationalId -dateOfBirth -personalEmail -homePhone -address')
      .exec();
  }

  // Get specific team member profile (US-E4-01)
  async getTeamMemberProfile(
    employeeId: string,
    managerPositionId: string,
  ): Promise<EmployeeProfileDocument> {
    const employee = await this.employeeProfileModel
      .findOne({
        _id: employeeId,
        supervisorPositionId: managerPositionId,
      })
      .populate('primaryPositionId')
      .populate('primaryDepartmentId')
      .select('-password -nationalId -dateOfBirth -personalEmail -homePhone -address')
      .exec();

    if (!employee) {
      throw new ForbiddenException('Employee is not a direct report or not found');
    }

    return employee;
  }
}
