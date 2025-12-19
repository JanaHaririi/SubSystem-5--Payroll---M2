import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { payrollRuns } from './models/payrollRuns.schema';
import { employeePayrollDetails } from './models/employeePayrollDetails.schema';
import { employeePenalties } from './models/employeePenalties.schema';
import { employeeSigningBonus } from './models/EmployeeSigningBonus.schema';
import { EmployeeTerminationResignation } from './models/EmployeeTerminationResignation.schema';

import { PayRollStatus, BonusStatus, BenefitStatus, BankStatus } from './enums/payroll-execution-enum';
import { GeneratePayrollDraftDto } from './dto/generate-payroll-draft.dto';
import { Phase1_1BDto } from './dto/phase-1-1B.dto';

@Injectable()
export class PayrollPhase1_1BService {
  constructor(
    @InjectModel('payrollRuns')
    private payrollRunsModel: Model<payrollRuns>,

    @InjectModel('EmployeeProfile')
    private employeeProfileModel: Model<any>,

    @InjectModel('employeePayrollDetails')
    private payrollDetailsModel: Model<employeePayrollDetails>,

    @InjectModel('employeePenalties')
    private penaltiesModel: Model<employeePenalties>,

    @InjectModel('employeeSigningBonus')
    private signingBonusModel: Model<employeeSigningBonus>,

    @InjectModel('EmployeeTerminationResignation')
    private exitBenefitsModel: Model<EmployeeTerminationResignation>,
  ) {}
    
  // -----------------------------------------
  // GENERATE PHASE 1.1.B DETAILS
  // -----------------------------------------
  // ⚠️ DEPRECATED: This method is consolidated into Phase 1.1
  // Keep for backward compatibility but it should not be used
  // -----------------------------------------
  async processPayrollValues(dto: GeneratePayrollDraftDto) {
    throw new Error(
      'Phase 1.1.B (processPayrollValues) is deprecated. ' +
      'All payroll calculations are now done in Phase 1.1 (generatePayrollDraft). ' +
      'Call /generate-draft endpoint instead of /apply-penalties.'
    );
  }

  async applyPenalties(dto: Phase1_1BDto) {
    throw new Error(
      'Phase 1.1.B (applyPenalties) is deprecated. ' +
      'All payroll calculations are now done in Phase 1.1 (generatePayrollDraft). ' +
      'Call /generate-draft endpoint instead of /apply-penalties.'
    );
  }
}
