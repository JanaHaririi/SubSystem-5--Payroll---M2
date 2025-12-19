import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PayrollExecutionController } from './payroll-execution.controller';
import { PayrollExecutionService } from './payroll-execution.service';
import { terminationAndResignationBenefits, terminationAndResignationBenefitsSchema } from '../payroll-configuration/models/terminationAndResignationBenefits';
import { taxRules, taxRulesSchema } from '../payroll-configuration/models/taxRules.schema';
import { insuranceBrackets, insuranceBracketsSchema } from '../payroll-configuration/models/insuranceBrackets.schema';
import { allowance, allowanceSchema } from '../payroll-configuration/models/allowance.schema';
import { employeePayrollDetails, employeePayrollDetailsSchema } from './models/employeePayrollDetails.schema';
import { employeePenalties, employeePenaltiesSchema } from './models/employeePenalties.schema';
import { employeeSigningBonus, employeeSigningBonusSchema } from './models/EmployeeSigningBonus.schema';
import { payrollRuns, payrollRunsSchema } from './models/payrollRuns.schema';
import { paySlip, paySlipSchema } from './models/payslip.schema';
import { PayrollTrackingModule } from '../payroll-tracking/payroll-tracking.module';
import { PayrollConfigurationModule } from '../payroll-configuration/payroll-configuration.module';
import { TimeManagementModule } from '../time-management/time-management.module';
import { EmployeeProfileModule } from '../employee-profile/employee-profile.module';
import { LeavesModule } from '../leaves/leaves.module';
import { EmployeeTerminationResignation, EmployeeTerminationResignationSchema,} from './models/EmployeeTerminationResignation.schema';
import { PayrollPhase1_1Service } from './payroll-phase1-1.service';
import { EmployeeProfile , EmployeeProfileSchema } from '../employee-profile/models/employee-profile.schema';
import { EmployeeSystemRole, EmployeeSystemRoleSchema } from '../employee-profile/models/employee-system-role.schema';
import { Position, PositionSchema } from '../organization-structure/models/position.schema';

// Time Management Models
import { AttendanceRecord, AttendanceRecordSchema } from '../time-management/models/attendance-record.schema';
import { OvertimeRule, OvertimeRuleSchema } from '../time-management/models/overtime-rule.schema';
import { ShiftAssignment, ShiftAssignmentSchema } from '../time-management/models/shift-assignment.schema';
import { Shift, ShiftSchema } from '../time-management/models/shift.schema';

// Leaves Models
import { LeaveRequest, LeaveRequestSchema } from '../leaves/models/leave-request.schema';
import { LeaveType, LeaveTypeSchema } from '../leaves/models/leave-type.schema';

import { PayrollPhase1_1AService } from './payroll-phase1-1A.service';
import { PayrollPhase1_1BService } from './payroll-phase1-1B.service';
import { PayrollPhase1_1CService } from './payroll-phase1-1C.service';

import { PayrollPhase2Service } from './payroll-phase2.service';
import { PayrollPhase3Service } from './payroll-phase3.service';

import { PayrollPhase4Service } from './payroll-phase4.service';
import { SalaryCalculationService } from './services/salary-calculation.service';

import { JwtModule } from '@nestjs/jwt';
import { Express } from 'express';

import {AuthGuard} from'../auth/guards/auth.guard';
import {RolesGuard} from'../auth/guards/roles.guard';
import {Roles} from'../auth/decorators/roles.decorator';
import {SystemRole} from'../employee-profile/enums/employee-profile.enums';

@Module({
  imports: [
    forwardRef(() => PayrollTrackingModule),
    PayrollConfigurationModule,
    TimeManagementModule,
    EmployeeProfileModule,
    LeavesModule,
    MongooseModule.forFeature([
      { name: payrollRuns.name, schema: payrollRunsSchema },
      { name: paySlip.name, schema: paySlipSchema },
      { name: employeePayrollDetails.name, schema: employeePayrollDetailsSchema },
      { name: employeeSigningBonus.name, schema: employeeSigningBonusSchema },
      { name: terminationAndResignationBenefits.name, schema: terminationAndResignationBenefitsSchema },
      { name: taxRules.name, schema: taxRulesSchema },
      { name: insuranceBrackets.name, schema: insuranceBracketsSchema },
      { name: allowance.name, schema: allowanceSchema },
      { name: employeePenalties.name, schema: employeePenaltiesSchema },
      { name: EmployeeTerminationResignation.name, schema: EmployeeTerminationResignationSchema },
      { name: EmployeeProfile.name, schema: EmployeeProfileSchema },
      { name: EmployeeSystemRole.name, schema: EmployeeSystemRoleSchema },
      { name: Position.name, schema: PositionSchema },
      // Time Management Models for SalaryCalculationService
      { name: AttendanceRecord.name, schema: AttendanceRecordSchema },
      { name: OvertimeRule.name, schema: OvertimeRuleSchema },
      { name: ShiftAssignment.name, schema: ShiftAssignmentSchema },
      { name: Shift.name, schema: ShiftSchema },
      // Leaves Models for SalaryCalculationService
      { name: LeaveRequest.name, schema: LeaveRequestSchema },
      { name: LeaveType.name, schema: LeaveTypeSchema },
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [PayrollExecutionController],
  providers: [
    PayrollExecutionService,
    PayrollPhase1_1Service,
    PayrollPhase1_1AService,
    PayrollPhase1_1BService,
    PayrollPhase1_1CService,
    PayrollPhase2Service,
    PayrollPhase3Service,
    PayrollPhase4Service,
    SalaryCalculationService,
  ],
  exports: [PayrollExecutionService , MongooseModule],
})
export class PayrollExecutionModule {}

