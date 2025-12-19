import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';

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
import { CreateTaxDocumentDto } from './dto/create-tax-document.dto';
import { CreatePayrollDisputeDto } from './dto/create-payroll-dispute.dto';

@Controller('payroll-configuration')
export class PayrollConfigurationController {
  constructor(
    private readonly payrollConfigurationService: PayrollConfigurationService,
  ) {}

  // -------------------
  // PAYROLL POLICIES (PAYROLL MANAGER)
  // -------------------

  @Get('policies')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.PAYROLL_SPECIALIST, SystemRole.PAYROLL_MANAGER)
  async getAllPolicies(): Promise<payrollPoliciesDocument[]> {
    return this.payrollConfigurationService.findAllPolicies();
  }

  @Get('policies/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.PAYROLL_SPECIALIST, SystemRole.PAYROLL_MANAGER)
  async getPolicyById(@Param('id') id: string): Promise<payrollPoliciesDocument | null> {
    return this.payrollConfigurationService.findById(id);
  }

  @Post('policies')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.PAYROLL_SPECIALIST, SystemRole.PAYROLL_MANAGER)
  async createPolicy(@Body() policyData: createPayrollPoliciesDto): Promise<payrollPoliciesDocument> {
    return this.payrollConfigurationService.createPolicy(policyData);
  }

  @Put('policies/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.PAYROLL_SPECIALIST, SystemRole.PAYROLL_MANAGER)
  async updatePolicy(
    @Param('id') id: string,
    @Body() updateData: updatePayrollPoliciesDto
  ): Promise<payrollPoliciesDocument | null> {
    return this.payrollConfigurationService.updatePolicy(id, updateData);
  }

  @Delete('policies/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.PAYROLL_SPECIALIST, SystemRole.PAYROLL_MANAGER)
  async deletePolicy(@Param('id') id: string): Promise<payrollPoliciesDocument | null> {
    return this.payrollConfigurationService.deletePolicy(id);
  }

  // -------------------
  // DEFINE PAY GRADES
  // -------------------

  @Post('pay-grades')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.PAYROLL_SPECIALIST, SystemRole.PAYROLL_MANAGER)
  async addPayGrade(@Body() payGradeData: addPayGradeDTO) {
    return this.payrollConfigurationService.AddPayGrade(payGradeData);
  }

  @Put('pay-grades/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.PAYROLL_SPECIALIST, SystemRole.PAYROLL_MANAGER)
  async editPayGrade(@Param('id') id: string, @Body() updateData: editPayGradeDTO) {
    return this.payrollConfigurationService.editPayGrade(id, updateData);
  }

  @Delete('pay-grades/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.PAYROLL_SPECIALIST, SystemRole.PAYROLL_MANAGER)
  async deletePayGrade(@Param('id') id: string) {
    return this.payrollConfigurationService.removePayGrade(id);
  }

  @Get('pay-grades/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.PAYROLL_SPECIALIST, SystemRole.PAYROLL_MANAGER)
  async findPayGrade(@Param('id') id: string) {
    return this.payrollConfigurationService.getPayGrade(id);
  }

  @Get('pay-grades')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.PAYROLL_SPECIALIST, SystemRole.PAYROLL_MANAGER)
  async getAllPayGrades() {
    return this.payrollConfigurationService.getAllPayGrades();
  }

  @Put('pay-grades/:id/approve')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.PAYROLL_MANAGER)
  async approvePayGrade(@Param('id') id: string) {
    return this.payrollConfigurationService.approvePayGrade(id);
  }

  @Put('pay-grades/:id/reject')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.PAYROLL_MANAGER)
  async rejectPayGrade(@Param('id') id: string) {
    return this.payrollConfigurationService.rejectPayGrade(id);
  }


  // -------------------
  // DEFINE PAY TYPES
  // -------------------

  @Post('pay-types')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.PAYROLL_SPECIALIST, SystemRole.PAYROLL_MANAGER)
  async createPayType(@Body() payTypeData: createPayTypeDTO) {
    return this.payrollConfigurationService.createPayTypes(payTypeData);
  }

  @Put('pay-types/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.PAYROLL_SPECIALIST, SystemRole.PAYROLL_MANAGER)
  async editPayType(@Param('id') id: string, @Body() updateData: editPayTypeDTO) {
    return this.payrollConfigurationService.editPayTypes(id, updateData);
  }

  @Get('pay-types')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.PAYROLL_SPECIALIST, SystemRole.PAYROLL_MANAGER)
  async getAllPayTypes() {
    return this.payrollConfigurationService.getAllPayTypes();
  }

  @Get('pay-types/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.PAYROLL_SPECIALIST, SystemRole.PAYROLL_MANAGER)
  async findPayType(@Param('id') id: string) {
    return this.payrollConfigurationService.getPayTypes(id);
  }

  @Delete('pay-types/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.PAYROLL_SPECIALIST, SystemRole.PAYROLL_MANAGER)
  async deletePayType(@Param('id') id: string) {
    return this.payrollConfigurationService.removePayTypes(id);
  }

  @Put('pay-types/:id/approve')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.PAYROLL_MANAGER)
  async approvePayType(@Param('id') id: string) {
    return this.payrollConfigurationService.approvePayType(id);
  }

  @Put('pay-types/:id/reject')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.PAYROLL_MANAGER)
  async rejectPayType(@Param('id') id: string) {
    return this.payrollConfigurationService.rejectPayType(id);
  }


  // -------------------
  // ALLOWANCES
  // -------------------

  @Post('allowances')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.PAYROLL_SPECIALIST, SystemRole.PAYROLL_MANAGER)
  async createAllowance(@Body() allowanceData: createAllowanceDto) {
    return this.payrollConfigurationService.createAllowance(allowanceData);
  }

  @Get('allowances')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.PAYROLL_SPECIALIST, SystemRole.PAYROLL_MANAGER)
  async getAllAllowances() {
    return this.payrollConfigurationService.findAllAllowances();
  }

  @Delete('allowances/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.PAYROLL_SPECIALIST, SystemRole.PAYROLL_MANAGER)
  async deleteAllowance(@Param('id') id: string) {
    return this.payrollConfigurationService.removeAllowance(id);
  }

  @Put('allowances/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.PAYROLL_SPECIALIST, SystemRole.PAYROLL_MANAGER)
  async editAllowance(@Param('id') id: string, @Body() updateData: createAllowanceDto) {
    return this.payrollConfigurationService.editAllowance(id, updateData);
  }

  @Get('allowances/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.PAYROLL_SPECIALIST, SystemRole.PAYROLL_MANAGER)
  async findAllowance(@Param('id') id: string) {
    return this.payrollConfigurationService.getAllowance(id);
  }

  @Put('allowances/:id/approve')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.PAYROLL_MANAGER)
  async approveAllowance(@Param('id') id: string) {
    return this.payrollConfigurationService.approveAllowance(id);
  }

  @Put('allowances/:id/reject')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.PAYROLL_MANAGER)
  async rejectAllowance(@Param('id') id: string) {
    return this.payrollConfigurationService.rejectAllowance(id);
  }


  // -------------------
  // SIGNING BONUSES
  // -------------------

  @Post('signing-bonuses')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.PAYROLL_SPECIALIST, SystemRole.PAYROLL_MANAGER)
  async createSigningBonus(@Body() bonusData: createsigningBonusesDTO) {
    return this.payrollConfigurationService.createSigningBonuses(bonusData);
  }

  @Put('signing-bonuses/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.PAYROLL_SPECIALIST, SystemRole.PAYROLL_MANAGER)
  async editSigningBonus(@Param('id') id: string, @Body() updateData: editsigningBonusDTO) {
    return this.payrollConfigurationService.editsigningBonus(id, updateData);
  }

  @Delete('signing-bonuses/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.PAYROLL_SPECIALIST, SystemRole.PAYROLL_MANAGER)
  async deleteSigningBonus(@Param('id') id: string) {
    return this.payrollConfigurationService.removeSigningBonuses(id);
  }

  @Get('signing-bonuses/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.PAYROLL_SPECIALIST, SystemRole.PAYROLL_MANAGER)
  async findSigningBonus(@Param('id') id: string) {
    return this.payrollConfigurationService.findSigningBonuses(id);
  }

  @Get('signing-bonuses')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.PAYROLL_SPECIALIST, SystemRole.PAYROLL_MANAGER)
  async getAllSigningBonuses() {
    return this.payrollConfigurationService.findAllSigningBonuses();
  }

  @Put('signing-bonuses/:id/approve')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.PAYROLL_MANAGER)
  async approveSigningBonus(@Param('id') id: string) {
    return this.payrollConfigurationService.approveSigningBonus(id);
  }

  @Put('signing-bonuses/:id/reject')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.PAYROLL_MANAGER)
  async rejectSigningBonus(@Param('id') id: string) {
    return this.payrollConfigurationService.rejectSigningBonus(id);
  }




  // -------------------
  // PAYROLL CONFIGURATION (PAYROLL MANAGER FACING)
  // -------------------

  @Get('policies')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.PAYROLL_MANAGER, SystemRole.PAYROLL_SPECIALIST)
  async listPayrollPolicies(): Promise<payrollPoliciesDocument[]> {
    return this.payrollConfigurationService.listPayrollPolicies();
  }

  @Put('policies:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.PAYROLL_MANAGER)
  async updatePayrollConfiguration(
    @Param('id') id: string,
    @Body() updateData: updatePayrollPoliciesDto,
  ): Promise<payrollPoliciesDocument | null> {
    return this.payrollConfigurationService.updatePolicy(id, updateData);
  }

  //?????
  @Put(':id/approve')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.PAYROLL_MANAGER)
  async approvePayrollConfiguration(@Param('id') id: string) {
    return this.payrollConfigurationService.approvePayrollPolicy(id);
  }

  @Put(':id/reject')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.PAYROLL_MANAGER)
  async rejectPayrollConfiguration(@Param('id') id: string) {
    return this.payrollConfigurationService.rejectPayrollPolicy(id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.PAYROLL_MANAGER)
  async deletePayrollConfiguration(@Param('id') id: string): Promise<payrollPoliciesDocument | null> {
    return this.payrollConfigurationService.deletePolicy(id);
  }

  // -------------------
  // INSURANCE BRACKETS
  // -------------------

  @Get('insurance-brackets')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.PAYROLL_SPECIALIST, SystemRole.HR_MANAGER, SystemRole.PAYROLL_MANAGER)
  async listInsuranceBrackets() {
    return this.payrollConfigurationService.findAllInsuranceBrackets();
  }


  @Get('insurance-brackets/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.PAYROLL_SPECIALIST, SystemRole.HR_MANAGER, SystemRole.PAYROLL_MANAGER)
  async findInsuranceBracket(@Param('id') id: string) {
    return this.payrollConfigurationService.findInsuranceBrackets(id);
  }

  @Post('insurance-brackets')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.PAYROLL_SPECIALIST, SystemRole.HR_MANAGER)
  async createInsuranceBracket(@Body() bracketData: createInsuranceBracketsDTO) {
    return this.payrollConfigurationService.createInsuranceBrackets(bracketData);
  }

  @Put('insurance-brackets/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.PAYROLL_SPECIALIST, SystemRole.HR_MANAGER)
  async editInsuranceBracket(
    @Param('id') id: string,
    @Body() updateData: editInsuranceBracketsDTO
  ) {
    return this.payrollConfigurationService.editInsuranceBrackets(id, updateData);
  }

  @Delete('insurance-brackets/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.HR_MANAGER)
  async removeInsuranceBracket(@Param('id') id: string) {
    return this.payrollConfigurationService.removeInsuranceBrackets(id);
  }

  // -------------------
  // TERMINATION & RESIGNATION BENEFITS
  // -------------------

  @Get('termination-resignation-benefits')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.PAYROLL_SPECIALIST, SystemRole.PAYROLL_MANAGER)
  async getAllTerminationAndResignationBenefits() {
    return this.payrollConfigurationService.getAllTerminationAndResignationBenefits();
  }

  @Get('termination-resignation-benefits/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.PAYROLL_SPECIALIST, SystemRole.PAYROLL_MANAGER)
  async getTerminationAndResignationBenefitById(@Param('id') id: string) {
    return this.payrollConfigurationService.getTerminationAndResignationBenefitById(id);
  }

  @Post('termination-resignation-benefits')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.PAYROLL_SPECIALIST, SystemRole.PAYROLL_MANAGER)
  async createTerminationAndResignationBenefit(@Body() benefitsData: createResigAndTerminBenefitsDTO) {
    return this.payrollConfigurationService.createTerminationAndResignationBenefit(benefitsData);
  }

  @Put('termination-resignation-benefits/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.PAYROLL_SPECIALIST, SystemRole.PAYROLL_MANAGER)
  async updateTerminationAndResignationBenefit(
    @Param('id') id: string,
    @Body() updateData: createResigAndTerminBenefitsDTO
  ) {
    return this.payrollConfigurationService.updateTerminationAndResignationBenefit(id, updateData);
  }

  @Delete('termination-resignation-benefits/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.PAYROLL_SPECIALIST, SystemRole.PAYROLL_MANAGER)
  async deleteTerminationAndResignationBenefit(@Param('id') id: string) {
    return this.payrollConfigurationService.deleteTerminationAndResignationBenefit(id);
  }

  @Put('termination-resignation-benefits/:id/approve')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.PAYROLL_MANAGER)
  async approveTerminationBenefit(@Param('id') id: string) {
    return this.payrollConfigurationService.approveTerminationAndResignationBenefit(id);
  }

  @Put('termination-resignation-benefits/:id/reject')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.PAYROLL_MANAGER)
  async rejectTerminationBenefit(@Param('id') id: string) {
    return this.payrollConfigurationService.rejectTerminationAndResignationBenefit(id);
  }


  // -------------------
  // HR MANAGER INSURANCE APPROVAL
  // -------------------

  @Get('hr-manager/insurance-brackets')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.HR_MANAGER)
  async getAllInsuranceBracketsForHR() {
    return this.payrollConfigurationService.findAllInsuranceBrackets();
  }

  @Get('hr-manager/insurance-brackets/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.HR_MANAGER)
  async getInsuranceBracketForHR(@Param('id') id: string) {
    return this.payrollConfigurationService.findInsuranceBrackets(id);
  }

  @Get('hr-manager/policies')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.HR_MANAGER)
  async getAllPoliciesForHR(): Promise<payrollPoliciesDocument[]> {
    return this.payrollConfigurationService.findAllPolicies();
  }

  @Get('hr-manager/policies/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.HR_MANAGER)
  async getPolicyForHR(@Param('id') id: string): Promise<payrollPoliciesDocument | null> {
    return this.payrollConfigurationService.findById(id);
  }

  @Post('approve/insurance/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.HR_MANAGER)
  async approveInsurance(@Param('id') id: string, @Req() req: Request) {
    const user: any = req['user'];
    return this.payrollConfigurationService.hrApproveInsurance(id, user.employeeId);
  }

  @Post('reject/insurance/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.HR_MANAGER)
  async rejectInsurance(@Param('id') id: string, @Req() req: Request) {
    const user: any = req['user'];
    return this.payrollConfigurationService.hrRejectInsurance(id, user.employeeId);
  }

  @Post('approve/policy/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.HR_MANAGER)
  async approvePolicy(@Param('id') id: string, @Req() req: Request) {
    const user: any = req['user'];
    return this.payrollConfigurationService.hrApprovePolicy(id, user.employeeId);
  }

  @Post('reject/policy/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.HR_MANAGER)
  async rejectPolicy(@Param('id') id: string, @Req() req: Request) {
    const user: any = req['user'];
    return this.payrollConfigurationService.hrRejectPolicy(id, user.employeeId);
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
  // TAX DOCUMENTS (EMPLOYEE DOWNLOAD / LEGAL & POLICY ADMIN CREATION)
  // -------------------
  @Post('tax-documents')
  @UseGuards(AuthGuard, RolesGuard)
@Roles(SystemRole.LEGAL_POLICY_ADMIN)
  createTaxDocument(@Body() dto: CreateTaxDocumentDto) {
    return this.payrollConfigurationService.createTaxDocument(dto);
  }

  @Get('tax-documents/:employeeId')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(
    SystemRole.DEPARTMENT_EMPLOYEE,
    SystemRole.PAYROLL_MANAGER,
    SystemRole.PAYROLL_SPECIALIST,
    SystemRole.HR_MANAGER,
    SystemRole.LEGAL_POLICY_ADMIN
  )
  listTaxDocuments(@Param('employeeId') employeeId: string) {
    return this.payrollConfigurationService.listTaxDocumentsForEmployee(employeeId);
  }


  // -------------------
  // BACKUP
  // -------------------
  @Get('backup')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.SYSTEM_ADMIN)
  backup() {
    return this.payrollConfigurationService.backupPayrollData();
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
  // SYSTEM ADMIN - BACKUP
  // -------------------

  @Post('backup')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(SystemRole.SYSTEM_ADMIN)
  async backupPayrollData() {
    return this.payrollConfigurationService.backupPayrollData();
  }
}
