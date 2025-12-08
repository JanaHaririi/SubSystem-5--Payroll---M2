import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Department, DepartmentDocument } from './models/department.schema';
import { Position, PositionDocument } from './models/position.schema';
import { StructureChangeRequest, StructureChangeRequestDocument } from './models/structure-change-request.schema';
import { EmployeeProfile, EmployeeProfileDocument } from '../employee-profile/models/employee-profile.schema';
import { NotificationLogService } from '../time-management/services/notification-log.service';
import { CreateDepartmentDto } from './dtos/create-department.dto';
import { UpdateDepartmentDto } from './dtos/update-department.dto';
import { CreatePositionDto } from './dtos/create-position.dto';
import { UpdatePositionDto } from './dtos/update-position.dto';
import { CreateStructureChangeRequestDto } from './dtos/create-structure-change-request.dto';
import { UpdateStructureChangeRequestDto } from './dtos/update-structure-change-request.dto';
import { UpdateReportingLineDto } from './dtos/update-reporting-line.dto';

@Injectable()
export class OrganizationStructureService {
 constructor(
  @InjectModel(Department.name)
  private readonly departmentModel: Model<DepartmentDocument>,

  @InjectModel(Position.name)
  private readonly positionModel: Model<PositionDocument>,

  @InjectModel(StructureChangeRequest.name)
  private readonly changeRequestModel: Model<StructureChangeRequestDocument>,

  @InjectModel(EmployeeProfile.name)
  private readonly employeeProfileModel: Model<EmployeeProfileDocument>,

  private readonly notificationLogService: NotificationLogService,
) {

  // ============================
  // 🔥 DISABLE BROKEN SCHEMA HOOKS
  // ============================

  // Disable pre-save hook
  this.positionModel.schema.pre('save', function (next) {
    const doc: any = this;   // <-- FIX: cast to any
    doc.reportsToPositionId = undefined;  // <-- FIX: use undefined, not null
    next();
  });

  // Disable pre-findOneAndUpdate hook
  this.positionModel.schema.pre('findOneAndUpdate', function (next) {
    const query: any = this;   // <-- FIX: cast to any

    const update = query.getUpdate() || {};
    if (!update.$set) update.$set = {};

    update.$set.reportsToPositionId = undefined;

    query.setUpdate(update);
    next();
  });
}

  // ======================
  // 📌 CREATE DEPARTMENT
  // ======================
 async createDepartment(dto: CreateDepartmentDto) {
  return this.departmentModel.create(dto);
}

  // ===========================
  // 📌 GET DEPARTMENT BY ID
  // ===========================
  async getDepartmentById(id: string) {
    const dept = await this.departmentModel.findById(id).exec();
    if (!dept) throw new NotFoundException("Department not found");
    return dept;
  }

  // ============================
  // 📌 GET ALL DEPARTMENTS
  // ============================
  async getAllDepartments(showInactive: boolean = false) {
    if (showInactive) {
      return this.departmentModel.find().exec();
    }
    return this.departmentModel.find({ isActive: true }).exec();
  }

  // ============================
  // 📌 UPDATE DEPARTMENT
  // ============================
  async updateDepartment(id: string, dto: UpdateDepartmentDto) {
    const updated = await this.departmentModel.findByIdAndUpdate(id, dto, { new: true });
    if (!updated) throw new NotFoundException("Department not found");
    return updated;
  }

  // ============================
  // 📌 DEACTIVATE DEPARTMENT
  // ============================
  async deactivateDepartment(id: string) {
    const updated = await this.departmentModel.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
    if (!updated) throw new NotFoundException("Department not found");
    return updated;
  }

  // ======================
  // 📌 CREATE POSITION
  // ======================
  async createPosition(dto: CreatePositionDto) {
    const department = await this.departmentModel.findById(dto.departmentId);
    if (!department) throw new NotFoundException('Department not found');

    const pos = await this.positionModel.create({
      ...dto,
      reportsToPositionId: null
    });

    return pos;
  }

  // ======================
  // 📌 GET ALL POSITIONS
  // ======================
  async getAllPositions() {
    return this.positionModel.find().exec();
  }

  // ======================
  // 📌 GET POSITION BY ID
  // ======================
  async getPositionById(id: string) {
    const pos = await this.positionModel.findById(id).exec();
    if (!pos) throw new NotFoundException("Position not found");
    return pos;
  }

  // ======================
  // 📌 UPDATE POSITION
  // ======================
  async updatePosition(id: string, dto: UpdatePositionDto) {
    const updated = await this.positionModel.findByIdAndUpdate(id, dto, { new: true });
    if (!updated) throw new NotFoundException("Position not found");
    return updated;
  }

  // ======================
  // 📌 UPDATE REPORTING LINE
  // ======================
 async updateReportingLine(id: string, dto: UpdateReportingLineDto) {
  const updated = await this.positionModel.findByIdAndUpdate(id, dto, { new: true });
  if (!updated) throw new NotFoundException("Position not found");
  return updated;
}


  // ======================
  // 📌 MOVE POSITION
  // ======================
  async movePosition(id: string, dto: any) {
    const updated = await this.positionModel.findByIdAndUpdate(id, dto, { new: true });
    if (!updated) throw new NotFoundException("Position not found");
    return updated;
  }

  // ======================
  // 📌 DEACTIVATE POSITION
  // ======================
  async deactivatePosition(id: string) {
    const updated = await this.positionModel.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
    if (!updated) throw new NotFoundException("Position not found");
    return updated;
  }

