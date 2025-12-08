import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as Mongoose from 'mongoose';

import { allowance, allowanceDocument } from './models/allowance.schema';
import { CompanyWideSettings, CompanyWideSettingsDocument } from './models/CompanyWideSettings.schema';
import { insuranceBrackets, insuranceBracketsDocument } from './models/insuranceBrackets.schema';
import { payGrade, payGradeDocument } from './models/payGrades.schema';
import { payrollPolicies, payrollPoliciesDocument } from './models/payrollPolicies.schema';
import { payType, payTypeDocument } from './models/payType.schema';
import { signingBonus, signingBonusDocument } from './models/signingBonus.schema';
import { taxRules, taxRulesDocument } from './models/taxRules.schema';
import { terminationAndResignationBenefits, terminationAndResignationBenefitsDocument } from './models/terminationAndResignationBenefits';

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
import { CreateCompanySettingsDto } from './dto/create-company-settings.dto';
import { UpdateCompanySettingsDto } from './dto/UpdateCompanySettings.dto';
import { ApprovalDto } from './dto/approval.dto';
import { createTaxRulesDTO } from './dto/create-tax-rules.dto';
import { editTaxRulesDTO } from './dto/edit-tax-rules.dto';


@Injectable()
export class PayrollConfigurationService 
{
    constructor( 
        @InjectModel(payrollPolicies.name) private payrollPoliciesModel: Mongoose.Model<payrollPoliciesDocument>,
        @InjectModel(payGrade.name) private payGradeModel: Mongoose.Model<payGradeDocument>,
        @InjectModel(allowance.name) private allowanceModel: Mongoose.Model<allowanceDocument>,
        @InjectModel(CompanyWideSettings.name) private companyWideSettingsModel: Mongoose.Model<CompanyWideSettingsDocument>,
        @InjectModel(insuranceBrackets.name) private insuranceBracketsModel: Mongoose.Model<insuranceBracketsDocument>,
        @InjectModel(payType.name) private payTypeModel: Mongoose.Model<payTypeDocument>,
        @InjectModel(signingBonus.name) private signingBonusModel: Mongoose.Model<signingBonusDocument>,
        @InjectModel(taxRules.name) private taxRulesModel: Mongoose.Model<taxRulesDocument>,
        @InjectModel(terminationAndResignationBenefits.name) private terminationAndResignationBenefitsModel: Mongoose.Model<terminationAndResignationBenefitsDocument>,
    ) {}


    /////////// PAYROLL SPECIALIST METHODS ///////////////


    /////1- config payroll policies
    async findAllPolicies(): Promise<payrollPoliciesDocument[]> {
        return this.payrollPoliciesModel.find().exec();
    }

    async findById(id: string): Promise<payrollPoliciesDocument|null> {
        return await this.payrollPoliciesModel.findById(id).exec();
    }

    async createPolicy(policyData: createPayrollPoliciesDto): Promise<payrollPoliciesDocument> {
        const newPolicy = new this.payrollPoliciesModel(policyData);
        return newPolicy.save();
    }

    async updatePolicy(id: string, updateData: updatePayrollPoliciesDto): Promise<payrollPoliciesDocument|null> {
        return await this.payrollPoliciesModel.findByIdAndUpdate(id, updateData, { new: true });  
    }

    async deletePolicy(id: string): Promise<payrollPoliciesDocument|null> {
        return await this.payrollPoliciesModel.findByIdAndDelete(id); 
    }


    //////2- config pay grades
    async getPayGrade(id: string): Promise<payGradeDocument|null> {
        return await this.payGradeModel.findById({ id });
    }

    async AddPayGrade(pg: addPayGradeDTO): Promise<payGradeDocument|null> {
        const newpg = new this.payGradeModel(payGrade);
        return newpg.save();
    }

    async editPayGrade(pg: string, updateData: editPayGradeDTO): Promise<payGradeDocument|null> {
        return await this.payGradeModel.findByIdAndUpdate(pg, updateData, { new: true });  
    }

