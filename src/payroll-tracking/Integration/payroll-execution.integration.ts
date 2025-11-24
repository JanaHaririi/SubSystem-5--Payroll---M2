import { Injectable } from '@nestjs/common';

/**
 * Minimal payslip info needed from Payroll Execution.
 */
export interface PayrollPayslipSummary {
  id: string;
  employeeId: string;
  periodMonth: number;
  periodYear: number;
  grossSalary: number;
  netSalary: number;
  basicSalary: number;
  allowancesTotal: number;
  deductionsTotal: number;
}

/**
 * Integration layer between Payroll Tracking and
 * Payroll Execution.
 *
 * For Milestone 2 this uses dummy data. Later you can
 * replace it with real service/HTTP calls.
 */
@Injectable()
export class PayrollExecutionIntegrationService {
  /**
   * Fetch a single payslip by its id.
   */
  async getPayslipById(
    payslipId: string,
  ): Promise<PayrollPayslipSummary | null> {
    // TODO: replace with real implementation.
    return {
      id: payslipId,
      employeeId: '000000000000000000000001',
      periodMonth: 10,
      periodYear: 2025,
      grossSalary: 20000,
      netSalary: 17000,
      basicSalary: 15000,
      allowancesTotal: 5000,
      deductionsTotal: 3000,
    };
  }

  /**
   * Fetch all payslips for a specific employee.
   */
  async getPayslipsForEmployee(
    employeeId: string,
  ): Promise<PayrollPayslipSummary[]> {
    // TODO: replace with real implementation.
    const demoPayslip: PayrollPayslipSummary = {
      id: 'DEMO-PAYSLIP-ID',
      employeeId,
      periodMonth: 10,
      periodYear: 2025,
      grossSalary: 20000,
      netSalary: 17000,
      basicSalary: 15000,
      allowancesTotal: 5000,
      deductionsTotal: 3000,
    };

    return [demoPayslip];
  }
}
