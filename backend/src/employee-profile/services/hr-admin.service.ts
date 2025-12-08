import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EmployeeProfile, EmployeeProfileDocument } from '../models/employee-profile.schema';
import { UpdateEmployeeMasterDto } from '../dto/update-employee-master.dto';
import { SystemRole, EmployeeStatus } from '../enums/employee-profile.enums';

@Injectable()
export class HrAdminService {
  constructor(
    @InjectModel(EmployeeProfile.name)
    private employeeProfileModel: Model<EmployeeProfileDocument>,
  ) {}

  // Search employees (US-E6-03)
  async searchEmployees(
    searchQuery: string,
    status?: EmployeeStatus,
    departmentId?: string,
  ): Promise<EmployeeProfileDocument[]> {
    const filter: any = {};

    if (searchQuery) {
      filter.$or = [
        { employeeNumber: { $regex: searchQuery, $options: 'i' } },
        { firstName: { $regex: searchQuery, $options: 'i' } },
        { lastName: { $regex: searchQuery, $options: 'i' } },
        { workEmail: { $regex: searchQuery, $options: 'i' } },
      ];
    }

    if (status) {
      filter.status = status;
    }

    if (departmentId) {
      filter.primaryDepartmentId = departmentId;
    }

    return await this.employeeProfileModel
      .find(filter)
      .populate('primaryPositionId')
      .populate('primaryDepartmentId')
      .exec();
  }

  // Update employee master data (US-EP-04)
  async updateEmployeeMasterData(
    employeeId: string,
    userId: string,
    userRole: string,
    updateDto: UpdateEmployeeMasterDto,
  ): Promise<EmployeeProfileDocument> {
    // Verify user has permission
    if (
      ![SystemRole.HR_ADMIN, SystemRole.HR_MANAGER, SystemRole.SYSTEM_ADMIN].includes(
        userRole as SystemRole,
      )
    ) {
      throw new ForbiddenException('Insufficient permissions');
    }

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
    return updated;
  }

  // Deactivate employee or change status (US-EP-05)
  async deactivateEmployee(
    employeeId: string,
    userId: string,
    userRole: string,
    status: EmployeeStatus,
    effectiveDate?: Date,
  ): Promise<EmployeeProfileDocument> {
    // Verify user has permission
    if (
      ![SystemRole.HR_ADMIN, SystemRole.HR_MANAGER, SystemRole.SYSTEM_ADMIN].includes(
        userRole as SystemRole,
      )
    ) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const updated = await this.employeeProfileModel.findByIdAndUpdate(
      employeeId,
      {
        status,
        statusEffectiveFrom: effectiveDate || new Date(),
        lastModifiedBy: userId,
        lastModifiedAt: new Date(),
      },
      { new: true },
    );
    if (!updated) {
      throw new NotFoundException('Employee profile not found');
    }
    return updated;
  }
}
