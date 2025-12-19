import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
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

 // ============================
// ✅ SAFE pre-save hook
// ============================
this.positionModel.schema.pre('save', function (next) {
  const doc: any = this;

  // 🔑 Only normalize NULL → undefined
  // ❌ Do NOT override a real value
  if (doc.reportsToPositionId === null) {
    doc.reportsToPositionId = undefined;
  }

  next();
});


// ============================
// ✅ SAFE pre-findOneAndUpdate hook
// ============================
this.positionModel.schema.pre('findOneAndUpdate', function (next) {
  const query: any = this;

  const update = query.getUpdate() || {};

  if (update.$set && update.$set.reportsToPositionId === null) {
    update.$set.reportsToPositionId = undefined;
  }

  query.setUpdate(update);
  next();
});

}

  // ======================
  // 📌 CREATE DEPARTMENT
  // ======================
async createDepartment(dto: CreateDepartmentDto) {
  console.log('📁 Creating department');
  console.log('🧩 Create params:', dto);

  // Validate headPositionId if provided
  if (dto.headPositionId) {
    if (!Types.ObjectId.isValid(dto.headPositionId)) {
      console.error('❌ INVALID headPositionId — must be a valid Position ObjectId');
      throw new BadRequestException('headPositionId must be a valid Position ObjectId');
    }

    // Verify the position exists
    const position = await this.positionModel.findById(dto.headPositionId);
    if (!position) {
      console.error('❌ ERROR: Position not found');
      throw new BadRequestException('Position not found');
    }
    console.log('✅ Head position validated:', position.title);
  }

  const department = await this.departmentModel.create({
    code: dto.code,
    name: dto.name,
    description: dto.description,
    headPositionId: dto.headPositionId ? new Types.ObjectId(dto.headPositionId) : undefined,
    isActive: dto.isActive ?? true,
  });

  console.log('✅ Department created:', department._id);
  return department;
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
    console.log('📝 Updating department:', id);
    console.log('🧩 Update params:', dto);

    // 🚨 CRITICAL DTO VALIDATION
    if ((dto as any).headEmployeeNumber) {
      console.error('❌ INVALID DTO FIELD — Department head must be a Position');
      console.error('   Received headEmployeeNumber:', (dto as any).headEmployeeNumber);
      console.error('   Department head is ALWAYS a Position, not an employee');
      throw new BadRequestException('Invalid field: headEmployeeNumber. Use headPositionId instead.');
    }

    // Validate headPositionId if provided
    if (dto.headPositionId && !Types.ObjectId.isValid(dto.headPositionId)) {
      console.error('❌ INVALID headPositionId — must be a valid Position ObjectId');
      throw new BadRequestException('headPositionId must be a valid Position ObjectId');
    }

    const updated = await this.departmentModel.findByIdAndUpdate(id, dto, { new: true });
    if (!updated) {
      console.error('❌ ERROR: Department not found');
      throw new NotFoundException("Department not found");
    }

    console.log('✅ Department updated:', updated._id);
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
  // ============================
// 📌 ACTIVATE DEPARTMENT
// ============================
async activateDepartment(id: string) {
  const updated = await this.departmentModel.findByIdAndUpdate(
    id,
    { isActive: true },
    { new: true }
  );

  if (!updated) {
    throw new NotFoundException("Department not found");
  }

  return updated;
}

  // ======================
  // 📌 CREATE POSITION
  // ======================
  async createPosition(dto: CreatePositionDto) {
  const department = await this.departmentModel.findById(dto.departmentId);
  if (!department) {
    throw new NotFoundException('Department not found');
  }

  // 🔑 THIS IS THE KEY LINE
  const reportsToPositionId = department.headPositionId ?? undefined;

  const position = await this.positionModel.create({
    ...dto,
    reportsToPositionId,
  });

  return position;
}

  // ======================
  // 📌 GET ALL POSITIONS
  // ======================
  async getAllPositions() {
    return this.positionModel.find().populate('departmentId', 'name code').exec();
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
// 📌 ACTIVATE POSITION
// ======================
async activatePosition(id: string) {
  const updated = await this.positionModel.findByIdAndUpdate(
    id,
    { isActive: true },
    { new: true }
  );

  if (!updated) throw new NotFoundException("Position not found");
  return updated;
}

  // ======================
  // 📌 SUBMIT CHANGE REQUEST
  // ======================
  async submitChangeRequest(dto: any, requestedBy: string) {
    try {
      console.log('📨 Structure change request submitted by manager');
      console.log('📝 Submitting change request:', { dto, requestedBy });
      console.log('🧩 Request params:', { requestType: dto.requestType, targetDepartmentId: dto.targetDepartmentId, targetPositionId: dto.targetPositionId });

      // Generate unique request number
      const requestNumber = `CR-${Date.now()}-${requestedBy.slice(-6)}`;

      // Create change request with explicit fields (don't spread dto to avoid _id conflicts)
      const changeRequest = await this.changeRequestModel.create({
        requestNumber,
        requestedByEmployeeId: new Types.ObjectId(requestedBy),
        requestType: dto.requestType,
        targetDepartmentId: dto.targetDepartmentId ? new Types.ObjectId(dto.targetDepartmentId) : undefined,
        targetPositionId: dto.targetPositionId ? new Types.ObjectId(dto.targetPositionId) : undefined,
        details: dto.details,
        reason: dto.reason,
        status: 'SUBMITTED',
        submittedAt: new Date(),
      });

      console.log('✅ Change request created:', changeRequest._id);
      console.log('🛂 Request awaiting SYSTEM_ADMIN approval');
      console.log('⚠️ Managers CANNOT approve — only SYSTEM_ADMIN can approve structure changes');

      // Send notification to System Admin (REQ-OSM-11)
      try {
        const systemAdmins = await this.employeeProfileModel.find({
          systemRoles: { $in: ['System Admin'] }
        }).exec();

        console.log(`📧 Sending notifications to ${systemAdmins.length} System Admins`);

        for (const admin of systemAdmins) {
          await this.notificationLogService.sendNotification({
            to: new Types.ObjectId(admin._id.toString()),
            type: 'Structure Change Request Submitted',
            message: `A new organizational structure change request has been submitted. Please review and approve.`,
          });
        }
      } catch (notifError) {
        console.error('⚠️ Notification failed (non-critical):', notifError.message);
        // Don't fail the request if notification fails
      }

      return changeRequest;
    } catch (error) {
      console.error('❌ submitChangeRequest error:', error.message);
      console.error('❌ STACK:', error.stack);
      console.error('❌ FULL ERROR OBJ:', error);
      throw error;
    }
  }

  // ======================
  // 📌 GET ALL CHANGE REQUESTS (Admin only)
  // ======================
  async getAllChangeRequests() {
    console.log('📋 Fetching all change requests (SYSTEM_ADMIN only)');
    console.log('🧩 Query params: all requests');

    const requests = await this.changeRequestModel
      .find()
      .populate('requestedByEmployeeId', 'firstName lastName fullName employeeNumber')
      .sort({ submittedAt: -1 })
      .exec();

    console.log('📦 Result count:', requests.length);
    if (requests.length > 0) {
      console.log('📦 Sample result:', {
        id: requests[0]._id,
        requestType: requests[0].requestType,
        status: requests[0].status,
        submittedBy: requests[0].requestedByEmployeeId
      });
    } else {
      console.warn('⚠️ No change requests found');
    }

    console.log('✅ Change requests response sent');
    return requests;
  }

  // ======================
  // 📌 GET MY CHANGE REQUESTS (Manager)
  // ======================
  async getMyChangeRequests(employeeId: string) {
    console.log('📋 Fetching change requests for specific user');
    console.log('👤 Requesting user:', employeeId);
    console.log('🧩 Query params:', { requestedByEmployeeId: employeeId });

    const requests = await this.changeRequestModel
      .find({ requestedByEmployeeId: new Types.ObjectId(employeeId) })
      .populate('requestedByEmployeeId', 'firstName lastName fullName employeeNumber')
      .sort({ submittedAt: -1 })
      .exec();

    console.log('📦 Result count:', requests.length);
    if (requests.length > 0) {
      console.log('📦 Sample result:', {
        id: requests[0]._id,
        requestType: requests[0].requestType,
        status: requests[0].status,
        submittedBy: requests[0].requestedByEmployeeId
      });
    } else {
      console.warn('⚠️ No change requests found for this user');
    }

    console.log('✅ My change requests response sent');
    return requests;
  }

  // ======================
  // 📌 GET CHANGE REQUEST BY ID
  // ======================
  async getChangeRequestById(id: string, requestingUserId?: string, userRoles?: string[]) {
    console.log('🔍 Fetching change request by ID');
    console.log('📋 Request ID:', id);
    console.log('👤 Requesting user:', requestingUserId);
    console.log('🎭 User roles:', userRoles);

    // Try to convert to ObjectId if it's a valid hex string
    let objectId: Types.ObjectId;
    try {
      objectId = new Types.ObjectId(id);
      console.log('✅ Converted to ObjectId:', objectId);
    } catch (error) {
      console.error('❌ ERROR: Invalid ObjectId format');
      throw new BadRequestException("Invalid change request ID format");
    }

    const req = await this.changeRequestModel
      .findOne({ _id: objectId })
      .populate('requestedByEmployeeId', 'firstName lastName fullName employeeNumber')
      .exec();

    if (!req) {
      console.error('❌ ERROR: Change request not found');
      throw new NotFoundException("Change request not found");
    }

    console.log('📦 Change request found');
    console.log('👤 Request submitted by:', req.requestedByEmployeeId);

    // Check authorization: System Admin can see all, others can only see their own
    if (requestingUserId && userRoles) {
      const normalizedRoles = userRoles.map(r => r.toUpperCase().replace(/\s+/g, "_"));
      console.log('🎭 Normalized roles:', normalizedRoles);

      const isSystemAdmin = normalizedRoles.includes('SYSTEM_ADMIN');
      const isOwnRequest = req.requestedByEmployeeId._id.toString() === requestingUserId;

      console.log('🔐 Authorization check:');
      console.log('   Is System Admin?', isSystemAdmin);
      console.log('   Is own request?', isOwnRequest);

      if (!isSystemAdmin && !isOwnRequest) {
        console.error('❌ FORBIDDEN: User is not System Admin and not the requester');
        throw new ForbiddenException("You can only view your own change requests");
      }

      console.log('✅ Authorization passed');
    }

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
    console.log('✅ SYSTEM_ADMIN approving change request');
    console.log('📋 Request ID:', id);
    console.log('👤 Approved by:', approvedBy);

    // Convert to ObjectId
    let objectId: Types.ObjectId;
    try {
      objectId = new Types.ObjectId(id);
    } catch (error) {
      console.error('❌ ERROR: Invalid ObjectId format');
      throw new BadRequestException("Invalid change request ID format");
    }

    const request = await this.changeRequestModel.findOne({ _id: objectId }).exec();
    if (!request) {
      console.error('❌ ERROR: Change request not found');
      throw new NotFoundException("Change request not found");
    }

    console.log('📝 Request type:', request.requestType);
    console.log('👤 Requested by:', request.requestedByEmployeeId);
    console.log('⚠️ Only SYSTEM_ADMIN can approve — enforced by controller @Roles guard');

    // Update request status
    const updated = await this.changeRequestModel.findOneAndUpdate(
      { _id: objectId },
      {
        status: 'APPROVED', //fixed
        approvedAt: new Date(),
      },
      { new: true }
    );

    console.log('✅ Change request approved');

    // Send notification to requester (REQ-OSM-11)
    await this.notificationLogService.sendNotification({
      to: new Types.ObjectId(request.requestedByEmployeeId.toString()),
      type: 'Structure Change Request Approved',
      message: `Your organizational structure change request has been approved and applied.`,
    });

    console.log('📧 Notification sent to requester');

    return updated;
  }

  // ======================
  // 📌 REJECT CHANGE REQUEST
  // ======================
  async rejectChangeRequest(id: string, reason: string, rejectedBy: string) {
    // Convert to ObjectId
    let objectId: Types.ObjectId;
    try {
      objectId = new Types.ObjectId(id);
    } catch (error) {
      throw new BadRequestException("Invalid change request ID format");
    }

    const request = await this.changeRequestModel.findOne({ _id: objectId }).exec();
    if (!request) throw new NotFoundException("Change request not found");

    const updated = await this.changeRequestModel.findOneAndUpdate(
      { _id: objectId },
      {
        status: 'REJECTED',
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
    console.log("➡️ Endpoint called: getOrganizationHierarchy");
    console.log("🧩 Query params:", { isActive: true });

    const departments = await this.departmentModel.find({ isActive: true }).exec();
    console.log("📦 Result count:", departments.length);
    console.log("📁 Departments found:", departments.length);
    if (departments.length > 0) {
      console.log("📦 Sample result:", departments[0]);

      // 🚨 CRITICAL DATA VALIDATION
      departments.forEach(dept => {
        if (dept.headPositionId) {
          // Check if it's a placeholder string
          const headPosStr = dept.headPositionId.toString();
          if (headPosStr.includes('PUT_A_VALID') || headPosStr.includes('PLACEHOLDER')) {
            console.error("❌ INVALID DATA: Department.headPositionId is a placeholder string");
            console.error("   Department:", dept.name, "has invalid headPositionId:", headPosStr);
          }
          // Check if it's a valid ObjectId format
          if (!Types.ObjectId.isValid(dept.headPositionId)) {
            console.error("❌ INVALID headPositionId — must be a Position _id");
            console.error("   Department:", dept.name, "has invalid headPositionId:", dept.headPositionId);
          }
        }
      });
    }

    const positions = await this.positionModel.find({ isActive: true })
      .populate('departmentId')
      //.populate('reportsToPositionId')
      .exec();

    console.log("📦 Result count:", positions.length);
    console.log("🏷️ Positions found:", positions.length);
    if (positions.length > 0) {
      console.log("📦 Sample result:", positions[0]);
    }

    console.log("🔗 Fetching employees with populated primaryPositionId");

    // Fetch ALL employees who have a primaryPositionId (regardless of status)
    // This ensures we show employees in positions, even if they're on leave, probation, etc.
    const employees = await this.employeeProfileModel
      .find({
        primaryPositionId: { $exists: true, $ne: null }
      })
      .select('_id firstName lastName employeeNumber primaryPositionId')
      .populate('primaryPositionId')
      .exec();

    console.log("👥 Total employees with positions found:", employees.length);

    // Transform to plain objects with populated position data
    const populatedEmployees = employees.map(emp => ({
      _id: emp._id,
      firstName: emp.firstName,
      lastName: emp.lastName,
      employeeNumber: emp.employeeNumber,
      primaryPositionId: emp.primaryPositionId,
    }));

    if (populatedEmployees.length > 0) {
      console.log("📦 Sample employee:", {
        employeeNumber: populatedEmployees[0].employeeNumber,
        name: `${populatedEmployees[0].firstName} ${populatedEmployees[0].lastName}`,
        primaryPositionId: (populatedEmployees[0].primaryPositionId as any)?._id || populatedEmployees[0].primaryPositionId,
      });
    } else {
      console.warn("⚠️ WARNING: No employees with primaryPositionId found!");
    }

    return {
      departments,
      positions,
      employees: populatedEmployees,
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
  console.log("➡️ getMyStructure called");
  console.log("👤 Employee ID:", employeeId);
  console.log("🔒 Employee restricted to own reporting line");

  const employee = await this.employeeProfileModel.findById(employeeId)
    .populate('primaryPositionId')
    .populate('primaryDepartmentId')
    .exec();

  if (!employee) {
    console.error("❌ ERROR: Employee not found");
    throw new NotFoundException("Employee not found");
  }

  console.log("👤 Employee:", employee.fullName);
  console.log("📌 Employee primaryPositionId:", employee.primaryPositionId);
  console.log("📌 Employee primaryDepartmentId:", employee.primaryDepartmentId);

  // Cast to any to avoid TypeScript errors with populated documents
  const employeeDoc = employee as any;

  // Find the position with proper type handling
  const position = await this.positionModel.findById(employeeDoc.primaryPositionId)
    .populate('reportsToPositionId')
    .populate('departmentId')
    .exec();

  console.log("🏷️ Position:", position?.title);
  console.log("🔗 Reports to:", position?.reportsToPositionId);

  // Find the employee who holds the head position (reportsTo position)
  let headEmployee: EmployeeProfileDocument | null = null;
  if (position?.reportsToPositionId) {
    const reportsTo = position.reportsToPositionId as any;
    const headPositionId = reportsTo._id || position.reportsToPositionId;
    
    headEmployee = await this.employeeProfileModel.findOne({
      primaryPositionId: headPositionId
    }).exec();
    
    console.log("👔 Head position employee:", headEmployee?.fullName);
  }

  // Find colleagues who report to the same head position
  let colleagues: EmployeeProfileDocument[] = [];
  if (position?.reportsToPositionId) {
    const reportsTo = position.reportsToPositionId as any;
    const headPositionId = reportsTo._id || position.reportsToPositionId;
    
    // Find all positions that report to the same head position
    const peerPositions = await this.positionModel.find({
      reportsToPositionId: headPositionId,
      _id: { $ne: employeeDoc.primaryPositionId } // Exclude the current employee's position
    }).exec();

    // Find employees in those peer positions
    const peerPositionIds = peerPositions.map(p => p._id);
    colleagues = await this.employeeProfileModel.find({
      primaryPositionId: { $in: peerPositionIds }
    }).populate('primaryPositionId').exec();

    console.log("👥 Found colleagues:", colleagues.length);
  }

  return {
    employee,
    position,
    department: employee.primaryDepartmentId,
    reportsTo: position?.reportsToPositionId,
    headEmployee, // Employee who holds the head position
    colleagues, // Colleagues under the same head position
  };
}
}