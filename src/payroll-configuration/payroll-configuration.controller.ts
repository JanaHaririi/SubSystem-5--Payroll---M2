import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';

import { PayrollConfigurationService } from './payroll-configuration.service'

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
//import employee roles w quards from auth


@Controller('auth')
export class PayrollConfigurationController {
    constructor(private readonly payrollConfigurationService: PayrollConfigurationService) {}

    //////////////PAYROLL SPECIALIST'S ROUTES///////////

    /////1- config payroll policies
    @Get('policies')
    async getAllPolicies(): Promise<payrollPoliciesDocument[]> {
        return this.payrollConfigurationService.findAllPolicies();
    }

    @Get('policies/:id')
    async getPolicyById(@Param('id') id: string): Promise<payrollPoliciesDocument | null> {
        return this.payrollConfigurationService.findById(id);
    }

    @Post('policies')
    async createPolicy(@Body() policyData: createPayrollPoliciesDto): Promise<payrollPoliciesDocument> {
        return this.payrollConfigurationService.createPolicy(policyData);
    }

    @Put('policies/:id')
    async updatePolicy(
        @Param('id') id: string,
        @Body() updateData: updatePayrollPoliciesDto
    ): Promise<payrollPoliciesDocument | null> {
        return this.payrollConfigurationService.updatePolicy(id, updateData);
    }

    @Delete('policies/:id')
    async deletePolicy(@Param('id') id: string): Promise<payrollPoliciesDocument | null> {
        return this.payrollConfigurationService.deletePolicy(id);
    }

    //////2- config pay grades
    @Get('pay-grades/:id')
    async getPayGrade(@Param('id') id: string) {
        return this.payrollConfigurationService.getPayGrade(id);
    }

    @Post('pay-grades')
    async addPayGrade(@Body() pg: addPayGradeDTO) {
        return this.payrollConfigurationService.AddPayGrade(pg);
    }

    @Put('pay-grades/:id')
    async editPayGrade(
        @Param('id') id: string,
        @Body() updateData: editPayGradeDTO
    ) {
        return this.payrollConfigurationService.editPayGrade(id, updateData);
    }

    @Delete('pay-grades/:id')
    async removePayGrade(@Param('id') id: string) {
        return this.payrollConfigurationService.remove(id);
    }

    @Get('pay-grades/:payGradeId/calculate-gross-salary')
    async calculateGrossSalary(
        @Param('payGradeId') payGradeId: string,
        @Query('allowanceId') allowanceId: string
    ): Promise<number> {
        return this.payrollConfigurationService.calculateGrossSalary(payGradeId, allowanceId);
    }

    //////5- define employee paytypes according to employee agreement
    @Get('pay-types')
    async getAllPayTypes() {
        return this.payrollConfigurationService.getAllPayTypes();
    }

    @Get('pay-types/:id')
    async getPayType(@Param('id') id: string) {
        return this.payrollConfigurationService.getPayTypes(id);
    }

    @Post('pay-types')
    async createPayType(@Body() pt: createPayTypeDTO) {
        return this.payrollConfigurationService.createPayTypes(pt);
    }

    @Put('pay-types/:id')
    async editPayType(
        @Param('id') id: string,
        @Body() updateData: editPayTypeDTO
    ) {
        return this.payrollConfigurationService.editPayTypes(id, updateData);
    }

    @Delete('pay-types/:id')
    async removePayType(@Param('id') id: string) {
        return this.payrollConfigurationService.removePayType(id);
    }

    //////7-set allowances
    @Get('allowances/:id')
    async getAllowance(@Param('id') id: string) {
        return this.payrollConfigurationService.getAllowance(id);
    }

    @Post('allowances')
    async createAllowance(@Body() allowanceData: createAllowanceDto) {
        return this.payrollConfigurationService.createAllowance(allowanceData);
    }

    @Delete('allowances/:id')
    async removeAllowance(@Param('id') id: string) {
        return this.payrollConfigurationService.removeAllowance(id);
    }

    //////19- config policies for signing bonuses
    @Get('signing-bonuses/:id')
    async findSigningBonus(@Param('id') id: string) {
        return this.payrollConfigurationService.findSigningBonuses(id);
    }

    @Post('signing-bonuses')
    async createSigningBonus(@Body() bonusData: createsigningBonusesDTO) {
        return this.payrollConfigurationService.createSigningBonuses(bonusData);
    }

    @Put('signing-bonuses/:id')
    async editSigningBonus(
        @Param('id') id: string,
        @Body() updateData: editsigningBonusDTO
    ) {
        return this.payrollConfigurationService.editsigningBonus(id, updateData);
    }

    @Delete('signing-bonuses/:id')
    async removeSigningBonus(@Param('id') id: string) {
        return this.payrollConfigurationService.removeSigningBonuses(id);
    }

    //////20- config resignation and termination benefits
    @Get('termination-resignation-benefits')
    async findAllTerminationAndResignationBenefits() {
        return this.payrollConfigurationService.findAllTerminationAndResignationBenefits();
    }

    @Get('termination-resignation-benefits/:id')
    async findTerminationAndResignationBenefitsById(@Param('id') id: string) {
        return this.payrollConfigurationService.findTerminationAndResignationBenefitsById(id);
    }

    @Post('termination-resignation-benefits')
    async createTerminationAndResignationBenefits(@Body() benefitsData: createResigAndTerminBenefitsDTO) {
        return this.payrollConfigurationService.createTerminationAndResignationBenefits(benefitsData);
    }

    @Put('termination-resignation-benefits/:id')
    async updateTerminationAndResignationBenefits(
        @Param('id') id: string,
        @Body() updateData: createResigAndTerminBenefitsDTO
    ) {
        return this.payrollConfigurationService.updateTerminationAndResignationBenefits(id, updateData);
    }

    @Delete('termination-resignation-benefits/:id')
    async removeTerminationAndResignationBenefits(@Param('id') id: string) {
        return this.payrollConfigurationService.removeTerminationAndResignationBenefits(id);
    }

    //////21- config insurance brackets w defined salary ranges
    @Get('insurance-brackets/:id')
    async findInsuranceBracket(@Param('id') id: string) {
        return this.payrollConfigurationService.findInsuranceBrackets(id);
    }

    @Post('insurance-brackets')
    async createInsuranceBracket(@Body() bracketData: createInsuranceBracketsDTO) {
        return this.payrollConfigurationService.createInsuranceBrackets(bracketData);
    }

    @Put('insurance-brackets/:id')
    async editInsuranceBracket(
        @Param('id') id: string,
        @Body() updateData: editInsuranceBracketsDTO
    ) {
        return this.payrollConfigurationService.editInsuranceBrackets(id, updateData);
    }

    @Delete('insurance-brackets/:id')
    async removeInsuranceBracket(@Param('id') id: string) {
        return this.payrollConfigurationService.removeInsuranceBrackets(id);
    }

    // @Post('insurance-brackets/calculate')
    // async calculateInsurance(
    //     @Body() data: { employeeRate: number; minSalary: number; maxSalary: number }
    // ): Promise<number> {
    //     return this.payrollConfigurationService.calculateInsurance(
    //         data.employeeRate,
    //         data.minSalary,
    //         data.maxSalary
    //     );
    // }

    /////////////////  PAYROLL MANAGER  /////////////////////

    ////////////////  HR MANAGER  /////////////////////////

    //////////////  SYSTEM ADMIN  /////////////////////////

    ///////////////  LAW ADMIN  //////////////////////////

}
