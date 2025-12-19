import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
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
import { TaxDocument, TaxDocumentDocument } from './models/taxDocument.schema';
import { PayrollDispute, PayrollDisputeDocument } from './models/payrollDispute.schema';
import { CreateTaxDocumentDto } from './dto/create-tax-document.dto';
import { CreatePayrollDisputeDto } from './dto/create-payroll-dispute.dto';

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
import { ConfigStatus } from './enums/payroll-configuration-enums';
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
        @InjectModel(TaxDocument.name) private taxDocumentModel: Mongoose.Model<TaxDocumentDocument>,
        @InjectModel(PayrollDispute.name) private payrollDisputeModel: Mongoose.Model<PayrollDisputeDocument>,
    ) {}


    /////////// PAYROLL SPECIALIST METHODS ///////////////


    /////1- config payroll policies
    async findAllPolicies(): Promise<payrollPoliciesDocument[]> {
        return this.payrollPoliciesModel.find().exec();
    }

    async findById(id: string): Promise<payrollPoliciesDocument|null> {
        return await this.payrollPoliciesModel.findById(id).exec();
    }

    async listPayrollPolicies(): Promise<payrollPoliciesDocument[]> {
        return this.payrollPoliciesModel.find().exec();
    }

    async createPolicy(policyData: createPayrollPoliciesDto): Promise<payrollPoliciesDocument> {
        const fallbackStatus = (policyData as any).ConfigStatus as ConfigStatus | undefined;
        const payload = {
            ...policyData,
            status: policyData.status ?? fallbackStatus ?? ConfigStatus.DRAFT,
        };
        const newPolicy = new this.payrollPoliciesModel(payload);
        return newPolicy.save();
    }

    async updatePolicy(id: string, updateData: updatePayrollPoliciesDto): Promise<payrollPoliciesDocument|null> {
        const existing = await this.payrollPoliciesModel.findById(id).exec();
        if (!existing) {
            return null;
        }
        if (existing.status !== ConfigStatus.DRAFT) {
            throw new Error('Only draft payroll configurations can be edited');
        }
        const { status, ...safeUpdate } = updateData;
        return await this.payrollPoliciesModel.findByIdAndUpdate(id, safeUpdate, { new: true });  
    }



    async deletePolicy(id: string): Promise<payrollPoliciesDocument|null> {
        return await this.payrollPoliciesModel.findByIdAndDelete(id); 
    }

  async approvePayrollPolicy(id: string): Promise<payrollPoliciesDocument | null> {
    const policy = await this.payrollPoliciesModel.findById(id).exec();
    if (!policy) return null;
    if (policy.status !== ConfigStatus.DRAFT) {
      throw new Error('Only draft payroll configurations can be approved');
    }
    policy.status = ConfigStatus.APPROVED;
    policy.approvedAt = new Date();
    return policy.save();
  }

  async rejectPayrollPolicy(id: string): Promise<payrollPoliciesDocument | null> {
    const policy = await this.payrollPoliciesModel.findById(id).exec();
    if (!policy) return null;
    if (policy.status !== ConfigStatus.DRAFT) {
      throw new Error('Only draft payroll configurations can be rejected');
    }
    policy.status = ConfigStatus.REJECTED;
    policy.approvedAt = new Date();
    return policy.save();
  }


    //////2- config pay grades


    async getPayGrade(id: string): Promise<payGradeDocument|null> {
      return await this.payGradeModel.findById(id);
    }

    async AddPayGrade(pg: addPayGradeDTO): Promise<payGradeDocument> {
      const pg2 = new this.payGradeModel(pg);
      try {
        return await pg2.save();
      } catch (err: any) {
        // Log full error to help diagnose which index or key caused the duplicate
        console.error('AddPayGrade error:', err);
        if (err?.code === 11000) {
          // Prefer explicit duplicate field if provided by Mongo (err.keyValue)
          const dup = err.keyValue?.grade ?? JSON.stringify(err.keyValue) ?? 'unknown';
          throw new ConflictException(`Pay grade with this name already exists: ${dup}`);
        }
        throw err;
      }
    }
    //only if draft
    async editPayGrade(pg: string, updateData: editPayGradeDTO): Promise<payGradeDocument|null> {
      const paygrade = await this.payGradeModel.findById(pg) as payGradeDocument | null;
      if (!paygrade) {
        throw new BadRequestException('Pay grade not found');
      }
      if (paygrade.status !== ConfigStatus.DRAFT) {
        throw new BadRequestException('Only draft pay grades can be edited');
      }
      const { status, ...safeUpdate } = updateData as any;
      return await this.payGradeModel.findByIdAndUpdate(pg, safeUpdate, { new: true });
    }

    async removePayGrade(pg: string): Promise<payGradeDocument | null> {
        return await this.payGradeModel.findByIdAndDelete(pg); 
    }

    async getAllPayGrades(): Promise<payGradeDocument[]> {
        return await this.payGradeModel.find().exec();
    }

    async approvePayGrade(id: string): Promise<payGradeDocument | null> {
      const paygrade = await this.payGradeModel.findById(id).exec();
      if (!paygrade) {
        return null;
      }
      if (paygrade.status !== ConfigStatus.DRAFT) {
        throw new BadRequestException('Only draft pay grades can be approved');
      }
      paygrade.status = ConfigStatus.APPROVED;
      paygrade.approvedAt = new Date();
      return paygrade.save();
    }

    async rejectPayGrade(id: string): Promise<payGradeDocument | null> {
      const paygrade = await this.payGradeModel.findById(id).exec();
      if (!paygrade) {
        return null;
      }
      if (paygrade.status !== ConfigStatus.DRAFT) {
        throw new BadRequestException('Only draft pay grades can be rejected');
      }
      paygrade.status = ConfigStatus.REJECTED;
      paygrade.approvedAt = new Date();
      return paygrade.save();
    }

