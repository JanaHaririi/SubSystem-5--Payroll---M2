import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';

import { PayrollConfigurationService } from './payroll-configuration.service';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { SystemRole } from 'src/employee-profile/enums/employee-profile.enums';

import { updatePayrollPoliciesDto } from './dto/update-policies.dto';
import { createPayrollPoliciesDto } from './dto/create-policies.dto';
import { createAllowanceDto } from './dto/create-allowance.dto';
import { createResigAndTerminBenefitsDTO } from './dto/create-resigAndTerm.dto';
import { addPayGradeDTO } from './dto/create-paygrade.dto';
import { editPayGradeDTO } from './dto/edit-paygrade.dto';
import { editPayTypeDTO } from './dto/edit-paytype.dto';
import { createPayTypeDTO } from './dto/create-paytype.dto';
import { editsigningBonusDTO } from './dto/edit-signingBonus.dto';
import { createsigningBonusesDTO } from './dto/create-signingBonus.dto';
import { createInsuranceBracketsDTO } from './dto/create-insurance.dto';
import { editInsuranceBracketsDTO } from './dto/edit-insurance.dto';
import { payrollPoliciesDocument } from './models/payrollPolicies.schema';
import { CreateCompanySettingsDto } from './dto/create-company-settings.dto';
import { UpdateCompanySettingsDto } from './dto/UpdateCompanySettings.dto';
import { ApprovalDto } from './dto/approval.dto';
import { createTaxRulesDTO } from './dto/create-tax-rules.dto';
import { editTaxRulesDTO } from './dto/edit-tax-rules.dto';

@Controller('payroll-configuration')
export class PayrollConfigurationController {
  constructor(
    private readonly payrollConfigurationService: PayrollConfigurationService,
  ) {}

  // -------------------
  // PAYROLL SPECIALIST ROUTES
  // -------------------

