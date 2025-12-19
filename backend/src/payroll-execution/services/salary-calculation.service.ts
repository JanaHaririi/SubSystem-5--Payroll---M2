import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

// Time Management Models
import { AttendanceRecord } from '../../time-management/models/attendance-record.schema';
import { OvertimeRule } from '../../time-management/models/overtime-rule.schema';

// Leaves Models
import { LeaveRequest, LeaveRequestDocument } from '../../leaves/models/leave-request.schema';
import { LeaveStatus } from '../../leaves/enums/leave-status.enum';
import { LeaveType } from '../../leaves/models/leave-type.schema';

// Payroll Models
import { employeePenalties } from '../models/employeePenalties.schema';
import { payGrade } from '../../payroll-configuration/models/payGrades.schema';
import { taxRules } from '../../payroll-configuration/models/taxRules.schema';
import { insuranceBrackets } from '../../payroll-configuration/models/insuranceBrackets.schema';
import { allowance } from '../../payroll-configuration/models/allowance.schema';

import { ConfigStatus } from '../../payroll-configuration/enums/payroll-configuration-enums';

/**
 * SALARY CALCULATION SERVICE
 * 
 * Formula:
 * netPay = (baseSalary + allowances + bonuses + refunds) 
 *          - (penalties + taxes + insurance)
 *          - (penalties from missing working hours/OT)
 *          + (refunds if available)
 * 
 * Inputs from Other Sub-Systems:
 * 1. Time Management: Working hours, OT, Missing hours/days
 * 2. Leaves: Paid leaves, Unpaid leaves
 */
@Injectable()
export class SalaryCalculationService {
  constructor(
    @InjectModel('AttendanceRecord')
    private attendanceRecordModel: Model<AttendanceRecord>,

    @InjectModel('OvertimeRule')
    private overtimeRuleModel: Model<OvertimeRule>,

    @InjectModel('LeaveRequest')
    private leaveRequestModel: Model<LeaveRequestDocument>,

    @InjectModel('LeaveType')
    private leaveTypeModel: Model<LeaveType>,

    @InjectModel('employeePenalties')
    private penaltiesModel: Model<employeePenalties>,

    @InjectModel(payGrade.name)
    private payGradeModel: Model<any>,

    @InjectModel(taxRules.name)
    private taxRulesModel: Model<any>,

    @InjectModel(insuranceBrackets.name)
    private insuranceBracketsModel: Model<any>,

    @InjectModel(allowance.name)
    private allowanceModel: Model<any>,

    @InjectModel('ShiftAssignment')
    private shiftAssignmentModel: Model<any>,

    @InjectModel('Shift')
    private shiftModel: Model<any>,
  ) {}

