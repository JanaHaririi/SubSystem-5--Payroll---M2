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
      .exec();

    if (!profile) {
      throw new NotFoundException('Employee profile not found');
    }

    // Manually populate only valid fields (handles null and empty string)
    if (profile.primaryPositionId && profile.primaryPositionId.toString() !== '') {
      await profile.populate('primaryPositionId');
    }
    if (profile.primaryDepartmentId && profile.primaryDepartmentId.toString() !== '') {
      await profile.populate('primaryDepartmentId');
    }
    if (profile.supervisorPositionId && profile.supervisorPositionId.toString() !== '') {
      await profile.populate('supervisorPositionId');
    }
    if (profile.payGradeId) {
      await profile.populate('payGradeId');
    }

    // Retrieve appraisal history from Performance module with error handling
    let appraisalHistory: any[] = [];
    try {
      appraisalHistory = await this.performanceService.getEmployeeAppraisals(employeeId);
    } catch (error) {
      // If performance service fails, return empty array for appraisal history
      console.error('Failed to fetch appraisal history:', error.message);
    }

    const profileObj = profile.toObject();

    // Extract roles from accessProfileId for easier access
    const roles = (profileObj.accessProfileId as any)?.roles || [];

    return {
      ...profileObj,
      roles, // Add roles at top level for convenience
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
    console.log('🔍 Finding team members where supervisorPositionId =', managerPositionId);

    // First, try to find employees who report to this position
    console.log('🧩 Query params:', { supervisorPositionId: managerPositionId, status: EmployeeStatus.ACTIVE });
    const directReports = await this.employeeProfileModel
      .find({ supervisorPositionId: managerPositionId, status: EmployeeStatus.ACTIVE })
      .populate('primaryPositionId')
      .populate('primaryDepartmentId')
      .exec();

    console.log('📦 Query result count:', directReports.length);
    console.log('👥 Team members found:', directReports.length);
    if (directReports.length > 0) {
      console.log('👤 First team member:', directReports[0]);
      directReports.forEach(emp => {
        console.log('  -', emp.fullName, '| supervisorPositionId:', emp.supervisorPositionId);
      });
    } else {
      console.warn('⚠️ EMPTY RESULT: No direct reports found with supervisorPositionId =', managerPositionId);
    }

    // If there are direct reports, return them
    if (directReports.length > 0) {
      return directReports;
    }

    // Otherwise, check if this manager is a department head
    // Find which department has this position as headPositionId
    console.log('🏢 Checking if position is department head...');
    const Department = this.employeeProfileModel.db.model('Department');
    const department = await Department.findOne({ headPositionId: managerPositionId }).exec();

    console.log('🏢 Department head check:', department ? department.name : 'Not a department head');

    if (department) {
      // Return all active employees in this department
      console.log('🧩 Query params:', { primaryDepartmentId: department._id, status: EmployeeStatus.ACTIVE });
      const deptEmployees = await this.employeeProfileModel
        .find({ primaryDepartmentId: department._id, status: EmployeeStatus.ACTIVE })
        .populate('primaryPositionId')
        .populate('primaryDepartmentId')
        .exec();

      console.log('📦 Query result count:', deptEmployees.length);
      console.log('👥 Found', deptEmployees.length, 'employees in department');
      return deptEmployees;
    }

    // No team found
    console.warn('⚠️ No team members found — check supervisorPositionId mapping');
    return [];
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
