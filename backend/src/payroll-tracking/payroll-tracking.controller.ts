import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Param,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import type { Request } from 'express';

import { PayrollTrackingService } from './payroll-tracking.service';

// DTOs
import { CreateRefundDto } from './dto/create-refund.dto';
import { UpdateRefundStatusDto } from './dto/update-refund-status.dto';

import { CreateClaimDto } from './dto/create-claim.dto';
import { UpdateClaimStatusDto } from './dto/update-claim-status.dto';
import { UpdateClaimReviewDto } from './dto/update-claim-review.dto';

import { CreateDisputeDto } from './dto/create-dispute.dto';
import { UpdateDisputeStatusDto } from './dto/update-dispute-status.dto';
import { UpdateDisputeReviewDto } from './dto/update-dispute-review.dto';

// AUTH GUARDS
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

// ROLES ENUM
import { SystemRole } from '../employee-profile/enums/employee-profile.enums';
import {
  ClaimReviewStatus,
  DisputeReviewStatus,
} from './enums/payroll-tracking-enum';

@Controller('payroll-tracking')
@UseGuards(AuthGuard, RolesGuard)
export class PayrollTrackingController {
  constructor(private readonly payrollTrackingService: PayrollTrackingService) {}

  /* ============================================================
     EMPLOYEE – SELF SERVICE
  ============================================================ */

  // EMPLOYEE: list own claims
  @Roles(SystemRole.DEPARTMENT_EMPLOYEE)
  @Get('claims/me/:employeeId')
  getMyClaims(@Param('employeeId') employeeId: string) {
    return this.payrollTrackingService.getClaimsForEmployee(employeeId);
  }

  // EMPLOYEE: get claim by id (owned by employee)
  @Roles(SystemRole.DEPARTMENT_EMPLOYEE)
  @Get('claims/:id')
  getMyClaimById(
    @Param('id') claimId: string,
    @Req() req: Request,
  ) {
    const currentUser: any = req['user'];
    if (!currentUser?.employeeId) {
      throw new ForbiddenException('Employee context missing');
    }
    return this.payrollTrackingService.getClaimForEmployeeById(
      claimId,
      currentUser?.employeeId,
    );
  }

  // EMPLOYEE: create claim
  @Roles(SystemRole.DEPARTMENT_EMPLOYEE)
  @Post('claims')
  createClaim(@Body() dto: CreateClaimDto) {
    return this.payrollTrackingService.createClaim(dto);
  }

  // EMPLOYEE: list own disputes
  @Roles(SystemRole.DEPARTMENT_EMPLOYEE)
  @Get('disputes/me/:employeeId')
  getMyDisputes(@Param('employeeId') employeeId: string) {
    return this.payrollTrackingService.getDisputesForEmployee(employeeId);
  }

  // EMPLOYEE: get dispute by id (owned by employee)
  @Roles(SystemRole.DEPARTMENT_EMPLOYEE)
  @Get('disputes/:id')
  getMyDisputeById(
    @Param('id') disputeId: string,
    @Req() req: Request,
  ) {
    const currentUser: any = req['user'];
    if (!currentUser?.employeeId) {
      throw new ForbiddenException('Employee context missing');
    }
    return this.payrollTrackingService.getDisputeForEmployeeById(
      disputeId,
      currentUser?.employeeId,
    );
  }

  // EMPLOYEE: create dispute
  @Roles(SystemRole.DEPARTMENT_EMPLOYEE)
  @Post('disputes')
  createDispute(@Body() dto: CreateDisputeDto) {
    return this.payrollTrackingService.createDispute(dto);
  }

  /* ============================================================
     PAYROLL SPECIALIST – CLAIMS & DISPUTES REVIEW
  ============================================================ */

  @Roles(SystemRole.PAYROLL_SPECIALIST)
  @Get('claims/pending')
  getPendingClaims() {
    return this.payrollTrackingService.getPendingClaims();
  }