  /**
   * Calculate net pay with all deductions and refunds
   * 
   * @param employeeId - Employee ID
   * @param payrollPeriod - The payroll period (month)
   * @param baseSalary - Base salary (already prorated if mid-month hire/termination)
   * @param allowances - Allowances amount
   * @param bonusAmount - Signing bonus (if any)
   * @param exitBenefitAmount - Exit benefit (if any)
   * @param employee - Employee object with status, contractStartDate, terminationDate for proration
   * @returns Complete salary calculation breakdown
   */
  async calculateNetPay(
    employeeId: Types.ObjectId,
    payrollPeriod: Date,
    baseSalary: number,
    allowances: number = 0,
    bonusAmount: number = 0,
    exitBenefitAmount: number = 0,
    employee?: any,
  ) {
    const periodStart = new Date(payrollPeriod.getFullYear(), payrollPeriod.getMonth(), 1);
    const periodEnd = new Date(payrollPeriod.getFullYear(), payrollPeriod.getMonth() + 1, 0);

    // ========================================
    // 1. GROSS SALARY CALCULATION
    // ========================================
    const grossSalary = baseSalary + allowances + bonusAmount + exitBenefitAmount;

    // ========================================
    // 2. FETCH PENALTIES FROM DATABASE
    // ========================================
    const penaltyBreakdown = await this.calculatePenalties(employeeId, payrollPeriod);

    // ========================================
    // 3. CALCULATE WORKING HOURS PENALTIES
    // (From Time Management Module)
    // ========================================
    const workingHoursPenalty = await this.calculateWorkingHoursPenalties(
      employeeId,
      payrollPeriod,
      baseSalary,
      employee,
    );

    // ========================================
    // 4. CALCULATE LEAVE ADJUSTMENTS
    // (From Leaves Module)
    // ========================================
    const leaveAdjustments = await this.calculateLeaveAdjustments(
      employeeId,
      payrollPeriod,
      baseSalary,
      employee,
    );

    // ========================================
    // 5. CALCULATE TAX DEDUCTIONS
    // ========================================
    const taxDeductions = await this.calculateTaxDeductions(baseSalary);

    // ========================================
    // 6. CALCULATE INSURANCE DEDUCTIONS
    // ========================================
    const insuranceDeductions = await this.calculateInsuranceDeductions(baseSalary);

    // ========================================
    // 7. CALCULATE REFUNDS (if available)
    // ========================================
    const refunds = await this.calculateRefunds(employeeId, payrollPeriod);

    // ========================================
    // 8. FINAL CALCULATION
    // ========================================
    const totalPenalties =
      penaltyBreakdown.total +
      workingHoursPenalty.totalPenalty +
      leaveAdjustments.unpaidLeaveDeduction;

    const totalDeductions =
      totalPenalties + taxDeductions.total + insuranceDeductions.total;

    const netSalary = grossSalary - totalDeductions;
    const netPay = netSalary + refunds.total;

    return {
      // Salary Components
      baseSalary,
      allowances,
      bonusAmount,
      exitBenefitAmount,
      grossSalary,

      // Penalties Breakdown
      penalties: {
        manual: penaltyBreakdown.penalties,
        manualTotal: penaltyBreakdown.total,
        workingHours: workingHoursPenalty.breakdown,
        workingHoursTotal: workingHoursPenalty.totalPenalty,
        unpaidLeave: leaveAdjustments.unpaidLeaveBreakdown,
        unpaidLeaveTotal: leaveAdjustments.unpaidLeaveDeduction,
        totalPenalties,
      },

      // Deductions Breakdown
      deductions: {
        tax: taxDeductions.breakdown,
        taxTotal: taxDeductions.total,
        insurance: insuranceDeductions.breakdown,
        insuranceTotal: insuranceDeductions.total,
        totalDeductions,
      },

      // Leave Breakdown
      leaves: {
        paidLeaveDays: leaveAdjustments.paidLeaveDays,
        unpaidLeaveDays: leaveAdjustments.unpaidLeaveDays,
        totalPaidLeaveValue: leaveAdjustments.paidLeaveValue,
      },

      // Refunds
      refunds: {
        breakdown: refunds.breakdown,
        total: refunds.total,
      },

      // Final Amounts
      netSalary,
      netPay,

      // Summary
      summary: {
        grossSalary,
        minusAllPenalties: -totalPenalties,
        minusAllDeductions: -totalDeductions,
        plusRefunds: refunds.total,
        finalNetPay: netPay,
      },
    };
  }

  /**
   * Calculate penalties from database (manual penalties)
   */
  private async calculatePenalties(employeeId: Types.ObjectId, payrollPeriod: Date) {
    const penaltyDoc = await this.penaltiesModel.findOne({
      employeeId,
    });

    let penalties: Array<{ reason: string; amount: number }> = [];
    let total = 0;

    if (penaltyDoc && penaltyDoc.penalties) {
      penalties = penaltyDoc.penalties.filter((p) => {
        // Optional: filter by date range if penalty has a date field
        return true;
      });
      total = penalties.reduce((sum, p) => sum + (p.amount || 0), 0);
    }

    return { penalties, total };
  }