  @Get('policies')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.PAYROLL_SPECIALIST)
  async getAllPolicies(): Promise<payrollPoliciesDocument[]> {
    return this.payrollConfigurationService.findAllPolicies();
  }

  @Get('policies/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.PAYROLL_SPECIALIST)
  async getPolicyById(@Param('id') id: string): Promise<payrollPoliciesDocument | null> {
    return this.payrollConfigurationService.findById(id);
  }

  @Post('policies')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.PAYROLL_SPECIALIST)
  async createPolicy(@Body() policyData: createPayrollPoliciesDto): Promise<payrollPoliciesDocument> {
    return this.payrollConfigurationService.createPolicy(policyData);
  }

  @Put('policies/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.PAYROLL_SPECIALIST)
  async updatePolicy(
    @Param('id') id: string,
    @Body() updateData: updatePayrollPoliciesDto
  ): Promise<payrollPoliciesDocument | null> {
    return this.payrollConfigurationService.updatePolicy(id, updateData);
  }

  @Delete('policies/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.PAYROLL_SPECIALIST)
  async deletePolicy(@Param('id') id: string): Promise<payrollPoliciesDocument | null> {
    return this.payrollConfigurationService.deletePolicy(id);
  }

  // -------------------
  // INSURANCE BRACKETS
  // -------------------

  @Get('insurance-brackets/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.PAYROLL_SPECIALIST)
  async findInsuranceBracket(@Param('id') id: string) {
    return this.payrollConfigurationService.findInsuranceBrackets(id);
  }

  @Post('insurance-brackets')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.PAYROLL_SPECIALIST)
  async createInsuranceBracket(@Body() bracketData: createInsuranceBracketsDTO) {
    return this.payrollConfigurationService.createInsuranceBrackets(bracketData);
  }

  @Put('insurance-brackets/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.PAYROLL_SPECIALIST)
  async editInsuranceBracket(
    @Param('id') id: string,
    @Body() updateData: editInsuranceBracketsDTO
  ) {
    return this.payrollConfigurationService.editInsuranceBrackets(id, updateData);
  }

  @Delete('insurance-brackets/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.PAYROLL_SPECIALIST)
  async removeInsuranceBracket(@Param('id') id: string) {
    return this.payrollConfigurationService.removeInsuranceBrackets(id);
  }

  // -------------------
  // PAYROLL MANAGER APPROVAL
  // -------------------

  @Post('approve/payroll/:model/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.PAYROLL_MANAGER)
  async approvePayrollConfig(
    @Param('model') model: string,
    @Param('id') id: string,
  ) {
    return this.payrollConfigurationService.payrollManagerApprove(model, id);
  }

  @Post('reject/payroll/:model/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.PAYROLL_MANAGER)
  async rejectPayrollConfig(
    @Param('model') model: string,
    @Param('id') id: string,
  ) {
    return this.payrollConfigurationService.payrollManagerReject(model, id);
  }

  // -------------------
  // HR MANAGER INSURANCE APPROVAL
  // -------------------

  @Post('approve/insurance/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.HR_MANAGER)
  async approveInsurance(@Param('id') id: string) {
    return this.payrollConfigurationService.hrApproveInsurance(id);
  }

  @Post('reject/insurance/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.HR_MANAGER)
  async rejectInsurance(@Param('id') id: string) {
    return this.payrollConfigurationService.hrRejectInsurance(id);
  }

  // -------------------
  // COMPANY SETTINGS (SYSTEM ADMIN)
  // -------------------

  @Post('company-settings')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.SYSTEM_ADMIN)
  createSettings(@Body() dto: CreateCompanySettingsDto) {
    return this.payrollConfigurationService.create(dto);
  }

  @Get('company-settings')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.SYSTEM_ADMIN)
  getAllSettings() {
    return this.payrollConfigurationService.findAll();
  }

  @Get('company-settings/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.SYSTEM_ADMIN)
  getSettings(@Param('id') id: string) {
    return this.payrollConfigurationService.findOne(id);
  }

  @Put('company-settings/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.SYSTEM_ADMIN)
  updateSettings(@Param('id') id: string, @Body() dto: UpdateCompanySettingsDto) {
    return this.payrollConfigurationService.update(id, dto);
  }

  @Delete('company-settings/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.SYSTEM_ADMIN)
  deleteSettings(@Param('id') id: string) {
    return this.payrollConfigurationService.delete(id);
  }

  // -------------------
  // GENERAL APPROVAL/REJECTION
  // -------------------
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.PAYROLL_MANAGER, SystemRole.HR_MANAGER)
  @Post('approval')
  approveOrReject(@Body() dto: ApprovalDto) {
    return this.payrollConfigurationService.approveOrReject(dto);
  }

  // -------------------
  // LEGAL & POLICY ADMIN - TAX RULES
  // -------------------

  @Get('tax-rules')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.LEGAL_POLICY_ADMIN)
  async getAllTaxRules() {
    return this.payrollConfigurationService.findAllTaxRules();
  }

  @Get('tax-rules/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.LEGAL_POLICY_ADMIN)
  async getTaxRuleById(@Param('id') id: string) {
    return this.payrollConfigurationService.findTaxRuleById(id);
  }

  @Post('tax-rules')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.LEGAL_POLICY_ADMIN)
  async createTaxRule(@Body() taxRuleData: createTaxRulesDTO) {
    return this.payrollConfigurationService.createTaxRule(taxRuleData);
  }

  @Put('tax-rules/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.LEGAL_POLICY_ADMIN)
  async updateTaxRule(
    @Param('id') id: string,
    @Body() updateData: editTaxRulesDTO
  ) {
    return this.payrollConfigurationService.updateTaxRule(id, updateData);
  }

  @Delete('tax-rules/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.LEGAL_POLICY_ADMIN)
  async deleteTaxRule(@Param('id') id: string) {
    return this.payrollConfigurationService.deleteTaxRule(id);
  }

  // -------------------
  // PAYROLL SPECIALIST - TERMINATION & RESIGNATION BENEFITS
  // -------------------

  @Get('termination-resignation-benefits')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.PAYROLL_SPECIALIST)
  async getAllTerminationAndResignationBenefits() {
    return this.payrollConfigurationService.getAllTerminationAndResignationBenefits();
  }

  @Get('termination-resignation-benefits/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.PAYROLL_SPECIALIST)
  async getTerminationAndResignationBenefitById(@Param('id') id: string) {
    return this.payrollConfigurationService.getTerminationAndResignationBenefitById(id);
  }

  @Post('termination-resignation-benefits')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.PAYROLL_SPECIALIST)
  async createTerminationAndResignationBenefit(@Body() benefitsData: createResigAndTerminBenefitsDTO) {
    return this.payrollConfigurationService.createTerminationAndResignationBenefit(benefitsData);
  }

  @Put('termination-resignation-benefits/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.PAYROLL_SPECIALIST)
  async updateTerminationAndResignationBenefit(
    @Param('id') id: string,
    @Body() updateData: createResigAndTerminBenefitsDTO
  ) {
    return this.payrollConfigurationService.updateTerminationAndResignationBenefit(id, updateData);
  }

  @Delete('termination-resignation-benefits/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.PAYROLL_SPECIALIST)
  async deleteTerminationAndResignationBenefit(@Param('id') id: string) {
    return this.payrollConfigurationService.deleteTerminationAndResignationBenefit(id);
  }

  // -------------------
  // SYSTEM ADMIN - BACKUP
  // -------------------

  @Post('backup')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.SYSTEM_ADMIN)
  async backupPayrollData() {
    return this.payrollConfigurationService.backupPayrollData();
  }
}
