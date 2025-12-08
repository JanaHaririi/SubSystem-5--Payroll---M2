import {
  Controller,
  Post,
  Patch,
  Get,
  Body,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';

import { PayrollExecutionService } from './payroll-execution.service';
import { UpdatePayrollPeriodDto } from './dto/update-payroll-period.dto';
import { StartPayrollRunDto } from './dto/start-payroll-run.dto';
import {
  EditSigningBonusDto,
  EditExitBenefitsDto,
} from './dto/phase-0.dto';

import { PayrollPhase1_1Service } from './payroll-phase1-1.service';
import { GeneratePayrollDraftDto } from './dto/generate-payroll-draft.dto';

import { PayrollPhase1_1AService } from './payroll-phase1-1A.service';
import { PayrollPhase1_1BService } from './payroll-phase1-1B.service';
import { ProcessHREventsDto } from './dto/process-hr-events.dto';
import { Phase1_1BDto } from './dto/phase-1-1B.dto';

import { PayrollPhase1_1CService } from './payroll-phase1-1C.service';
import { PayrollPhase2Service } from './payroll-phase2.service';
import { ReviewPayrollDraftDto } from './dto/review-payroll-draft.dto';

import { PayrollPhase3Service } from './payroll-phase3.service';
import {
  PayrollApproveDto,
  LockPayrollDto,
  UnfreezePayrollDto,
} from './dto/phase3.dto';

import { PayrollPhase4Service } from './payroll-phase4.service';
import { GeneratePayslipsDto } from './dto/generate-payslips.dto';

// SECURITY
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SystemRole } from '../employee-profile/enums/employee-profile.enums';

@Controller('payroll-execution')
@UseGuards(AuthGuard, RolesGuard)
export class PayrollExecutionController {
  constructor(
    private readonly payrollExecutionService: PayrollExecutionService,
    private readonly phaseService: PayrollPhase1_1Service,
    private readonly phase1AService: PayrollPhase1_1AService,
    private readonly phase1BService: PayrollPhase1_1BService,
    private readonly phase1CService: PayrollPhase1_1CService,
    private readonly phase2Service: PayrollPhase2Service,
    private readonly phase3Service: PayrollPhase3Service,
    private readonly phase4Service: PayrollPhase4Service,
  ) {}

  // ======================================================
  // PHASE 0 — SIGNING BONUS (Payroll Specialist)
  // ======================================================

  @Roles(SystemRole.PAYROLL_SPECIALIST)
  @Post('signing-bonus/:id/approve')
  approveSigningBonus(@Param('id') id: string) {
    return this.payrollExecutionService.approveSigningBonus(id);
  }

  @Roles(SystemRole.PAYROLL_SPECIALIST)
  @Post('signing-bonus/:id/reject')
  rejectSigningBonus(@Param('id') id: string) {
    return this.payrollExecutionService.rejectSigningBonus(id);
  }

  @Roles(SystemRole.PAYROLL_SPECIALIST)
  @Patch('signing-bonus/:id/edit')
  editSigningBonus(@Param('id') id: string, @Body() dto: EditSigningBonusDto) {
    return this.payrollExecutionService.editSigningBonus(id, dto);
  }

  // ======================================================
  // PHASE 0 — EXIT BENEFITS (Payroll Specialist)
  // ======================================================

  @Roles(SystemRole.PAYROLL_SPECIALIST)
  @Post('exit-benefits/:id/approve')
  approveExitBenefits(@Param('id') id: string) {
    return this.payrollExecutionService.approveExitBenefits(id);
  }

  @Roles(SystemRole.PAYROLL_SPECIALIST)
  @Post('exit-benefits/:id/reject')
  rejectExitBenefits(@Param('id') id: string) {
    return this.payrollExecutionService.rejectExitBenefits(id);
  }

  @Roles(SystemRole.PAYROLL_SPECIALIST)
  @Patch('exit-benefits/:id/edit')
  editExitBenefits(@Param('id') id: string, @Body() dto: EditExitBenefitsDto) {
    return this.payrollExecutionService.editExitBenefits(id, dto);
  }

  // ======================================================
  // PHASE 0 FINAL VALIDATION (Payroll Specialist)
  // ======================================================