  /**
   * Calculate penalties from missing working hours or OT
   * Input: Time Management Module (AttendanceRecord, OvertimeRule)
   */
  private async calculateWorkingHoursPenalties(
    employeeId: Types.ObjectId,
    payrollPeriod: Date,
    baseSalary: number,
    employee?: any,
  ) {
    let periodStart = new Date(payrollPeriod.getFullYear(), payrollPeriod.getMonth(), 1);
    let periodEnd = new Date(payrollPeriod.getFullYear(), payrollPeriod.getMonth() + 1, 0);

    // Adjust period based on employee hire/termination dates for accurate hourly rate calculation
    if (employee) {
      if (employee.contractStartDate) {
        const contractStart = new Date(employee.contractStartDate);
        if (contractStart.getMonth() === periodEnd.getMonth() && 
            contractStart.getFullYear() === periodEnd.getFullYear() &&
            contractStart > periodStart) {
          periodStart = contractStart;
        }
      }
      if (employee.status === 'TERMINATED' && employee.terminationDate) {
        const termDate = new Date(employee.terminationDate);
        if (termDate.getMonth() === periodEnd.getMonth() && 
            termDate.getFullYear() === periodEnd.getFullYear() &&
            termDate < periodEnd) {
          periodEnd = termDate;
        }
      }
    }

    const fullMonthStart = new Date(payrollPeriod.getFullYear(), payrollPeriod.getMonth(), 1);
    const fullMonthEnd = new Date(payrollPeriod.getFullYear(), payrollPeriod.getMonth() + 1, 0);

    // Fetch attendance records for the full period
    const attendanceRecords = await this.attendanceRecordModel.find({
      employeeId,
      createdAt: { $gte: fullMonthStart, $lte: fullMonthEnd },
    });

    // Fetch overtime rules
    const overtimeRules = await this.overtimeRuleModel.find();

    // Calculate total hours worked
    let totalHoursWorked = 0;
    // Fetch expected hours from employee's shift assignment
    const expectedHoursPerDay = await this.getExpectedHoursPerDay(employeeId, payrollPeriod);
    // Use actual working period for hourly rate (accounts for mid-month hire/termination)
    const workingDaysInPeriod = this.calculateWorkingDays(periodStart, periodEnd);
    const totalExpectedHours = workingDaysInPeriod * expectedHoursPerDay;

    const breakdown: Array<{ day: string; expected: number; actual: number; penalty: number }> =
      [];

    for (const record of attendanceRecords) {
      // Convert totalWorkMinutes to hours (e.g., 480 minutes = 8 hours)
      const actualHours = (record.totalWorkMinutes || 0) / 60;
      const expectedHours = expectedHoursPerDay;

      totalHoursWorked += actualHours;

      if (actualHours < expectedHours) {
        const missingHours = expectedHours - actualHours;
        // Penalty = missing hours * hourly rate
        const hourlyRate = baseSalary / (workingDaysInPeriod * expectedHoursPerDay);
        const dayPenalty = missingHours * hourlyRate;

        breakdown.push({
          day: record.punches?.[0]?.time?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
          expected: expectedHours,
          actual: parseFloat(actualHours.toFixed(2)),
          penalty: parseFloat(dayPenalty.toFixed(2)),
        });
      }
    }

    const totalPenalty = breakdown.reduce((sum, b) => sum + b.penalty, 0);

    return { breakdown, totalPenalty };
  }

  /**
   * Calculate deductions from paid/unpaid leaves
   * Input: Leaves Module (LeaveBalance, LeaveRequest)
   */
  private async calculateLeaveAdjustments(
    employeeId: Types.ObjectId,
    payrollPeriod: Date,
    baseSalary: number,
    employee?: any,
  ) {
    let periodStart = new Date(payrollPeriod.getFullYear(), payrollPeriod.getMonth(), 1);
    let periodEnd = new Date(payrollPeriod.getFullYear(), payrollPeriod.getMonth() + 1, 0);

    // Adjust period based on employee hire/termination dates for accurate daily rate calculation
    if (employee) {
      if (employee.contractStartDate) {
        const contractStart = new Date(employee.contractStartDate);
        if (contractStart.getMonth() === periodEnd.getMonth() && 
            contractStart.getFullYear() === periodEnd.getFullYear() &&
            contractStart > periodStart) {
          periodStart = contractStart;
        }
      }
      if (employee.status === 'TERMINATED' && employee.terminationDate) {
        const termDate = new Date(employee.terminationDate);
        if (termDate.getMonth() === periodEnd.getMonth() && 
            termDate.getFullYear() === periodEnd.getFullYear() &&
            termDate < periodEnd) {
          periodEnd = termDate;
        }
      }
    }

    const fullMonthStart = new Date(payrollPeriod.getFullYear(), payrollPeriod.getMonth(), 1);
    const fullMonthEnd = new Date(payrollPeriod.getFullYear(), payrollPeriod.getMonth() + 1, 0);

    // Fetch all approved leave requests for the period
    const leaveRequests = await this.leaveRequestModel.find({
      employeeId,
      'dates.from': { $lte: fullMonthEnd },
      'dates.to': { $gte: fullMonthStart },
      status: LeaveStatus.APPROVED, // Only approved leaves
    }).populate('leaveTypeId');

    let paidLeaveDays = 0;
    let unpaidLeaveDays = 0;
    let paidLeaveValue = 0;
    let unpaidLeaveDeduction = 0;

    // Calculate daily rate based on actual working days in period (accounts for proration)
    const workingDaysInPeriod = this.calculateWorkingDays(periodStart, periodEnd);
    const dailyRate = baseSalary / workingDaysInPeriod;

    for (const leave of leaveRequests) {
      // Calculate overlap with payroll period
      const start = new Date(Math.max(periodStart.getTime(), leave.dates.from.getTime()));
      const end = new Date(Math.min(periodEnd.getTime(), leave.dates.to.getTime()));
      const daysInPeriod = this.calculateWorkingDays(start, end);

      // Check if leave is paid or unpaid from populated LeaveType
      const leaveTypeDoc = (leave.leaveTypeId as any) as LeaveType;
      const isPaidLeave = leaveTypeDoc?.paid === true;
      const isUnpaidLeave = leaveTypeDoc?.paid === false;

      if (isPaidLeave) {
        paidLeaveDays += daysInPeriod;
        paidLeaveValue += daysInPeriod * dailyRate;
      } else if (isUnpaidLeave) {
        unpaidLeaveDays += daysInPeriod;
        unpaidLeaveDeduction += daysInPeriod * dailyRate;
      }
    }

    return {
      paidLeaveDays,
      unpaidLeaveDays,
      paidLeaveValue,
      unpaidLeaveDeduction,
      unpaidLeaveBreakdown: [
        {
          days: unpaidLeaveDays,
          dailyRate,
          total: unpaidLeaveDeduction,
        },
      ],
    };
  }

