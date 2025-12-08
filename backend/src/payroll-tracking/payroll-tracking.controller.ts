import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';

import { PayrollTrackingService } from './payroll-tracking.service';

// DTOs
import { CreateRefundDto, UpdateRefundStatusDto } from './dto/create-refund.dto';
import { CreateClaimDto } from './dto/create-claim.dto';
import { UpdateClaimStatusDto } from './dto/update-claim-status.dto';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { UpdateDisputeStatusDto } from './dto/update-dispute-status.dto';

// GLOBAL AUTH GUARDS (from /src/auth)
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

// GLOBAL ROLES ENUM
import { SystemRole } from '../employee-profile/enums/employee-profile.enums';

@Controller('payroll-tracking')
@UseGuards(AuthGuard, RolesGuard)
export class PayrollTrackingController {
  constructor(private readonly payrollTrackingService: PayrollTrackingService) {}

  // -----------------------------------------------------
  // EMPLOYEE SELF-SERVICE
  // -----------------------------------------------------

  @Roles(SystemRole.DEPARTMENT_EMPLOYEE)
  @Get('claims/me/:employeeId')
  getMyClaims(@Param('employeeId') employeeId: string) {
    return this.payrollTrackingService.getClaimsForEmployee(employeeId);
  }

  @Roles(SystemRole.DEPARTMENT_EMPLOYEE)
  @Post('claims')
  createClaim(@Body() dto: CreateClaimDto) {
    return this.payrollTrackingService.createClaim(dto);
  }

  @Roles(SystemRole.DEPARTMENT_EMPLOYEE)
  @Get('disputes/me/:employeeId')
  getMyDisputes(@Param('employeeId') employeeId: string) {
    return this.payrollTrackingService.getDisputesForEmployee(employeeId);
  }

  @Roles(SystemRole.DEPARTMENT_EMPLOYEE)
  @Post('disputes')
  createDispute(@Body() dto: CreateDisputeDto) {
    return this.payrollTrackingService.createDispute(dto);
  }

  // -----------------------------------------------------
  // PAYROLL SPECIALIST ENDPOINTS
  // -----------------------------------------------------

  @Roles(SystemRole.PAYROLL_SPECIALIST)
  @Get('claims/pending')
  getPendingClaims() {
    return this.payrollTrackingService.getPendingClaims();
  }

  @Roles(SystemRole.PAYROLL_SPECIALIST)
  @Patch('claims/:id/approve')
  approveClaim(
    @Param('id') claimId: string,
    @Body() dto: UpdateClaimStatusDto,
  ) {
    return this.payrollTrackingService.updateClaimStatus(claimId, dto);
  }

  @Roles(SystemRole.PAYROLL_SPECIALIST)
  @Patch('claims/:id/reject')
  rejectClaim(
    @Param('id') claimId: string,
    @Body() dto: UpdateClaimStatusDto,
  ) {
    return this.payrollTrackingService.updateClaimStatus(claimId, dto);
  }

  @Roles(SystemRole.PAYROLL_SPECIALIST)
  @Get('disputes/pending')
  getPendingDisputes() {
    return this.payrollTrackingService.getPendingDisputes();
  }

  @Roles(SystemRole.PAYROLL_SPECIALIST)
  @Patch('disputes/:id/approve')
  approveDispute(
    @Param('id') disputeId: string,
    @Body() dto: UpdateDisputeStatusDto,
  ) {
    return this.payrollTrackingService.updateDisputeStatus(disputeId, dto);
  }

  @Roles(SystemRole.PAYROLL_SPECIALIST)
  @Patch('disputes/:id/reject')
  rejectDispute(
    @Param('id') disputeId: string,
    @Body() dto: UpdateDisputeStatusDto,
  ) {
    return this.payrollTrackingService.updateDisputeStatus(disputeId, dto);
  }

  // -----------------------------------------------------
  // FINANCE (REFUNDS)
  // -----------------------------------------------------

  @Roles(SystemRole.FINANCE_STAFF)
  @Post('refunds')
  createRefund(@Body() dto: CreateRefundDto) {
    return this.payrollTrackingService.createRefund(dto);
  }

  @Roles(SystemRole.FINANCE_STAFF)
  @Patch('refunds/:id/status')
  updateRefund(
    @Param('id') refundId: string,
    @Body() dto: UpdateRefundStatusDto,
  ) {
    return this.payrollTrackingService.updateRefundStatus(refundId, dto);
  }

  @Roles(SystemRole.FINANCE_STAFF)
  @Get('refunds')
  listRefunds() {
    return this.payrollTrackingService.getRefunds();
  }
}