    async remove(pg: string): Promise<payGradeDocument | null> {
        return await this.payGradeModel.findByIdAndDelete(pg); 
    }

        //plsss go back to this!!!!!
  async calculateGrossSalary(payGradeId: string, allowanceId: string): Promise<number> {
    const payGrade = await this.payGradeModel.findById(payGradeId).exec();
    if (!payGrade) 
        throw new Error('PayGrade not found');
    const allowance = await this.allowanceModel.findById(allowanceId).exec();
    if (!allowance) 
        throw new Error('Allowance not found');
    const grossSalary = payGrade.baseSalary + allowance.amount;
    payGrade.grossSalary = grossSalary;
    await payGrade.save();
    return grossSalary;
  }

  ///edit position function?




    /////////5- define employee paytypes according to employee agreement
    async getPayTypes (id: string): Promise <payTypeDocument|null>{
        return await this.payTypeModel.findById(id);
    }

    async getAllPayTypes(): Promise<payTypeDocument[]>{
        return await this.payTypeModel.find().exec();
    }

    async editPayTypes (pt: string, updateData: editPayTypeDTO): Promise <payTypeDocument | null>{
        return await this.payTypeModel.findByIdAndUpdate(pt, updateData, { new: true });  
    }

    async createPayTypes (pt: createPayTypeDTO): Promise<payTypeDocument>{
        const newPayType = new this.payTypeModel(pt);
        return newPayType.save();
    }

    async removePayType (pt: string): Promise<payTypeDocument|null>{
        return await this.payTypeModel.findByIdAndDelete(pt);
    }




    //////7-set allowances
    async createAllowance(id: createAllowanceDto): Promise<allowanceDocument> {
        const newAllowance = new this.allowanceModel(id);
        return newAllowance.save();
    }

    async getAllowance(id: string): Promise<allowanceDocument|null>{
        return await this.allowanceModel.findById(id);
    }

    async removeAllowance(id: string): Promise<allowanceDocument|null> {
        return await this.allowanceModel.findByIdAndDelete(id);  
    }



    //////19- config policies for signing bonuses
    async findSigningBonuses(id: string): Promise<signingBonusDocument|null>{
        return await this.signingBonusModel.findById(id)
    }

    async editsigningBonus(id: string, updateData: editsigningBonusDTO): Promise<signingBonusDocument|null>{
        return await this.signingBonusModel.findByIdAndUpdate(id, updateData, { new: true });
    }

    async createSigningBonuses(id:createsigningBonusesDTO): Promise<signingBonusDocument|null>{
        const sb = new this.signingBonusModel(id);
        return sb.save();
    }

    async removeSigningBonuses(id: string): Promise<signingBonusDocument|null>{
        return this.signingBonusModel.findByIdAndDelete(id);
    }



    //////20- config resignation and termination benefits

    async createTerminationAndResignationBenefits(id: createResigAndTerminBenefitsDTO):Promise<terminationAndResignationBenefitsDocument> {
        const newTerminationAndResignationBenefits = new this.terminationAndResignationBenefitsModel(id);
        return newTerminationAndResignationBenefits.save();
    }

    async removeTerminationAndResignationBenefits(id: string): Promise<terminationAndResignationBenefitsDocument | null> {
        return await this.terminationAndResignationBenefitsModel.findByIdAndDelete(id);  
    }

    async findAllTerminationAndResignationBenefits(): Promise<terminationAndResignationBenefitsDocument[]> {
        return this.terminationAndResignationBenefitsModel.find().exec();
    }

    async findTerminationAndResignationBenefitsById(id: string): Promise<terminationAndResignationBenefitsDocument | null> {
        return await this.terminationAndResignationBenefitsModel.findById(id)
    }

    async updateTerminationAndResignationBenefits(id: string, updateData: createResigAndTerminBenefitsDTO): Promise<terminationAndResignationBenefitsDocument | null> {
        return await this.terminationAndResignationBenefitsModel.findByIdAndUpdate(id, updateData, { new: true });
    }