  /**
   * Calculate tax deductions (dynamic from tax rules)
   */
  private async calculateTaxDeductions(baseSalary: number) {
    const approvedTaxRules = await this.taxRulesModel.find({
      status: ConfigStatus.APPROVED,
    });

    let breakdown: Array<{ ruleName: string; rate: number; amount: number }> = [];
    let total = 0;

    for (const rule of approvedTaxRules) {
      const amount = baseSalary * (rule.rate / 100);
      breakdown.push({
        ruleName: rule.name || 'Tax',
        rate: rule.rate,
        amount,
      });
      total += amount;
    }

    return { breakdown, total };
  }

  /**
   * Calculate insurance deductions (based on brackets)
   */
  private async calculateInsuranceDeductions(baseSalary: number) {
    const approvedBrackets = await this.insuranceBracketsModel.find({
      status: ConfigStatus.APPROVED,
    });

    let breakdown: Array<{ bracketName: string; rate: number; amount: number }> = [];
    let total = 0;

    for (const bracket of approvedBrackets) {
      // Check if employee's salary falls within this bracket
      if (baseSalary >= bracket.minSalary && baseSalary <= bracket.maxSalary) {
        const amount = baseSalary * (bracket.employeeRate / 100);
        breakdown.push({
          bracketName: bracket.name || 'Insurance',
          rate: bracket.employeeRate,
          amount,
        });
        total += amount;
      }
    }

    return { breakdown, total };
  }

  /**
   * Calculate refunds (if available from payroll-tracking or other sources)
   * This is a placeholder for refund integration
   */
  private async calculateRefunds(employeeId: Types.ObjectId, payrollPeriod: Date) {
    // TODO: Integrate with payroll-tracking module for refunds
    // For now, return empty refunds
    return {
      breakdown: [],
      total: 0,
    };
  }

  /**
   * Helper: Calculate working days between two dates (excluding weekends)
   */
  private calculateWorkingDays(startDate: Date, endDate: Date): number {
    let count = 0;
    const current = new Date(startDate);

    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      // Exclude Saturday (6) and Sunday (0)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return count;
  }

  /**
   * Helper: Get expected working hours per day from employee's shift assignment
   * Falls back to 8 hours if no shift assignment found
   */
  private async getExpectedHoursPerDay(employeeId: Types.ObjectId, payrollPeriod: Date): Promise<number> {
    try {
      // Find active shift assignment for the employee during the payroll period
      const shiftAssignment = await this.shiftAssignmentModel.findOne({
        employeeId,
        startDate: { $lte: payrollPeriod },
        $or: [
          { endDate: { $gte: payrollPeriod } },
          { endDate: null }, // Ongoing assignment
        ],
        status: 'APPROVED',
      }).populate('shiftId');

      if (shiftAssignment && shiftAssignment.shiftId) {
        const shift = shiftAssignment.shiftId;
        
        // Parse startTime and endTime (format: "HH:MM")
        const [startHour, startMin] = shift.startTime.split(':').map(Number);
        const [endHour, endMin] = shift.endTime.split(':').map(Number);
        
        // Calculate duration in hours
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;
        let durationMinutes = endMinutes - startMinutes;
        
        // Handle overnight shifts (e.g., 22:00 to 06:00)
        if (durationMinutes < 0) {
          durationMinutes += 24 * 60;
        }
        
        const hoursPerDay = durationMinutes / 60;
        return hoursPerDay;
      }
    } catch (error) {
      console.warn('Could not fetch shift assignment for employee:', employeeId, error);
    }
    
    // Fallback to 8 hours standard if no shift found
    return 8;
  }
}
