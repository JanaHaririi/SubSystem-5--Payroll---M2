import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EmployeeProfile, EmployeeProfileDocument } from '../models/employee-profile.schema';
import { UpdateEmployeeMasterDto } from '../dto/update-employee-master.dto';
import { SystemRole, EmployeeStatus } from '../enums/employee-profile.enums';
import { NotificationLogService } from '../../time-management/services/notification-log.service';

@Injectable()
export class HrAdminService {
  constructor(
    @InjectModel(EmployeeProfile.name)
    private employeeProfileModel: Model<EmployeeProfileDocument>,
    private notificationLogService: NotificationLogService,
  ) {}

  // Helper to resolve supervisorPositionId from organizational structure
  private async resolveSupervisorPositionId(primaryPositionId: any): Promise<Types.ObjectId | undefined> {
    if (!primaryPositionId) {
      console.warn("⚠️ No primaryPositionId provided — cannot resolve supervisor");
      return undefined;
    }

    console.log("🔍 Resolving supervisor for position:", primaryPositionId);

    const PositionModel = this.employeeProfileModel.db.model('Position');
    const position = await PositionModel.findById(primaryPositionId).exec();

    if (!position) {
      console.error("❌ Position not found:", primaryPositionId);
      return undefined;
    }

    console.log("🏷️ Loaded position:", position._id);
    console.log("📋 Position title:", position.title);
    console.log("⬆️ Position reportsToPositionId:", position.reportsToPositionId);

    if (!position.reportsToPositionId) {
      console.warn("⚠️ Position has no reportsToPositionId (department head or top-level position)");
      return undefined;
    }

    console.log("✅ supervisorPositionId resolved:", position.reportsToPositionId);
    return position.reportsToPositionId;
  }

  // ===============================================
  // Search employees (US-E6-03)
  // ===============================================
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

    // Fetch employees without populate first
    const employees = await this.employeeProfileModel.find(filter).exec();

    // Manually populate only valid ObjectIds (not empty strings)
    for (const emp of employees) {
      if (emp.primaryPositionId && emp.primaryPositionId.toString() !== '') {
        await emp.populate('primaryPositionId');
      }
      if (emp.primaryDepartmentId && emp.primaryDepartmentId.toString() !== '') {
        await emp.populate('primaryDepartmentId');
      }
    }