  @Roles(SystemRole.PAYROLL_SPECIALIST)
  @Get('phase-0/validate')
  validatePhase0() {
    return this.payrollExecutionService.validatePhase0();
  }

  // ======================================================
  // PHASE 1 — EDIT PERIOD + START INITIATION
  // (Payroll Specialist)
  // ======================================================

  @Roles(SystemRole.PAYROLL_SPECIALIST)
  @Put('phase1/update-period')
  updatePayrollPeriod(@Body() dto: UpdatePayrollPeriodDto) {
    return this.payrollExecutionService.updatePayrollPeriod(dto);
  }

  @Roles(SystemRole.PAYROLL_SPECIALIST)
  @Post('phase1/start')
  startPayrollInitiation(@Body() dto: StartPayrollRunDto) {
    return this.payrollExecutionService.startPayrollInitiation(dto);
  }

  // ======================================================
  // PHASE 1.1 — DRAFT GENERATION (Payroll Specialist)
  // ======================================================

  @Roles(SystemRole.PAYROLL_SPECIALIST)
  @Post('generate-draft')
  generateDraft(@Body() dto: GeneratePayrollDraftDto) {
    return this.phaseService.generatePayrollDraft(dto);
  }

  @Roles(SystemRole.PAYROLL_SPECIALIST)
  @Post('process-hr-events')
  processHREvents(@Body() dto: ProcessHREventsDto) {
    return this.phase1AService.processHREvents(dto);
  }

  @Roles(SystemRole.PAYROLL_SPECIALIST)
  @Post('apply-penalties')
  applyPenalties(@Body() dto: Phase1_1BDto) {
    return this.phase1BService.applyPenalties(dto);
  }

  @Roles(SystemRole.PAYROLL_SPECIALIST)
  @Post('generate-draft-file')
  generateDraftFile(@Body() dto: GeneratePayrollDraftDto) {
    return this.phase1CService.generateDraftFile(dto);
  }

  // ======================================================
  // PHASE 2 — REVIEW DRAFT (Payroll Specialist)
  // ======================================================

  @Roles(SystemRole.PAYROLL_SPECIALIST)
  @Post('phase2/review-draft')
  reviewPayrollDraft(@Body() dto: ReviewPayrollDraftDto) {
    return this.phase2Service.reviewPayrollDraft(dto);
  }

  // ======================================================
  // PHASE 3 — APPROVAL WORKFLOW
  // ======================================================

  // ⭐ Payroll Manager reviews
  @Roles(SystemRole.PAYROLL_MANAGER)
  @Post('phase3/review')
  reviewPayroll(@Body('payrollRunId') payrollRunId: string) {
    return this.phase3Service.reviewPayrollRun(payrollRunId);
  }

  // ⭐ Manager approves payroll
  @Roles(SystemRole.PAYROLL_MANAGER)
  @Post('phase3/manager-approve')
  managerApprove(@Body() dto: PayrollApproveDto) {
    return this.phase3Service.managerApprove(dto);
  }

  // ⭐ Finance approves disbursement
  @Roles(SystemRole.FINANCE_STAFF)
  @Post('phase3/finance-approve')
  financeApprove(@Body() dto: PayrollApproveDto) {
    return this.phase3Service.financeApprove(dto);
  }

  // ⭐ Manager locks payroll
  @Roles(SystemRole.PAYROLL_MANAGER)
  @Patch('phase3/lock')
  lockPayroll(@Body() dto: LockPayrollDto) {
    return this.phase3Service.lockPayroll(dto);
  }

  // ⭐ Manager unfreezes payroll
  @Roles(SystemRole.PAYROLL_MANAGER)
  @Patch('phase3/unfreeze')
  unfreezePayroll(@Body() dto: UnfreezePayrollDto) {
    return this.phase3Service.unfreezePayroll(dto);
  }

  // ======================================================
  // PHASE 4 — PAYSLIPS GENERATION (Payroll Specialist)
  // ======================================================

  @Roles(SystemRole.PAYROLL_SPECIALIST)
  @Post('generate-payslips')
  generatePayslips(@Body() dto: GeneratePayslipsDto) {
    return this.phase4Service.generatePayslips(dto);
  }
}
