import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OrganizationStructureService } from './organization-structure.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserData } from '../auth/decorators/current-user.decorator';
import { SystemRole } from '../employee-profile/enums/employee-profile.enums';

// Department DTOs
import { CreateDepartmentDto } from './dtos/create-department.dto';
import { UpdateDepartmentDto } from './dtos/update-department.dto';

@Controller('organization-structure')
@UseGuards(AuthGuard, RolesGuard)
export class OrganizationStructureController {
  constructor(
    private readonly organizationStructureService: OrganizationStructureService,
  ) {}

  // ======================
  // 📌 DEPARTMENTS
  // ======================

  @Post('departments')
  @Roles(SystemRole.SYSTEM_ADMIN)
  createDepartment(@Body() dto: CreateDepartmentDto) {
    return this.organizationStructureService.createDepartment(dto);
  }

  @Get('departments')
  @Roles(SystemRole.SYSTEM_ADMIN, SystemRole.HR_ADMIN, SystemRole.HR_MANAGER, SystemRole.DEPARTMENT_HEAD, SystemRole.DEPARTMENT_EMPLOYEE)
  getAllDepartments(@Query('includeInactive') includeInactive?: string) {
    const showInactive = includeInactive === 'true';
    return this.organizationStructureService.getAllDepartments(showInactive);
  }

  @Get('departments/:id')
  @Roles(SystemRole.SYSTEM_ADMIN, SystemRole.HR_ADMIN, SystemRole.HR_MANAGER, SystemRole.DEPARTMENT_HEAD, SystemRole.DEPARTMENT_EMPLOYEE)
  getDepartmentById(@Param('id') id: string) {
    return this.organizationStructureService.getDepartmentById(id);
  }

  @Put('departments/:id')
  @Roles(SystemRole.SYSTEM_ADMIN)
  updateDepartment(
    @Param('id') id: string,
    @Body() dto: UpdateDepartmentDto,
  ) {
    return this.organizationStructureService.updateDepartment(id, dto);
  }

  @Patch('departments/:id/deactivate')
  @Roles(SystemRole.SYSTEM_ADMIN)
  deactivateDepartment(@Param('id') id: string) {
    return this.organizationStructureService.deactivateDepartment(id);
  }

  // ======================
  // 📌 POSITIONS
  // ======================

  @Post('positions')
  @Roles(SystemRole.SYSTEM_ADMIN)
  createPosition(@Body() dto: any) {
    return this.organizationStructureService.createPosition(dto);
  }

  @Get('positions')
  @Roles(SystemRole.SYSTEM_ADMIN, SystemRole.HR_ADMIN, SystemRole.HR_MANAGER, SystemRole.DEPARTMENT_HEAD)
  getAllPositions() {
    return this.organizationStructureService.getAllPositions();
  }

  @Get('positions/:id')
  @Roles(SystemRole.SYSTEM_ADMIN, SystemRole.HR_ADMIN, SystemRole.HR_MANAGER, SystemRole.DEPARTMENT_HEAD)
  getPositionById(@Param('id') id: string) {
    return this.organizationStructureService.getPositionById(id);
  }

  @Put('positions/:id')
  @Roles(SystemRole.SYSTEM_ADMIN)
  updatePosition(@Param('id') id: string, @Body() dto: any) {
    return this.organizationStructureService.updatePosition(id, dto);
  }

  @Put('positions/:id/reporting-line')
  @Roles(SystemRole.SYSTEM_ADMIN)
  updateReportingLine(@Param('id') id: string, @Body() dto: any) {
    return this.organizationStructureService.updateReportingLine(id, dto);
  }

  @Put('positions/:id/move')
  @Roles(SystemRole.SYSTEM_ADMIN)
  movePosition(@Param('id') id: string, @Body() dto: any) {
    return this.organizationStructureService.movePosition(id, dto);
  }

  @Patch('positions/:id/delimit')
@Roles(SystemRole.SYSTEM_ADMIN)
delimitPosition(@Param('id') id: string) {
  return this.organizationStructureService.delimitPosition(id);
}


  // ======================
  // 📌 STRUCTURE CHANGE REQUESTS
  // ======================

  @Post('change-requests')
  @Roles(SystemRole.DEPARTMENT_HEAD, SystemRole.HR_MANAGER)
  submitChangeRequest(@Body() dto: any, @CurrentUser() user: CurrentUserData) {
    return this.organizationStructureService.submitChangeRequest(dto, user.employeeId);
  }

  @Get('change-requests')
  @Roles(SystemRole.SYSTEM_ADMIN, SystemRole.HR_ADMIN)
  getAllChangeRequests() {
    return this.organizationStructureService.getAllChangeRequests();
  }

  @Get('change-requests/:id')
  @Roles(SystemRole.SYSTEM_ADMIN, SystemRole.HR_ADMIN, SystemRole.DEPARTMENT_HEAD)
  getChangeRequestById(@Param('id') id: string) {
    return this.organizationStructureService.getChangeRequestById(id);
  }

  @Put('change-requests/:id/approve')
  @Roles(SystemRole.SYSTEM_ADMIN)
  approveChangeRequest(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    return this.organizationStructureService.approveChangeRequest(id, user.employeeId);
  }

  @Put('change-requests/:id/reject')
  @Roles(SystemRole.SYSTEM_ADMIN)
  rejectChangeRequest(@Param('id') id: string, @Body() dto: any, @CurrentUser() user: CurrentUserData) {
    return this.organizationStructureService.rejectChangeRequest(id, dto.reason, user.employeeId);
  }

  // ======================
  // 📌 HIERARCHY VISUALIZATION
  // ======================

  @Get('hierarchy/organization')
  @Roles(SystemRole.SYSTEM_ADMIN, SystemRole.HR_ADMIN, SystemRole.HR_MANAGER)
  getOrganizationHierarchy() {
    return this.organizationStructureService.getOrganizationHierarchy();
  }

  @Get('hierarchy/department/:departmentId')
  @Roles(SystemRole.SYSTEM_ADMIN, SystemRole.HR_ADMIN, SystemRole.HR_MANAGER, SystemRole.DEPARTMENT_HEAD)
  getDepartmentHierarchy(@Param('departmentId') departmentId: string) {
    return this.organizationStructureService.getDepartmentHierarchy(departmentId);
  }

  @Get('hierarchy/my-team')
  @Roles(SystemRole.DEPARTMENT_HEAD)
  getMyTeamHierarchy(@CurrentUser() user: CurrentUserData) {
    return this.organizationStructureService.getMyTeamHierarchy(user.employeeId);
  }

  @Get('hierarchy/my-structure')
  getMyStructure(@CurrentUser() user: CurrentUserData) {
    return this.organizationStructureService.getMyStructure(user.employeeId);
  }
}
