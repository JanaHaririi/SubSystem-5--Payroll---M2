import { Injectable } from '@nestjs/common';
import { EmployeeCrudService } from './services/employee-crud.service';
import { EmployeeSelfServiceService } from './services/employee-self-service.service';
import { ChangeRequestService } from './services/change-request.service';
import { FileUploadService } from './services/file-upload.service';
import { HrAdminService } from './services/hr-admin.service';
import { EmployeeProfileDocument } from './models/employee-profile.schema';
import { EmployeeProfileChangeRequest } from './models/ep-change-request.schema';
import { UpdateContactInfoDto } from './dto/update-contact-info.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateChangeRequestDto } from './dto/create-change-request.dto';
import { ProcessChangeRequestDto } from './dto/process-change-request.dto';
import { UpdateEmployeeMasterDto } from './dto/update-employee-master.dto';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { EmployeeProfile } from './models/employee-profile.schema';
import { EmployeeStatus } from './enums/employee-profile.enums';

/**
 * Main orchestrator service for employee profile operations
 * Delegates to specialized services for better organization
 */
@Injectable()
export class EmployeeProfileService {
  constructor(
    private employeeCrudService: EmployeeCrudService,
    private employeeSelfServiceService: EmployeeSelfServiceService,
    private changeRequestService: ChangeRequestService,
    private fileUploadService: FileUploadService,
    private hrAdminService: HrAdminService,
  ) {}

  // ==================== BASIC CRUD (Delegated to EmployeeCrudService) ====================

  async create(employeeData: CreateEmployeeDto): Promise<EmployeeProfileDocument> {
    return this.employeeCrudService.create(employeeData);
  }

  async findAll(): Promise<EmployeeProfileDocument[]> {
    return this.employeeCrudService.findAll();
  }

  async findById(id: string): Promise<EmployeeProfileDocument> {
    return this.employeeCrudService.findById(id);
  }

  async update(id: string, updateData: Partial<EmployeeProfile>): Promise<EmployeeProfileDocument> {
    return this.employeeCrudService.update(id, updateData);
  }

  async delete(id: string): Promise<EmployeeProfileDocument> {
    return this.employeeCrudService.delete(id);
  }

  // ==================== SELF-SERVICE (Delegated to EmployeeSelfServiceService) ====================

  async getMyProfile(employeeId: string): Promise<any> {
    return this.employeeSelfServiceService.getMyProfile(employeeId);
  }

  async updateMyContactInfo(
    employeeId: string,
    userId: string,
    updateDto: UpdateContactInfoDto,
  ): Promise<EmployeeProfileDocument> {
    return this.employeeSelfServiceService.updateMyContactInfo(employeeId, userId, updateDto);
  }

  async updateMyProfile(
    employeeId: string,
    userId: string,
    updateDto: UpdateProfileDto,
  ): Promise<EmployeeProfileDocument> {
    return this.employeeSelfServiceService.updateMyProfile(employeeId, userId, updateDto);
  }

  async getTeamMembers(managerPositionId: string): Promise<EmployeeProfileDocument[]> {
    return this.employeeSelfServiceService.getTeamMembers(managerPositionId);
  }

  async getTeamMemberProfile(
    employeeId: string,
    managerPositionId: string,
  ): Promise<EmployeeProfileDocument> {
    return this.employeeSelfServiceService.getTeamMemberProfile(employeeId, managerPositionId);
  }

  // ==================== CHANGE REQUESTS (Delegated to ChangeRequestService) ====================

  async createChangeRequest(
    employeeId: string,
    userId: string,
    createDto: CreateChangeRequestDto,
  ): Promise<EmployeeProfileChangeRequest> {
    return this.changeRequestService.createChangeRequest(employeeId, userId, createDto);
  }

  async getMyChangeRequests(employeeId: string): Promise<EmployeeProfileChangeRequest[]> {
    return this.changeRequestService.getMyChangeRequests(employeeId);
  }

  async getPendingChangeRequests(): Promise<EmployeeProfileChangeRequest[]> {
    return this.changeRequestService.getPendingChangeRequests();
  }

  async getChangeRequestById(requestId: string): Promise<EmployeeProfileChangeRequest> {
    return this.changeRequestService.getChangeRequestById(requestId);
  }

  async processChangeRequest(
    requestId: string,
    userId: string,
    userRole: string,
    processDto: ProcessChangeRequestDto,
  ): Promise<EmployeeProfileChangeRequest> {
    return this.changeRequestService.processChangeRequest(requestId, userId, userRole, processDto);
  }

  // ==================== FILE OPERATIONS (Delegated to FileUploadService) ====================

  async saveFile(file: Express.Multer.File, employeeId: string): Promise<string> {
    return this.fileUploadService.saveFile(file, employeeId);
  }

  async getFile(filename: string): Promise<Buffer> {
    return this.fileUploadService.getFile(filename);
  }

  async deleteFile(filename: string): Promise<void> {
    return this.fileUploadService.deleteFile(filename);
  }

  // ==================== HR ADMIN OPERATIONS (Delegated to HrAdminService) ====================

  async searchEmployees(
    searchQuery: string,
    status?: EmployeeStatus,
    departmentId?: string,
  ): Promise<EmployeeProfileDocument[]> {
    return this.hrAdminService.searchEmployees(searchQuery, status, departmentId);
  }

  async updateEmployeeMasterData(
    employeeId: string,
    userId: string,
    userRole: string,
    updateDto: UpdateEmployeeMasterDto,
  ): Promise<EmployeeProfileDocument> {
    return this.hrAdminService.updateEmployeeMasterData(employeeId, userId, userRole, updateDto);
  }

  async deactivateEmployee(
    employeeId: string,
    userId: string,
    userRole: string,
    status: EmployeeStatus,
    effectiveDate?: Date,
  ): Promise<EmployeeProfileDocument> {
    return this.hrAdminService.deactivateEmployee(employeeId, userId, userRole, status, effectiveDate);
  }
}