/*
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
*/
  ///edit position function?




    /////////5- define employee paytypes according to employee agreement
    async getPayTypes (id: string): Promise <payTypeDocument|null>{
        return await this.payTypeModel.findById(id);
    }

    async getAllPayTypes(): Promise<payTypeDocument[]>{
        return await this.payTypeModel.find().exec();
    }

    //only if draft
    async editPayTypes (pt: string, updateData: editPayTypeDTO): Promise <payTypeDocument | null>{
      const paytype = await this.payTypeModel.findById(pt) as payTypeDocument | null;
      if (!paytype) {
        throw new BadRequestException('Pay type not found');
      }
      if (paytype.status !== ConfigStatus.DRAFT) {
        throw new BadRequestException('Only draft pay types can be edited');
      }
      const { status, ...safeUpdate } = updateData as any;
      try {
        return await this.payTypeModel.findByIdAndUpdate(pt, safeUpdate, { new: true });
      } catch (err: any) {
        if (err?.code === 11000) {
          const dup = err.keyValue?.type ?? JSON.stringify(err.keyValue) ?? 'unknown';
          throw new ConflictException(`Pay type with this name already exists: ${dup}`);
        }
        throw err;
      }
    }

    async approvePayType(id: string): Promise<payTypeDocument | null> {
      const paytype = await this.payTypeModel.findById(id).exec();
      if (!paytype) return null;
      if (paytype.status !== ConfigStatus.DRAFT) {
        throw new BadRequestException('Only draft pay types can be approved');
      }
      paytype.status = ConfigStatus.APPROVED;
      paytype.approvedAt = new Date();
      return paytype.save();
    }

    async rejectPayType(id: string): Promise<payTypeDocument | null> {
      const paytype = await this.payTypeModel.findById(id).exec();
      if (!paytype) return null;
      if (paytype.status !== ConfigStatus.DRAFT) {
        throw new BadRequestException('Only draft pay types can be rejected');
      }
      paytype.status = ConfigStatus.REJECTED;
      paytype.approvedAt = new Date();
      return paytype.save();
    }

    async createPayTypes (pt: createPayTypeDTO): Promise<payTypeDocument>{
        const newPayType = new this.payTypeModel(pt);
        return newPayType.save();
    }

    async removePayTypes (pt: string): Promise<payTypeDocument|null>{
        return await this.payTypeModel.findByIdAndDelete(pt);
    }




    //////7-set allowances
    async createAllowance(id: createAllowanceDto): Promise<allowanceDocument> {
        const newAllowance = new this.allowanceModel(id);
        return newAllowance.save();
    }

    async findAllAllowances(): Promise<allowanceDocument[]> {
        return this.allowanceModel.find().exec();
    }

    async getAllowance(id: string): Promise<allowanceDocument|null>{
        return await this.allowanceModel.findById(id);
    }

    async removeAllowance(id: string): Promise<allowanceDocument|null> {
        return await this.allowanceModel.findByIdAndDelete(id);  
    }

    async editAllowance(id: string, updateData: createAllowanceDto): Promise<allowanceDocument|null> {
      const allowance = await this.allowanceModel.findById(id) as allowanceDocument;
      if (allowance.status !== 'draft') {
        throw new Error('Only draft allowances can be edited');
      } else
      return await this.allowanceModel.findByIdAndUpdate(id, updateData, { new: true });  
    }

    async approveAllowance(id: string): Promise<allowanceDocument | null> {
      const allowance = await this.allowanceModel.findById(id).exec();
      if (!allowance) return null;
      if (allowance.status !== ConfigStatus.DRAFT) {
        throw new BadRequestException('Only draft allowances can be approved');
      }
      allowance.status = ConfigStatus.APPROVED;
      allowance.approvedAt = new Date();
      return allowance.save();
    }

    async rejectAllowance(id: string): Promise<allowanceDocument | null> {
      const allowance = await this.allowanceModel.findById(id).exec();
      if (!allowance) return null;
      if (allowance.status !== ConfigStatus.DRAFT) {
        throw new BadRequestException('Only draft allowances can be rejected');
      }
      allowance.status = ConfigStatus.REJECTED;
      allowance.approvedAt = new Date();
      return allowance.save();
    }



    //////19- config policies for signing bonuses
    async findSigningBonuses(id: string): Promise<signingBonusDocument|null>{
        return await this.signingBonusModel.findById(id)
    }

    //only if draft
    async editsigningBonus(id: string, updateData: editsigningBonusDTO): Promise<signingBonusDocument|null>{
      const signingBonus = await this.signingBonusModel.findById(id) as signingBonusDocument;
      if (signingBonus.status !== 'draft') {
        throw new Error('Only draft signing bonuses can be edited');
      } else
      return await this.signingBonusModel.findByIdAndUpdate(id, updateData, { new: true });
    }

    async createSigningBonuses(id:createsigningBonusesDTO): Promise<signingBonusDocument|null>{
        const sb = new this.signingBonusModel(id);
        return sb.save();
    }

    async removeSigningBonuses(id: string): Promise<signingBonusDocument|null>{
        return this.signingBonusModel.findByIdAndDelete(id);
    }

    async approveSigningBonus(id: string): Promise<signingBonusDocument | null> {
      const bonus = await this.signingBonusModel.findById(id).exec();
      if (!bonus) return null;
      if (bonus.status !== ConfigStatus.DRAFT) {
        throw new BadRequestException('Only draft signing bonuses can be approved');
      }
      bonus.status = ConfigStatus.APPROVED;
      bonus.approvedAt = new Date();
      return bonus.save();
    }

    async rejectSigningBonus(id: string): Promise<signingBonusDocument | null> {
      const bonus = await this.signingBonusModel.findById(id).exec();
      if (!bonus) return null;
      if (bonus.status !== ConfigStatus.DRAFT) {
        throw new BadRequestException('Only draft signing bonuses can be rejected');
      }
      bonus.status = ConfigStatus.REJECTED;
      bonus.approvedAt = new Date();
      return bonus.save();
    }

    async findAllSigningBonuses(): Promise<signingBonusDocument[]> {
        return this.signingBonusModel.find().exec();
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
      const terminationAndResignationBenefits = await this.terminationAndResignationBenefitsModel.findById(id) as terminationAndResignationBenefitsDocument;
      if (terminationAndResignationBenefits.status !== 'draft') {
        throw new Error('Only draft termination and resignation benefits can be edited');
      }  
      return await this.terminationAndResignationBenefitsModel.findByIdAndUpdate(id, updateData, { new: true });
    }

    async approveTerminationAndResignationBenefit(id: string): Promise<terminationAndResignationBenefitsDocument | null> {
      const benefit = await this.terminationAndResignationBenefitsModel.findById(id).exec();
      if (!benefit) return null;
      if (benefit.status !== ConfigStatus.DRAFT) {
        throw new BadRequestException('Only draft termination/resignation benefits can be approved');
      }
      benefit.status = ConfigStatus.APPROVED;
      benefit.approvedAt = new Date();
      return benefit.save();
    }

    async rejectTerminationAndResignationBenefit(id: string): Promise<terminationAndResignationBenefitsDocument | null> {
      const benefit = await this.terminationAndResignationBenefitsModel.findById(id).exec();
      if (!benefit) return null;
      if (benefit.status !== ConfigStatus.DRAFT) {
        throw new BadRequestException('Only draft termination/resignation benefits can be rejected');
      }
      benefit.status = ConfigStatus.REJECTED;
      benefit.approvedAt = new Date();
      return benefit.save();
    }


    ////////21- config insurance brackets w defined salary ranges
    async findAllInsuranceBrackets(): Promise<insuranceBracketsDocument[]> {
        return await this.insuranceBracketsModel.find().exec();
    }

    async findInsuranceBrackets(id: string): Promise<insuranceBracketsDocument|null>{
        return await this.insuranceBracketsModel.findById(id);
    }



    async createInsuranceBrackets(dto: createInsuranceBracketsDTO):Promise <insuranceBracketsDocument|null>{
        const payload = {
          ...dto,
          status: dto.status || ConfigStatus.DRAFT,
          employeeRate: dto.employeeRate,
          employerRate: dto.employerRate,
        };
        const ib = new this.insuranceBracketsModel(payload);
        return ib.save();
    }

    //only if draft
    async editInsuranceBrackets (id: string, updateData: editInsuranceBracketsDTO): Promise<insuranceBracketsDocument|null>{
      const insuranceBrackets = await this.insuranceBracketsModel.findById(id) as insuranceBracketsDocument;
      if (!insuranceBrackets) return null;
      if (insuranceBrackets.status !== ConfigStatus.DRAFT) {
        throw new Error('Only draft insurance brackets can be edited');
      }
      const payload = {
        ...updateData,
        employeeRate: updateData.employeeRate ?? insuranceBrackets.employeeRate,
        employerRate: updateData.employerRate ?? insuranceBrackets.employerRate,
      };
      return await this.insuranceBracketsModel.findByIdAndUpdate(id, payload, { new: true });
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

    return targetModel.findByIdAndUpdate(
      id,
      { status: ConfigStatus.APPROVED, approvedAt: new Date() },
      { new: true }
    );
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

    return targetModel.findByIdAndUpdate(
      id,
      { status: ConfigStatus.REJECTED, approvedAt: new Date() },
      { new: true },
    );
  }

  // -------------------
  // PHASE 5 – HR MANAGER INSURANCE APPROVAL
  // -------------------

  async hrApproveInsurance(id: string, approvedBy?: string) {
    return this.insuranceBracketsModel.findByIdAndUpdate(
      id, 
      { 
        status: ConfigStatus.APPROVED,
        approvedBy: approvedBy ? new Mongoose.Types.ObjectId(approvedBy) : undefined,
        approvedAt: new Date()
      }, 
      { new: true }
    );
  }

  async hrRejectInsurance(id: string, approvedBy?: string) {
    return this.insuranceBracketsModel.findByIdAndUpdate(
      id, 
      { 
        status: ConfigStatus.REJECTED,
        approvedBy: approvedBy ? new Mongoose.Types.ObjectId(approvedBy) : undefined,
        approvedAt: new Date()
      }, 
      { new: true }
    );
  }

  // HR MANAGER POLICY APPROVAL
  async hrApprovePolicy(id: string, approvedBy: string) {
    return this.payrollPoliciesModel.findByIdAndUpdate(
      id, 
      { 
        status: ConfigStatus.APPROVED,
        approvedBy: new Mongoose.Types.ObjectId(approvedBy),
        approvedAt: new Date()
      }, 
      { new: true }
    );
  }

  async hrRejectPolicy(id: string, approvedBy: string) {
    return this.payrollPoliciesModel.findByIdAndUpdate(
      id, 
      { 
        status: ConfigStatus.REJECTED,
        approvedBy: new Mongoose.Types.ObjectId(approvedBy),
        approvedAt: new Date()
      }, 
      { new: true }
    );
  }

  // -------------------
  // COMPANY SETTINGS (SYSTEM ADMIN)
  // -------------------

  async create(dto: CreateCompanySettingsDto) {
    const newSettings = new this.companyWideSettingsModel({
      ...dto,
      status: dto.status || ConfigStatus.DRAFT,
      payCycle: dto.payCycle || 'monthly',
    });
    return newSettings.save();
  }

  async findAll() {
    return this.companyWideSettingsModel.find().exec();
  }

  async findOne(id: string) {
    return this.companyWideSettingsModel.findById(id).exec();
  }


  async update(id: string, dto: UpdateCompanySettingsDto) {
    const existing = await this.companyWideSettingsModel.findById(id).exec();
    if (!existing) return null;
    if (existing.status !== ConfigStatus.DRAFT) {
      throw new Error('Only draft company settings can be edited');
    }
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

    const status = action === 'approve' ? ConfigStatus.APPROVED : ConfigStatus.REJECTED;
    return targetModel.findByIdAndUpdate(
      id,
      { status, approvedAt: new Date() },
      { new: true },
    );
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
    const newTaxRule = new this.taxRulesModel({
      ...taxRuleData,
      status: ConfigStatus.DRAFT,
    });
    return newTaxRule.save();
  }

  async updateTaxRule(id: string, updateData: editTaxRulesDTO): Promise<taxRulesDocument | null> {
    const taxRule = await this.taxRulesModel.findById(id) as taxRulesDocument;
    if (!taxRule) {
      throw new BadRequestException('Tax rule not found');
    }
    if (taxRule.status !== ConfigStatus.DRAFT) {
      throw new BadRequestException('Only draft tax rules can be updated');
    }
    return this.taxRulesModel.findByIdAndUpdate(
      id,
      { ...updateData, status: ConfigStatus.DRAFT },
      { new: true },
    ).exec();
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
    const benefit = await this.terminationAndResignationBenefitsModel.findById(id) as terminationAndResignationBenefitsDocument;
    if (benefit.status !== 'draft') {
      throw new Error('Only draft termination and resignation benefits can be updated');
    } else
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

  // -------------------
  // TAX DOCUMENTS (EMPLOYEE DOWNLOAD)
  // -------------------
  async createTaxDocument(dto: CreateTaxDocumentDto): Promise<TaxDocumentDocument> {
    const doc = new this.taxDocumentModel(dto);
    return doc.save();
  }

  async listTaxDocumentsForEmployee(employeeId: string): Promise<TaxDocumentDocument[]> {
    return this.taxDocumentModel.find({ employeeId }).exec();
  }


}




