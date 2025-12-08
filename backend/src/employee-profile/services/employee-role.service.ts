import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, isValidObjectId } from 'mongoose';
import {
  EmployeeSystemRole,
  EmployeeSystemRoleDocument,
} from '../models/employee-system-role.schema';
import { EmployeeProfile } from '../models/employee-profile.schema';
import { AssignRoleDto } from '../dto/assign-role.dto';
import { SystemRole } from '../enums/employee-profile.enums';

@Injectable()
export class EmployeeRoleService {
  constructor(
    @InjectModel(EmployeeSystemRole.name)
    private employeeRoleModel: Model<EmployeeSystemRoleDocument>,
    @InjectModel(EmployeeProfile.name)
    private employeeProfileModel: Model<EmployeeProfile>,
  ) {}

  /**
   * Fix: Resolve employeeId.
   * Accepts both ObjectId or employeeNumber.
   */
  private async resolveEmployeeId(employeeId: string): Promise<string> {
    // If it's already a valid ObjectId → return it
    if (isValidObjectId(employeeId)) {
      return employeeId;
    }

    // If it's NOT an ObjectId, maybe it's employeeNumber
    const employee = await this.employeeProfileModel.findOne({
      employeeNumber: employeeId,
    });

    if (!employee) {
      throw new BadRequestException(
        `Invalid employee identifier: ${employeeId}`,
      );
    }

    return employee._id.toString();
  }

  // ==================== ROLE MANAGEMENT OPERATIONS ====================

  async assignRolesToEmployee(
    employeeId: string,
    assignRoleDto: AssignRoleDto,
    assignedBy: string,
    assignerRole: string,
  ): Promise<EmployeeSystemRoleDocument> {
    // Permission check
    if (
      ![SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN].includes(
        assignerRole as SystemRole,
      )
    ) {
      throw new ForbiddenException(
        'Insufficient permissions to assign roles',
      );
    }

    // Resolve ID safely
    const resolvedId = await this.resolveEmployeeId(employeeId);

    // Verify employee exists
    const employee = await this.employeeProfileModel.findById(resolvedId);
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // Check role assignment
    let roleAssignment = await this.employeeRoleModel.findOne({
      employeeProfileId: resolvedId,
    });

    if (roleAssignment) {
      roleAssignment.roles = assignRoleDto.roles;
      roleAssignment.permissions = assignRoleDto.permissions || [];
      roleAssignment.isActive =
        assignRoleDto.isActive ?? true;
      await roleAssignment.save();
    } else {
      roleAssignment = new this.employeeRoleModel({
        employeeProfileId: resolvedId,
        roles: assignRoleDto.roles,
        permissions: assignRoleDto.permissions || [],
        isActive: assignRoleDto.isActive ?? true,
      });
      await roleAssignment.save();

      await this.employeeProfileModel.findByIdAndUpdate(resolvedId, {
        accessProfileId: roleAssignment._id,
      });
    }

    return roleAssignment;
  }

  async getEmployeeRoles(
    employeeId: string,
  ): Promise<EmployeeSystemRoleDocument> {
    const resolvedId = await this.resolveEmployeeId(employeeId);

    // Try both string and ObjectId formats to find the role assignment
    const roleAssignment = await this.employeeRoleModel
      .findOne({
        $or: [
          { employeeProfileId: resolvedId },
          { employeeProfileId: new Types.ObjectId(resolvedId) }
        ]
      })
      .populate('employeeProfileId');

    if (!roleAssignment) {
      throw new NotFoundException(
        'No role assignment found for this employee',
      );
    }

    return roleAssignment;
  }

  async getEmployeesByRole(
    role: SystemRole,
  ): Promise<EmployeeSystemRoleDocument[]> {
    return this.employeeRoleModel
      .find({ roles: role, isActive: true })
      .populate('employeeProfileId')
      .exec();
  }

  async removeRolesFromEmployee(
    employeeId: string,
    removedBy: string,
    removerRole: string,
  ): Promise<EmployeeSystemRoleDocument> {
    if (
      ![SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN].includes(
        removerRole as SystemRole,
      )
    ) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const resolvedId = await this.resolveEmployeeId(employeeId);

    const roleAssignment = await this.employeeRoleModel.findOne({
      employeeProfileId: resolvedId,
    });

    if (!roleAssignment) {
      throw new NotFoundException('Role assignment not found');
    }

    roleAssignment.isActive = false;
    await roleAssignment.save();

    return roleAssignment;
  }

  async addPermissionToEmployee(
    employeeId: string,
    permission: string,
    assignedBy: string,
    assignerRole: string,
  ): Promise<EmployeeSystemRoleDocument> {
    if (
      ![SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN].includes(
        assignerRole as SystemRole,
      )
    ) {
      throw new ForbiddenException('Not allowed');
    }

    const resolvedId = await this.resolveEmployeeId(employeeId);

    const roleAssignment = await this.employeeRoleModel.findOne({
      employeeProfileId: resolvedId,
    });

    if (!roleAssignment) {
      throw new NotFoundException('Role assignment not found');
    }

    if (roleAssignment.permissions.includes(permission)) {
      throw new ConflictException('Permission already exists');
    }

    roleAssignment.permissions.push(permission);
    await roleAssignment.save();

    return roleAssignment;
  }

  async removePermissionFromEmployee(
    employeeId: string,
    permission: string,
    removedBy: string,
    removerRole: string,
  ): Promise<EmployeeSystemRoleDocument> {
    if (
      ![SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN].includes(
        removerRole as SystemRole,
      )
    ) {
      throw new ForbiddenException('Not allowed');
    }

    const resolvedId = await this.resolveEmployeeId(employeeId);

    const roleAssignment = await this.employeeRoleModel.findOne({
      employeeProfileId: resolvedId,
    });

    if (!roleAssignment) {
      throw new NotFoundException('Role assignment not found');
    }

    roleAssignment.permissions = roleAssignment.permissions.filter(
      (p) => p !== permission,
    );
    await roleAssignment.save();

    return roleAssignment;
  }

  async getAllRoleAssignments(
    userRole: string,
  ): Promise<EmployeeSystemRoleDocument[]> {
    if (
      ![
        SystemRole.HR_ADMIN,
        SystemRole.HR_MANAGER,
        SystemRole.SYSTEM_ADMIN,
      ].includes(userRole as SystemRole)
    ) {
      throw new ForbiddenException('Not allowed');
    }

    return this.employeeRoleModel
      .find()
      .populate('employeeProfileId')
      .exec();
  }
}