    ////////21- config insurance brackets w defined salary ranges
    async findInsuranceBrackets(id: string): Promise<insuranceBracketsDocument|null>{
        return await this.insuranceBracketsModel.findById(id);
    }

    async createInsuranceBrackets(id: createInsuranceBracketsDTO):Promise <insuranceBracketsDocument|null>{
        const ib = new this.insuranceBracketsModel(id);
        return ib.save();
    }

    async editInsuranceBrackets (id: string, updateData: editInsuranceBracketsDTO): Promise<insuranceBracketsDocument|null>{
        return await this.insuranceBracketsModel.findByIdAndUpdate(id, updateData, { new: true });
    }

    async removeInsuranceBrackets(id: string): Promise<insuranceBracketsDocument|null>{
        return await this.insuranceBracketsModel.findByIdAndDelete(id);
    }

    //calculate employee & employer social insurance
    //not saved to db fa ask ab that
    calculateInsurance(employeeRate: number, minSalary: number, maxSalary: number): number {
    const salaryRange = maxSalary - minSalary;
    const socialInsurance = employeeRate * salaryRange;
    return socialInsurance;
    }




  // -------------------
  // PHASE 4 – PAYROLL MANAGER APPROVALS
  // -------------------

  async payrollManagerApprove(model: string, id: string) {
    // Map model name to Mongoose model
    const modelsMap: Record<string, Mongoose.Model<any>> = {
      payrollPolicies: this.payrollPoliciesModel,
      payGrade: this.payGradeModel,
      payType: this.payTypeModel,
      allowance: this.allowanceModel,
      signingBonus: this.signingBonusModel,
      terminationBenefits: this.terminationAndResignationBenefitsModel,
    };

    const targetModel = modelsMap[model];
    if (!targetModel) throw new Error(`Model ${model} not found`);

    return targetModel.findByIdAndUpdate(id, { approvalStatus: 'approved' }, { new: true });
  }

  async payrollManagerReject(model: string, id: string) {
    const modelsMap: Record<string, Mongoose.Model<any>> = {
      payrollPolicies: this.payrollPoliciesModel,
      payGrade: this.payGradeModel,
      payType: this.payTypeModel,
      allowance: this.allowanceModel,
      signingBonus: this.signingBonusModel,
      terminationBenefits: this.terminationAndResignationBenefitsModel,
    };

    const targetModel = modelsMap[model];
    if (!targetModel) throw new Error(`Model ${model} not found`);

    return targetModel.findByIdAndUpdate(id, { approvalStatus: 'rejected' }, { new: true });
  }

  // -------------------
  // PHASE 5 – HR MANAGER INSURANCE APPROVAL
  // -------------------

  async hrApproveInsurance(id: string) {
    return this.insuranceBracketsModel.findByIdAndUpdate(id, { approvalStatus: 'approved' }, { new: true });
  }

  async hrRejectInsurance(id: string) {
    return this.insuranceBracketsModel.findByIdAndUpdate(id, { approvalStatus: 'rejected' }, { new: true });
  }

  // -------------------
  // COMPANY SETTINGS (SYSTEM ADMIN)
  // -------------------

  async create(dto: CreateCompanySettingsDto) {
    const newSettings = new this.companyWideSettingsModel(dto);
    return newSettings.save();
  }

  async findAll() {
    return this.companyWideSettingsModel.find().exec();
  }

  async findOne(id: string) {
    return this.companyWideSettingsModel.findById(id).exec();
  }

  async update(id: string, dto: UpdateCompanySettingsDto) {
    return this.companyWideSettingsModel.findByIdAndUpdate(id, dto, { new: true });
  }

  async delete(id: string) {
    return this.companyWideSettingsModel.findByIdAndDelete(id);
  }

  // -------------------
  // GENERAL APPROVAL/REJECTION
  // -------------------

