import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Delete,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UnauthorizedException
} from '@nestjs/common';
import type { Express, Request } from 'express';
import { LeavesService } from './leaves.service';
import { FileInterceptor } from '@nestjs/platform-express'; // ✅ for file upload
import { diskStorage } from 'multer';
import { extname } from 'path';
import { SystemRole } from '../employee-profile/enums/employee-profile.enums';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleNormalizerGuard } from './guards/role-normalizer.guard';


// DTOs...
import { CreateLeaveCategoryDto } from './dto/create-leave-category.dto';
import { UpdateLeaveCategoryDto } from './dto/update-leave-category.dto';
import { CreateLeaveTypeDto } from './dto/create-leave-type.dto';
import { UpdateLeaveTypeDto } from './dto/update-leave-type.dto';
import { CreateLeavePolicyDto } from './dto/create-leave-policy.dto';
import { UpdateLeavePolicyDto } from './dto/update-leave-policy.dto';
import { CreateHolidayDto } from './dto/create-holiday.dto';
import { UpdateHolidayDto } from './dto/update-holiday.dto';
import { CreateCalendarDto } from './dto/create-calendar.dto';
import { UpdateCalendarHolidayDto } from './dto/update-calendar-holiday.dto';
import { UpdateCalendarBlockedDto } from './dto/update-calendar-blocked.dto';
import { CreateApprovalWorkflowDto } from './dto/create-approval-workflow.dto';
import { UpdateApprovalWorkflowDto } from './dto/update-approval-workflow.dto';
import { CreatePaycodeMappingDto } from './dto/create-paycode-mapping.dto';
import { UpdatePaycodeMappingDto } from './dto/update-paycode-mapping.dto';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { UpdateLeaveRequestDto } from './dto/update-leave-request.dto';
import { GetSchedulerDto } from './dto/get-scheduler.dto';
import { CreateDelegationDto } from './dto/create-delegation.dto';
import { UpdateDelegationDto } from './dto/update-delegation.dto';

interface JwtUser {
  userid?: string;        // what your JWT seems to use
  employeeId?: string;    // maybe set by other modules
  id?: string;            // fallback
  employeeNumber?: string; // just in case you need it later
  roles?: string[];
}

interface UserRequest extends Request {
  user?: JwtUser;
}

function getEmployeeProfileId(req: UserRequest): string {
  const u = req.user;
  // 1) prefer explicit employeeId if your auth guard sets it
  // 2) fall back to userid (your login response)
  // 3) final fallback: id
  const employeeId = u?.employeeId || u?.userid || u?.id;

  if (!employeeId) {
    throw new BadRequestException('Employee ID not found in auth token');
  }

  return employeeId;

}
@Controller('leaves')
@UseGuards(AuthGuard)   // EVERY route requires login
export class LeavesController {
  constructor(private readonly service: LeavesService) { }

