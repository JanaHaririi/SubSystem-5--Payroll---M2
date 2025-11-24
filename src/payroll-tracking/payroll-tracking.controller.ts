import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { PayrollTrackingService } from './payroll-tracking.service';

// DTOs
import { CreateRefundDto } from './dto/create-refund.dto';
import { UpdateRefundStatusDto } from './dto/create-refund.dto';
import { CreateClaimDto } from './dto/create-claim.dto';
import { UpdateClaimStatusDto } from './dto/update-claim-status.dto';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { UpdateDisputeStatusDto } from './dto/update-dispute-status.dto';

@Controller('payroll-tracking')
export class PayrollTrackingController {
  constructor(
    private readonly payrollTrackingService: PayrollTrackingService,
  ) {}

  // ---------------------------------------------
  // EMPLOYEE SELF-SERVICE ENDPOINTS (PUBLIC)
  // ---------------------------------------------

  @Get('claims/me/:employeeId')
  getMyClaims(@Param('employeeId') employeeId: string) {
    return this.payrollTrackingService.getClaimsForEmployee(employeeId);
  }

  @Post('claims')
  createClaim(@Body() dto: CreateClaimDto) {
    return this.payrollTrackingService.createClaim(dto);
  }

  @Get('disputes/me/:employeeId')
  getMyDisputes(@Param('employeeId') employeeId: string) {
    return this.payrollTrackingService.getDisputesForEmployee(employeeId);
  }

  @Post('disputes')
  createDispute(@Body() dto: CreateDisputeDto) {
    return this.payrollTrackingService.createDispute(dto);
  }

  // ---------------------------------------------
  // PAYROLL SPECIALIST (PRIVATE)
  // ---------------------------------------------

  @Get('claims/pending')
  getPendingClaims() {
    return this.payrollTrackingService.getPendingClaims();
  }

  @Patch('claims/:id/approve')
  approveClaim(
    @Param('id') claimId: string,
    @Body() dto: UpdateClaimStatusDto,
  ) {
    return this.payrollTrackingService.updateClaimStatus(claimId, dto);
  }

  @Patch('claims/:id/reject')
  rejectClaim(
    @Param('id') claimId: string,
    @Body() dto: UpdateClaimStatusDto,
  ) {
    return this.payrollTrackingService.updateClaimStatus(claimId, dto);
  }

  @Get('disputes/pending')
  getPendingDisputes() {
    return this.payrollTrackingService.getPendingDisputes();
  }

  @Patch('disputes/:id/approve')
  approveDispute(
    @Param('id') disputeId: string,
    @Body() dto: UpdateDisputeStatusDto,
  ) {
    return this.payrollTrackingService.updateDisputeStatus(disputeId, dto);
  }

  @Patch('disputes/:id/reject')
  rejectDispute(
    @Param('id') disputeId: string,
    @Body() dto: UpdateDisputeStatusDto,
  ) {
    return this.payrollTrackingService.updateDisputeStatus(disputeId, dto);
  }

  // ---------------------------------------------
  // FINANCE REFUNDS (PRIVATE)
  // ---------------------------------------------

  @Post('refunds')
  createRefund(@Body() dto: CreateRefundDto) {
    return this.payrollTrackingService.createRefund(dto);
  }

  @Patch('refunds/:id/status')
  updateRefund(
    @Param('id') refundId: string,
    @Body() dto: UpdateRefundStatusDto,
  ) {
    return this.payrollTrackingService.updateRefundStatus(refundId, dto);
  }

  @Get('refunds')
  listRefunds() {
    return this.payrollTrackingService.getRefunds();
  }
}