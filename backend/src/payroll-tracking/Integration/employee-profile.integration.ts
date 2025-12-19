import { Injectable } from '@nestjs/common';

/**
 * Minimal employee view needed by Payroll Tracking.
 */
export interface EmployeeSummary {
  id: string;
  fullName: string;
  email: string;
  employeeCode?: string;
  departmentId?: string;
  positionId?: string;
}

/**
 * Integration layer to the Employee Profile subsystem.
 *
 * For Milestone 2 this returns dummy data so you can
 * test Payroll Tracking without the real module.
 */
@Injectable()
export class EmployeeProfileIntegrationService {
  /**
   * Fetch basic info about one employee.
   */
  async getEmployeeById(employeeId: string): Promise<EmployeeSummary> {
    // TODO: replace with real implementation (inject Employee service or call its API).
    return {
      id: employeeId,
      fullName: 'Demo Employee',
      email: 'demo.employee@example.com',
      employeeCode: 'EMP-0001',
      departmentId: '0000000000000000000000aa',
      positionId: '0000000000000000000000bb',
    };
  }
}