  @Roles(SystemRole.PAYROLL_SPECIALIST)
  @Patch('claims/:id/approve')
  approveClaim(
    @Param('id') claimId: string,
    @Body() dto: UpdateClaimReviewDto,
    @Req() req: Request,
  ) {
    return this.payrollTrackingService.recommendClaimStatus(
      claimId,
      {
        ...dto,
        reviewStatus: ClaimReviewStatus.RECOMMEND_APPROVE,
      },
      (req as any)?.user?.employeeId || (req as any)?.user?._id,
    );
  }

  @Roles(SystemRole.PAYROLL_SPECIALIST)
  @Patch('claims/:id/reject')
  rejectClaim(
    @Param('id') claimId: string,
    @Body() dto: UpdateClaimReviewDto,
    @Req() req: Request,
  ) {
    return this.payrollTrackingService.recommendClaimStatus(
      claimId,
      {
        ...dto,
        reviewStatus: ClaimReviewStatus.RECOMMEND_REJECT,
      },
      (req as any)?.user?.employeeId || (req as any)?.user?._id,
    );
  }

  @Roles(SystemRole.PAYROLL_SPECIALIST)
  @Get('disputes/pending')
  getPendingDisputes() {
    return this.payrollTrackingService.getPendingDisputes();
  }

  /* ============================================================
     PAYROLL MANAGER – FINAL APPROVAL
  ============================================================ */

  @Roles(SystemRole.PAYROLL_MANAGER)
  @Get('claims/awaiting-final')
  getClaimsAwaitingFinal() {
    return this.payrollTrackingService.getClaimsAwaitingFinal();
  }

  @Roles(SystemRole.PAYROLL_MANAGER)
  @Patch('claims/:id/final')
  finalizeClaim(
    @Param('id') claimId: string,
    @Body() dto: UpdateClaimStatusDto,
    @Req() req: Request,
  ) {
    return this.payrollTrackingService.updateClaimStatus(
      claimId,
      dto,
      (req as any)?.user?.employeeId || (req as any)?.user?._id,
    );
  }

  @Roles(SystemRole.PAYROLL_MANAGER)
  @Get('disputes/awaiting-final')
  getDisputesAwaitingFinal() {
    return this.payrollTrackingService.getDisputesAwaitingFinal();
  }

  @Roles(SystemRole.PAYROLL_MANAGER)
  @Patch('disputes/:id/final')
  finalizeDispute(
    @Param('id') disputeId: string,
    @Body() dto: UpdateDisputeStatusDto,
    @Req() req: Request,
  ) {
    return this.payrollTrackingService.updateDisputeStatus(
      disputeId,
      dto,
      (req as any)?.user?.employeeId || (req as any)?.user?._id,
    );
  }

  @Roles(SystemRole.PAYROLL_SPECIALIST)
  @Patch('disputes/:id/approve')
  approveDispute(
    @Param('id') disputeId: string,
    @Body() dto: UpdateDisputeReviewDto,
    @Req() req: Request,
  ) {
    return this.payrollTrackingService.recommendDisputeStatus(
      disputeId,
      {
        ...dto,
        reviewStatus: DisputeReviewStatus.RECOMMEND_APPROVE,
      },
      (req as any)?.user?.employeeId || (req as any)?.user?._id,
    );
  }

  @Roles(SystemRole.PAYROLL_SPECIALIST)
  @Patch('disputes/:id/reject')
  rejectDispute(
    @Param('id') disputeId: string,
    @Body() dto: UpdateDisputeReviewDto,
    @Req() req: Request,
  ) {
    return this.payrollTrackingService.recommendDisputeStatus(
      disputeId,
      {
        ...dto,
        reviewStatus: DisputeReviewStatus.RECOMMEND_REJECT,
      },
      (req as any)?.user?.employeeId || (req as any)?.user?._id,
    );
  }

  /* ============================================================
     FINANCE – REFUNDS
  ============================================================ */

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

  @Roles(SystemRole.FINANCE_STAFF)
  @Get('refunds/:id')
  getRefundById(@Param('id') refundId: string) {
    return this.payrollTrackingService.getRefundById(refundId);
  }
}
