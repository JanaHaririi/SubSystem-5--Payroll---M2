export class PayrollApproveDto {
  payrollRunId: string;
  //employeeProfileId: string; // who approves
}

export class LockPayrollDto {
  payrollRunId: string;
 // managerId: string;
}

export class UnfreezePayrollDto {
  payrollRunId: string;
 // managerId: string;
  reason: string;
}