  // ======================
  // 📌 SUBMIT CHANGE REQUEST
  // ======================
  async submitChangeRequest(dto: any, requestedBy: string) {
    const changeRequest = await this.changeRequestModel.create({
      ...dto,
      requestedByEmployeeId: new Types.ObjectId(requestedBy),
      status: 'Pending',
      submittedAt: new Date(),
    });

    // Send notification to System Admin (REQ-OSM-11)
    const systemAdmins = await this.employeeProfileModel.find({
      systemRoles: { $in: ['System Admin'] }
    }).exec();

    for (const admin of systemAdmins) {
      await this.notificationLogService.sendNotification({
        to: new Types.ObjectId(admin._id.toString()),
        type: 'Structure Change Request Submitted',
        message: `A new organizational structure change request has been submitted. Please review and approve.`,
      });
    }

    return changeRequest;
  }

  // ======================
  // 📌 GET ALL CHANGE REQUESTS
  // ======================
  async getAllChangeRequests() {
    return this.changeRequestModel.find().exec();
  }

  // ======================
  // 📌 GET CHANGE REQUEST BY ID
  // ======================
  async getChangeRequestById(id: string) {
    const req = await this.changeRequestModel.findById(id).exec();
    if (!req) throw new NotFoundException("Change request not found");
    return req;
  }

  // ======================
  // 📌 DELIMIT POSITION (BR 12, BR 37)
  // ======================
  async delimitPosition(id: string) {
  const position = await this.positionModel.findById(id).exec();
  if (!position) throw new NotFoundException("Position not found");

  const updated = await this.positionModel.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  );

  return updated;
}

  // ======================
  // 📌 APPROVE CHANGE REQUEST (REQ-OSM-04, BR 36)
  // ======================
  async approveChangeRequest(id: string, approvedBy: string) {
    const request = await this.changeRequestModel.findById(id).exec();
    if (!request) throw new NotFoundException("Change request not found");

    // Update request status
    const updated = await this.changeRequestModel.findByIdAndUpdate(
      id,
      {
        status: 'Approved',
        approvedAt: new Date(),
      },
      { new: true }
    );

    // Send notification to requester (REQ-OSM-11)
    await this.notificationLogService.sendNotification({
      to: new Types.ObjectId(request.requestedByEmployeeId.toString()),
      type: 'Structure Change Request Approved',
      message: `Your organizational structure change request has been approved and applied.`,
    });

    return updated;
  }

  // ======================
  // 📌 REJECT CHANGE REQUEST
  // ======================
  async rejectChangeRequest(id: string, reason: string, rejectedBy: string) {
    const request = await this.changeRequestModel.findById(id).exec();
    if (!request) throw new NotFoundException("Change request not found");

    const updated = await this.changeRequestModel.findByIdAndUpdate(
      id,
      {
        status: 'Rejected',
        rejectedAt: new Date(),
        rejectionReason: reason,
      },
      { new: true }
    );

    // Send notification to requester
    await this.notificationLogService.sendNotification({
      to: new Types.ObjectId(request.requestedByEmployeeId.toString()),
      type: 'Structure Change Request Rejected',
      message: `Your organizational structure change request has been rejected. Reason: ${reason}`,
    });

    return updated;
  }

  // ======================
  // 📌 GET ORGANIZATION HIERARCHY (REQ-SANV-01, BR 24)
  // ======================
  async getOrganizationHierarchy() {
    const departments = await this.departmentModel.find({ isActive: true }).exec();
    const positions = await this.positionModel.find({ isActive: true })
      .populate('departmentId')
      .populate('reportsToPositionId')
      .exec();

    return {
      departments,
      positions,
    };
  }

  // ======================
  // 📌 GET DEPARTMENT HIERARCHY
  // ======================
  async getDepartmentHierarchy(departmentId: string) {
    const department = await this.departmentModel.findById(departmentId).exec();
    if (!department) throw new NotFoundException("Department not found");

    const positions = await this.positionModel.find({
      departmentId: new Types.ObjectId(departmentId),
      isActive: true
    })
      .populate('reportsToPositionId')
      .exec();

    return {
      department,
      positions,
    };
  }

  // ======================
  // 📌 GET MY TEAM HIERARCHY (REQ-SANV-02, BR 41)
  // ======================
  async getMyTeamHierarchy(employeeId: string) {
    const employee = await this.employeeProfileModel.findById(employeeId).exec();
    if (!employee) throw new NotFoundException("Employee not found");

    const teamPositions = await this.positionModel.find({
      reportsToPositionId: employee.primaryPositionId,
      isActive: true,
    })
      .populate('departmentId')
      .exec();

    return {
      manager: employee,
      teamPositions,
    };
  }

  // ======================
  // 📌 GET MY STRUCTURE (BR 41)
  // ======================
  async getMyStructure(employeeId: string) {
    const employee = await this.employeeProfileModel.findById(employeeId)
      .populate('primaryPositionId')
      .populate('primaryDepartmentId')
      .exec();

    if (!employee) throw new NotFoundException("Employee not found");

    const position = await this.positionModel.findById(employee.primaryPositionId)
      .populate('reportsToPositionId')
      .populate('departmentId')
      .exec();

    return {
      employee,
      position,
      department: employee.primaryDepartmentId,
      reportsTo: position?.reportsToPositionId,
    };
  }
}