  // ============================================================
  // CATEGORY (HR ONLY)
  // ============================================================
  @Post('categories')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.HR_ADMIN)
  createCategory(@Body() dto: CreateLeaveCategoryDto) {
    return this.service.createCategory(dto);
  }

  @Get('categories')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(
    SystemRole.HR_ADMIN,
    SystemRole.HR_EMPLOYEE,
    SystemRole.SYSTEM_ADMIN
  )
  getAllCategories() {
    return this.service.getAllCategories();
  }


  @Patch('categories/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.HR_ADMIN)
  updateCategory(@Param('id') id: string, @Body() dto: UpdateLeaveCategoryDto) {
    return this.service.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.HR_ADMIN)
  deleteCategory(@Param('id') id: string) {
    return this.service.deleteCategory(id);
  }
  // ============================================================
  // LEAVE TYPES (HR ONLY)
  // ============================================================
  @Post('types')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.HR_ADMIN)
  createLeaveType(@Body() dto: CreateLeaveTypeDto) {
    return this.service.createLeaveType(dto);
  }

  @Get('types')
  @UseGuards(AuthGuard)
  getAllLeaveTypes() {
    return this.service.getAllLeaveTypes();
  }

  @Patch('types/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.HR_ADMIN)
  updateLeaveType(@Param('id') id: string, @Body() dto: UpdateLeaveTypeDto) {
    return this.service.updateLeaveType(id, dto);
  }

  @Delete('types/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.HR_ADMIN)
  deleteLeaveType(@Param('id') id: string) {
    return this.service.deleteLeaveType(id);
  }


  // ============================================================
  // POLICIES (HR ONLY)
  // ============================================================
  @Post('policies')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.HR_ADMIN)
  createPolicy(@Body() dto: CreateLeavePolicyDto) {
    return this.service.createPolicy(dto);
  }

  @Get('policies')
  @UseGuards(AuthGuard)
  getAllPolicies() {
    return this.service.getAllPolicies();
  }

  @Patch('policies/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.HR_ADMIN)
  updatePolicy(@Param('id') id: string, @Body() dto: UpdateLeavePolicyDto) {
    return this.service.updatePolicy(id, dto);
  }

  @Delete('policies/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.HR_ADMIN)
  deletePolicy(@Param('id') id: string) {
    return this.service.deletePolicy(id);
  }


  // ============================================================
  // HOLIDAYS (HR ONLY)
  // ============================================================
  @Post('holidays')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.HR_ADMIN)
  createHoliday(@Body() dto: CreateHolidayDto) {
    return this.service.createHoliday(dto);
  }

  @Get('holidays')
  @UseGuards(AuthGuard)
  getAllHolidays() {
    return this.service.getAllHolidays();
  }

  @Patch('holidays/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.HR_ADMIN)
  updateHoliday(@Param('id') id: string, @Body() dto: UpdateHolidayDto) {
    return this.service.updateHoliday(id, dto);
  }

  @Delete('holidays/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.HR_ADMIN)
  deleteHoliday(@Param('id') id: string) {
    return this.service.deleteHoliday(id);
  }


  // ============================================================
  // CALENDAR (HR ONLY)
  // ============================================================
  @Post('calendar')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.HR_ADMIN)
  createCalendar(@Body() dto: CreateCalendarDto) {
    return this.service.createCalendar(dto);
  }

  @Get('calendar/:year')
  @UseGuards(AuthGuard)
  getCalendar(@Param('year') year: string) {
    return this.service.getCalendarByYear(Number(year));
  }

  @Patch('calendar/:year/add-holiday')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.HR_ADMIN)
  addHoliday(@Param('year') year: number, @Body() dto: UpdateCalendarHolidayDto) {
    return this.service.addHoliday(year, dto);
  }

  @Patch('calendar/:year/remove-holiday')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.HR_ADMIN)
  removeHoliday(@Param('year') year: number, @Body() dto: UpdateCalendarHolidayDto) {
    return this.service.removeHoliday(year, dto);
  }

  @Patch('calendar/:year/add-blocked')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.HR_ADMIN)
  addBlocked(@Param('year') year: number, @Body() dto: UpdateCalendarBlockedDto) {
    return this.service.addBlockedPeriod(year, dto);
  }

  @Patch('calendar/:year/remove-blocked/:index')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.HR_ADMIN)
  removeBlocked(@Param('year') year: number, @Param('index') index: number) {
    return this.service.removeBlockedPeriod(year, index);
  }

  // ============================================================
  // PAYCODE MAPPING (HR ONLY)
  // ============================================================
  @Post('paycode-mapping')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.HR_ADMIN)
  createMapping(@Body() dto: CreatePaycodeMappingDto) {
    return this.service.createPaycodeMapping(dto);
  }

  @Get('paycode-mapping')
  @UseGuards(AuthGuard)
  getAllMappings() {
    return this.service.getAllPaycodeMappings();
  }

  @Patch('paycode-mapping/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.HR_ADMIN)
  updateMapping(@Param('id') id: string, @Body() dto: UpdatePaycodeMappingDto) {
    return this.service.updatePaycodeMapping(id, dto);
  }

  @Delete('paycode-mapping/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.HR_ADMIN)
  deleteMapping(@Param('id') id: string) {
    return this.service.deletePaycodeMapping(id);
  }

  // ============================================================
  // APPROVAL WORKFLOW (HR ONLY)
  // ============================================================
  // ============================================================
  // APPROVAL WORKFLOW (HR ONLY)
  // ============================================================

  @Post('approval-workflow')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.HR_ADMIN)
  createWorkflow(@Body() dto: CreateApprovalWorkflowDto) {
    return this.service.createApprovalWorkflow(dto);
  }

  @Get('approval-workflow/:leaveTypeId')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(
    SystemRole.HR_ADMIN,
    SystemRole.HR_EMPLOYEE // HR Employee can VIEW workflows
  )
  getWorkflow(@Param('leaveTypeId') leaveTypeId: string) {
    return this.service.getApprovalWorkflow(leaveTypeId);
  }

  @Patch('approval-workflow/:leaveTypeId')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.HR_ADMIN)
  updateWorkflow(
    @Param('leaveTypeId') leaveTypeId: string,
    @Body() dto: UpdateApprovalWorkflowDto,
  ) {
    return this.service.updateApprovalWorkflow(leaveTypeId, dto);
  }

  // ============================================================
  // LEAVE REQUESTS (EMPLOYEE + MANAGER + HR)
  // ============================================================
  @Post('requests')
  @UseGuards(AuthGuard)
  createLeaveRequest(@Body() dto: CreateLeaveRequestDto, @Req() req: UserRequest) {
    const employeeId = getEmployeeProfileId(req);   // <- unified helper
    return this.service.createLeaveRequest(employeeId, dto);
  }



  @Get('requests')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(
    SystemRole.HR_ADMIN,
    SystemRole.HR_EMPLOYEE,
    SystemRole.HR_MANAGER,
    SystemRole.DEPARTMENT_MANAGER,
    SystemRole.DEPARTMENT_HEAD
  )
  getAllLeaveRequests() {
    return this.service.getAllLeaveRequests();
  }

  @Get('requests/:id')
  @UseGuards(AuthGuard)
  getLeaveRequest(@Param('id') id: string) {
    return this.service.getLeaveRequest(id);
  }

  @Patch('requests/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(
    SystemRole.HR_ADMIN,
    SystemRole.HR_EMPLOYEE,
    SystemRole.DEPARTMENT_MANAGER,
    SystemRole.DEPARTMENT_HEAD,
    SystemRole.DEPARTMENT_EMPLOYEE
  )
  updateLeaveRequest(@Param('id') id: string, @Body() dto: UpdateLeaveRequestDto) {
    return this.service.updateLeaveRequest(id, dto);
  }
  @Patch('requests/:id/manager-decision')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(
    SystemRole.HR_MANAGER,
    SystemRole.DEPARTMENT_MANAGER,
    SystemRole.DEPARTMENT_HEAD,
  )
  managerDecision(
    @Param('id') id: string,
    @Body() body: { decision: 'approved' | 'rejected' },
    @Req() req: UserRequest,
  ) {
    console.log('ROLES:', req.user?.roles);
    console.log('MANAGER ID:', req.user?.employeeId || req.user?.id);

    const managerId = req.user?.employeeId ?? req.user?.id;

    if (!managerId) {
      throw new UnauthorizedException('Manager ID not found for current user');
    }

    // Normalize roles for logging/debug
    const normalizedRoles = req.user?.roles?.map(r => r.toUpperCase()) || [];
    console.log('Normalized Roles:', normalizedRoles);

    return this.service.managerDecision(id, managerId, body.decision);
  }






  @Patch('requests/:id/hr-review')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.HR_ADMIN, SystemRole.HR_EMPLOYEE, SystemRole.DEPARTMENT_HEAD)
  hrReview(
    @Param('id') id: string,
    @Body() body: { action: 'approved' | 'rejected'; overrideManager?: boolean },
    @Req() req: UserRequest,
  ) {
    const hrId = req.user?.employeeId || req.user?.id;
    if (!hrId) {
      throw new BadRequestException('HR user ID not found');
    }

    return this.service.hrComplianceReview(
      id,
      hrId,
      body.action,
      body.overrideManager ?? false,
    );
  }

  @Get('my-balance')
  async getMyBalance(@Req() req: UserRequest) {
    const employeeId = getEmployeeProfileId(req);
    return this.service.getEmployeeBalance(employeeId);
  }
  @Get('my-requests')
  async getMyRequests(@Req() req: UserRequest) {
    const employeeId = getEmployeeProfileId(req);
    return this.service.getEmployeeRequests(employeeId);
  }
  // ============================================================
  // HR ADJUSTMENTS
  // ============================================================

  @Post('adjustments')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.HR_ADMIN)
  createAdjustment(@Body() dto: any, @Req() req: UserRequest) {
    const hrUserId = req.user?.employeeId || req.user?.id;
    return this.service.createAdjustment({ ...dto, hrUserId });
  }

  @Get('adjustments')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.HR_ADMIN)
  getAllAdjustments() {
    return this.service.getAllAdjustments();
  }
  // ============================================================
  // LEAVE ENTITLEMENTS (HR ONLY)
  // ============================================================
  @Post('entitlements/:employeeId')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.HR_ADMIN)
  createEntitlement(@Param('employeeId') employeeId: string) {
    return this.service.createEntitlementForEmployee({ _id: employeeId });
  }

  @Get('entitlements')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.HR_ADMIN)
  getAllEntitlements() {
    return this.service.getAllEntitlements();
  }

  @Get('entitlements/:employeeId')
  @UseGuards(AuthGuard)
  getEmployeeEntitlements(@Param('employeeId') employeeId: string) {
    return this.service.getEmployeeEntitlements(employeeId);
  }
  @Post('attachments/upload')  // final route = /leaves/attachments/upload
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/attachments',
        filename: (req, file, cb) => {
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, unique + extname(file.originalname));
        },
      }),
    }),

  )
  async uploadAttachment(@UploadedFile() file: Express.Multer.File) {
    const attachment = await this.service.saveAttachment(file);
    // 👇 frontend expects `{ id }`
    return { id: attachment._id.toString() };
  }
  @Get("manager/team")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(
    SystemRole.HR_MANAGER,
    SystemRole.DEPARTMENT_MANAGER,
    SystemRole.DEPARTMENT_HEAD
  )
  getManagerTeam(@Req() req: UserRequest) {
    const managerId = getEmployeeProfileId(req);
    return this.service.getManagerTeamOverview(managerId);
  }

  // ============================================================
  // AUTO-ESCALATION (BR-28)
  // ============================================================
  @Post('auto-escalate')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(
    SystemRole.HR_ADMIN,
    SystemRole.SYSTEM_ADMIN
  )
  async triggerAutoEscalation() {
    const count = await this.service.autoEscalateManagerApprovals();
    return {
      success: true,
      message: `Auto-escalation completed. ${count} request(s) escalated.`,
      escalatedCount: count,
    };
  }


  // ============================================================
  // MANAGER DELEGATION (REQ-023)
  // ============================================================

  @Post('delegation')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(
    SystemRole.DEPARTMENT_MANAGER,
    SystemRole.DEPARTMENT_HEAD,
    SystemRole.HR_MANAGER
  )
  createDelegation(
    @Body() dto: CreateDelegationDto,
    @Req() req: UserRequest,
  ) {
    const managerId = getEmployeeProfileId(req);
    return this.service.createDelegation(managerId, dto);
  }

  @Get('delegation')
  @UseGuards(AuthGuard)
  getMyDelegation(@Req() req: UserRequest) {
    const managerId = getEmployeeProfileId(req);
    return this.service.getDelegationByManager(managerId);
  }

  @Patch('delegation/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(
    SystemRole.DEPARTMENT_MANAGER,
    SystemRole.DEPARTMENT_HEAD,
    SystemRole.HR_MANAGER
  )
  updateDelegation(
    @Param('id') id: string,
    @Body() dto: UpdateDelegationDto,
  ) {
    return this.service.updateDelegation(id, dto);
  }

  @Delete('delegation/:id')
  @UseGuards(AuthGuard)
  deleteDelegation(@Param('id') id: string) {
    return this.service.deleteDelegation(id);
  }



}