  async approveOrReject(dto: ApprovalDto) {
    const { model, id, action } = dto;
    const modelsMap: Record<string, Mongoose.Model<any>> = {
      payrollPolicies: this.payrollPoliciesModel,
      payGrade: this.payGradeModel,
      payType: this.payTypeModel,
      allowance: this.allowanceModel,
      signingBonus: this.signingBonusModel,
      terminationBenefits: this.terminationAndResignationBenefitsModel,
      insurance: this.insuranceBracketsModel,
      companySettings: this.companyWideSettingsModel,
    };

    const targetModel = modelsMap[model];
    if (!targetModel) throw new Error(`Model ${model} not found`);

    const status = action === 'approve' ? 'approved' : 'rejected';
    return targetModel.findByIdAndUpdate(id, { approvalStatus: status }, { new: true });
  }

  // -------------------
  // LEGAL & POLICY ADMIN - TAX RULES
  // -------------------

  async findAllTaxRules(): Promise<taxRulesDocument[]> {
    return this.taxRulesModel.find().exec();
  }

  async findTaxRuleById(id: string): Promise<taxRulesDocument | null> {
    return this.taxRulesModel.findById(id).exec();
  }

  async createTaxRule(taxRuleData: createTaxRulesDTO): Promise<taxRulesDocument> {
    const newTaxRule = new this.taxRulesModel(taxRuleData);
    return newTaxRule.save();
  }

  async updateTaxRule(id: string, updateData: editTaxRulesDTO): Promise<taxRulesDocument | null> {
    return this.taxRulesModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
  }

  async deleteTaxRule(id: string): Promise<taxRulesDocument | null> {
    return this.taxRulesModel.findByIdAndDelete(id).exec();
  }

  // -------------------
  // PAYROLL SPECIALIST - TERMINATION & RESIGNATION BENEFITS
  // -------------------

  async getAllTerminationAndResignationBenefits(): Promise<terminationAndResignationBenefitsDocument[]> {
    return this.terminationAndResignationBenefitsModel.find().exec();
  }

  async getTerminationAndResignationBenefitById(id: string): Promise<terminationAndResignationBenefitsDocument | null> {
    return this.terminationAndResignationBenefitsModel.findById(id).exec();
  }

  async createTerminationAndResignationBenefit(data: createResigAndTerminBenefitsDTO): Promise<terminationAndResignationBenefitsDocument> {
    const newBenefit = new this.terminationAndResignationBenefitsModel(data);
    return newBenefit.save();
  }

  async updateTerminationAndResignationBenefit(id: string, updateData: createResigAndTerminBenefitsDTO): Promise<terminationAndResignationBenefitsDocument | null> {
    return this.terminationAndResignationBenefitsModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
  }

  async deleteTerminationAndResignationBenefit(id: string): Promise<terminationAndResignationBenefitsDocument | null> {
    return this.terminationAndResignationBenefitsModel.findByIdAndDelete(id).exec();
  }

  // -------------------
  // SYSTEM ADMIN - BACKUP FUNCTIONALITY
  // -------------------

  async backupPayrollData(): Promise<{
    policies: any[];
    payGrades: any[];
    payTypes: any[];
    allowances: any[];
    signingBonuses: any[];
    terminationBenefits: any[];
    insuranceBrackets: any[];
    taxRules: any[];
    companySettings: any[];
    timestamp: Date;
  }> {
    const [
      policies,
      payGrades,
      payTypes,
      allowances,
      signingBonuses,
      terminationBenefits,
      insuranceBrackets,
      taxRules,
      companySettings,
    ] = await Promise.all([
      this.payrollPoliciesModel.find().lean().exec(),
      this.payGradeModel.find().lean().exec(),
      this.payTypeModel.find().lean().exec(),
      this.allowanceModel.find().lean().exec(),
      this.signingBonusModel.find().lean().exec(),
      this.terminationAndResignationBenefitsModel.find().lean().exec(),
      this.insuranceBracketsModel.find().lean().exec(),
      this.taxRulesModel.find().lean().exec(),
      this.companyWideSettingsModel.find().lean().exec(),
    ]);

    return {
      policies,
      payGrades,
      payTypes,
      allowances,
      signingBonuses,
      terminationBenefits,
      insuranceBrackets,
      taxRules,
      companySettings,
      timestamp: new Date(),
    };
  }
}




