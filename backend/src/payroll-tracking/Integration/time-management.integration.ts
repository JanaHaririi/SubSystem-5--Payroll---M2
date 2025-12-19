import { Injectable } from '@nestjs/common';

/**
 * Summary of time-management impacts on payroll for a period.
 */
export interface TimeManagementSummary {
  employeeId: string;
  periodMonth: number;
  periodYear: number;
  overtimeHours: number;
  overtimeAmount: number;
  unpaidLeaveDays: number;
  latenessPenaltiesAmount: number;
}

/**
 * Integration layer between Payroll Tracking and Time Management.
 *
 * For Milestone 2 this returns dummy data.
 */
@Injectable()
export class TimeManagementIntegrationService {
  /**
   * Aggregated summary of time-related impacts on payroll
   * for one employee in a given month.
   */
  async getTimeManagementSummary(
    employeeId: string,
    periodMonth: number,
    periodYear: number,
  ): Promise<TimeManagementSummary> {
    // TODO: replace with real implementation once Time Management is ready.
    return {
      employeeId,
      periodMonth,
      periodYear,
      overtimeHours: 10,
      overtimeAmount: 1200,
      unpaidLeaveDays: 1,
      latenessPenaltiesAmount: 300,
    };
  }
}