    return employees;
  }

  // ===============================================
  // Update employee master data (US-EP-04)
  // ===============================================
  async updateEmployeeMasterData(
    employeeId: string,
    userId: string,
    userRole: string,
    updateDto: UpdateEmployeeMasterDto,
  ): Promise<EmployeeProfileDocument> {
    if (
      ![
        SystemRole.HR_ADMIN,
        SystemRole.HR_MANAGER,
        SystemRole.SYSTEM_ADMIN,
      ].includes(userRole as SystemRole)
    ) {
      throw new ForbiddenException('Insufficient permissions');
    }

    console.log('🔍 Updating employee:', employeeId);
    console.log('📦 Update data received:', JSON.stringify(updateDto, null, 2));

    // 🔍 CRITICAL: Auto-resolve supervisorPositionId if primaryPositionId is being updated
    let supervisorPositionId: Types.ObjectId | undefined = undefined;
    if (updateDto.primaryPositionId) {
      console.log("👤 Updating employee primaryPositionId:", updateDto.primaryPositionId);
      console.log("📌 Employee primaryPositionId:", updateDto.primaryPositionId);
      supervisorPositionId = await this.resolveSupervisorPositionId(updateDto.primaryPositionId);
      if (supervisorPositionId) {
        console.log("✅ supervisorPositionId set:", supervisorPositionId);
      }
    }

    const updated = await this.employeeProfileModel.findByIdAndUpdate(
      employeeId,
      {
        ...updateDto,
        ...(supervisorPositionId && { supervisorPositionId }),
        lastModifiedBy: userId,
        lastModifiedAt: new Date(),
      },
      { new: true },
    );

    if (!updated) {
      throw new NotFoundException('Employee profile not found');
    }

    console.log('✅ Employee updated:', {
      id: updated._id,
      name: updated.fullName,
      primaryDepartmentId: updated.primaryDepartmentId,
      primaryPositionId: updated.primaryPositionId,
      supervisorPositionId: updated.supervisorPositionId,
    });

    // BR D4: Notify Payroll module if pay grade, contract type, or status changed
    if (updateDto.payGradeId || updateDto.contractType || updateDto.status) {
      console.log('📢 Pay grade/contract change detected - notifying Payroll module');
      // TODO: Implement payroll notification integration when Payroll module is ready
      // await this.payrollIntegrationService.notifyEmployeeDataChange(employeeId, updateDto);
    }

    // Send detailed notification to employee about the update (N-037)
    try {
      console.log(`📧 Preparing to send notification to employee ${employeeId}`);
      console.log(`📝 Update DTO:`, updateDto);

      // Build detailed message about what changed
      const changedFields: string[] = [];

      if (updateDto.payGradeId) changedFields.push('Pay Grade');
      if (updateDto.contractType) changedFields.push('Contract Type');
      if (updateDto.workType) changedFields.push('Work Type');
      if (updateDto.primaryDepartmentId) changedFields.push('Department');
      if (updateDto.primaryPositionId) changedFields.push('Position');
      if (updateDto.supervisorPositionId !== undefined) changedFields.push('Supervisor');
      if (updateDto.status) changedFields.push('Employment Status');
      if (updateDto.contractStartDate) changedFields.push('Contract Start Date');
      if (updateDto.contractEndDate) changedFields.push('Contract End Date');
      if (updateDto.dateOfHire) changedFields.push('Hire Date');
      if (updateDto.bankName || updateDto.bankAccountNumber) changedFields.push('Banking Information');
      if (updateDto.firstName || updateDto.lastName || updateDto.middleName) changedFields.push('Name');
      if (updateDto.workEmail || updateDto.personalEmail) changedFields.push('Email');
      if (updateDto.mobilePhone || updateDto.homePhone) changedFields.push('Phone Number');

      console.log(`🔍 Changed fields detected:`, changedFields);

      const changesMessage = changedFields.length > 0
        ? `The following information has been updated by HR: ${changedFields.join(', ')}.`
        : 'Your employment information has been updated by HR.';

      await this.notificationLogService.sendNotification({
        to: new Types.ObjectId(employeeId),
        type: 'N-037',
        message: `${changesMessage} Please review your profile for details.`,
      });

      console.log(`✅ Notification N-037 sent successfully to employee ${employeeId}`);
    } catch (error) {
      console.error('❌ Failed to send notification:', error);
      console.error('Error details:', error?.message || error);
    }

    return updated;
  }

  // ===============================================
  // Deactivate employee or change status (US-EP-05)
  // ===============================================
  async deactivateEmployee(
    employeeId: string,
    userId: string,
    userRole: string,
    status: EmployeeStatus,
    effectiveDate?: Date,
  ): Promise<EmployeeProfileDocument> {
    if (
      ![
        SystemRole.HR_ADMIN,
        SystemRole.HR_MANAGER,
        SystemRole.SYSTEM_ADMIN,
      ].includes(userRole as SystemRole)
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

    // BR D4: Notify Time Management and Payroll modules about status change
    console.log(`📢 Status change to ${status} - notifying Time Management and Payroll modules`);

    // Notify Time Management module for attendance tracking
    // Status changes (ON_LEAVE, SUSPENDED, TERMINATED) must sync to time tracking
    try {
      await this.notificationLogService.sendNotification({
        to: new Types.ObjectId(employeeId),
        type: 'N-037',
        message: `Your employment status has been changed to ${status}.`,
      });

      // TODO: Implement Time Management integration when module is ready
      // if (status === EmployeeStatus.ON_LEAVE || status === EmployeeStatus.SUSPENDED || status === EmployeeStatus.TERMINATED) {
      //   await this.timeManagementIntegrationService.notifyStatusChange(employeeId, status, effectiveDate);
      // }

      // TODO: Implement Payroll integration when module is ready
      // Blocked payments for SUSPENDED and TERMINATED employees
      // if (status === EmployeeStatus.SUSPENDED || status === EmployeeStatus.TERMINATED) {
      //   await this.payrollIntegrationService.blockPayments(employeeId, status, effectiveDate);
      // }
    } catch (error) {
      console.error('Failed to send status change notifications:', error);
    }

    return updated;
  }
}
