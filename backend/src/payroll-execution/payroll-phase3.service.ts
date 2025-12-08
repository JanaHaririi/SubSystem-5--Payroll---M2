import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { payrollRuns } from './models/payrollRuns.schema';
import { EmployeeProfile } from '../employee-profile/models/employee-profile.schema';
import { PayRollStatus, PayRollPaymentStatus } from './enums/payroll-execution-enum';
import { PayrollApproveDto, LockPayrollDto, UnfreezePayrollDto } from './dto/phase3.dto';
import { EmployeeSystemRole } from '../employee-profile/models/employee-system-role.schema';
import { SystemRole } from '../employee-profile/enums/employee-profile.enums';

@Injectable()
export class PayrollPhase3Service {
  constructor(
    @InjectModel(payrollRuns.name)
    private readonly payrollRunsModel: Model<payrollRuns>,
  @InjectModel(EmployeeSystemRole.name)
  private readonly systemRoleModel: Model<EmployeeSystemRole>, 
) {}

  // 1. Review draft by Payroll Specialist (optional read-only, can be skipped if already done)
    async reviewPayrollRun(payrollRunId: string) {
    const run = await this.payrollRunsModel.findById(payrollRunId);
    if (!run) throw new BadRequestException('Payroll run not found.');
    return run;
  }
  
  async managerApprove(dto: PayrollApproveDto) {
    const run = await this.payrollRunsModel.findById(dto.payrollRunId);
    if (!run) throw new BadRequestException('Payroll run not found.');

//     // Check if the user has PAYROLL_MANAGER role
//     const role = await this.systemRoleModel.findOne({
//       employeeProfileId: new Types.ObjectId(dto.employeeProfileId),
//       roles: { $in: [SystemRole.PAYROLL_MANAGER] },
//       isActive: true,
//     });

//     if (!role) {
//       throw new BadRequestException('User is not authorized as a manager.');
//     }
//     console.log("RUN STATUS:", run.status);
// console.log("ENUM:", PayRollStatus.UNDER_REVIEW);


    if (run.status !== PayRollStatus.UNDER_REVIEW)
      throw new BadRequestException(
        'Payroll must be UNDER_REVIEW for manager approval.',
      );

   // run.payrollManagerId = new Types.ObjectId(dto.employeeProfileId) as any;
    run.managerApprovalDate = new Date();
    run.status = PayRollStatus.PENDING_FINANCE_APPROVAL;

    await run.save();
    return run;
    
  }

    async financeApprove(dto: PayrollApproveDto) {
    const run = await this.payrollRunsModel.findById(dto.payrollRunId);
    if (!run) throw new BadRequestException('Payroll run not found.');

    if (run.status !== PayRollStatus.PENDING_FINANCE_APPROVAL)
        throw new BadRequestException('Payroll must be PENDING_FINANCE_APPROVAL for finance approval.');

    //run.financeStaffId = new Types.ObjectId(dto.employeeProfileId) as any;
    run.financeApprovalDate = new Date();
    run.status = PayRollStatus.APPROVED;
    run.paymentStatus = PayRollPaymentStatus.PAID;

    await run.save();
    return run;
    }

    async lockPayroll(dto: LockPayrollDto) {
    const run = await this.payrollRunsModel.findById(dto.payrollRunId);
    if (!run) throw new BadRequestException('Payroll run not found.');
    if (run.status !== PayRollStatus.APPROVED)
        throw new BadRequestException('Payroll must be APPROVED before locking.');

    run.status = PayRollStatus.LOCKED;
   // run.payrollManagerId = new Types.ObjectId(dto.managerId) as any;

    await run.save();
    return run;
    }

    async unfreezePayroll(dto: UnfreezePayrollDto) {
    const run = await this.payrollRunsModel.findById(dto.payrollRunId);
    if (!run) throw new BadRequestException('Payroll run not found.');
    if (run.status !== PayRollStatus.LOCKED)
        throw new BadRequestException('Only LOCKED payroll can be unfrozen.');

    run.status = PayRollStatus.UNLOCKED;
    run.unlockReason = dto.reason;
   // run.payrollManagerId = new Types.ObjectId(dto.managerId) as any;

    await run.save();
    return run;
    }

}
