import { ApiProperty } from '@nestjs/swagger';

export class SalaryCalculationBreakdownDto {
  @ApiProperty({ description: 'Base salary amount' })
  baseSalary: number;

  @ApiProperty({ description: 'Allowances amount' })
  allowances: number;

  @ApiProperty({ description: 'Signing bonus amount' })
  bonusAmount: number;

  @ApiProperty({ description: 'Exit/Termination benefit amount' })
  exitBenefitAmount: number;

  @ApiProperty({ description: 'Total gross salary' })
  grossSalary: number;
}

export class PenaltiesBreakdownDto {
  @ApiProperty({ description: 'Manual penalties from database' })
  manual: Array<{ reason: string; amount: number }>;

  @ApiProperty({ description: 'Total manual penalties' })
  manualTotal: number;

  @ApiProperty({
    description: 'Penalties from missing working hours',
  })
  workingHours: Array<{
    day: string;
    expected: number;
    actual: number;
    penalty: number;
  }>;

  @ApiProperty({ description: 'Total working hours penalties' })
  workingHoursTotal: number;

  @ApiProperty({ description: 'Unpaid leave deductions breakdown' })
  unpaidLeave: Array<{ days: number; dailyRate: number; total: number }>;

  @ApiProperty({ description: 'Total unpaid leave deduction' })
  unpaidLeaveTotal: number;

  @ApiProperty({ description: 'Total penalties from all sources' })
  totalPenalties: number;
}

export class DeductionsBreakdownDto {
  @ApiProperty({
    description: 'Tax deductions breakdown',
  })
  tax: Array<{ ruleName: string; rate: number; amount: number }>;

  @ApiProperty({ description: 'Total tax amount' })
  taxTotal: number;

  @ApiProperty({
    description: 'Insurance deductions breakdown',
  })
  insurance: Array<{ bracketName: string; rate: number; amount: number }>;

  @ApiProperty({ description: 'Total insurance amount' })
  insuranceTotal: number;

  @ApiProperty({ description: 'Total deductions' })
  totalDeductions: number;
}

export class LeaveBreakdownDto {
  @ApiProperty({ description: 'Number of paid leave days taken' })
  paidLeaveDays: number;

  @ApiProperty({ description: 'Number of unpaid leave days taken' })
  unpaidLeaveDays: number;

  @ApiProperty({ description: 'Total value of paid leaves' })
  totalPaidLeaveValue: number;
}

export class RefundsBreakdownDto {
  @ApiProperty({
    description: 'Refunds breakdown',
  })
  breakdown: Array<{ source: string; amount: number }>;

  @ApiProperty({ description: 'Total refunds' })
  total: number;
}

export class SalarySummaryDto {
  @ApiProperty({ description: 'Gross salary' })
  grossSalary: number;

  @ApiProperty({ description: 'Total penalties deducted' })
  minusAllPenalties: number;

  @ApiProperty({ description: 'Total deductions (tax + insurance)' })
  minusAllDeductions: number;

  @ApiProperty({ description: 'Total refunds added' })
  plusRefunds: number;

  @ApiProperty({ description: 'Final net pay amount' })
  finalNetPay: number;
}

export class SalaryCalculationResponseDto {
  @ApiProperty({ description: 'Salary components' })
  salary: SalaryCalculationBreakdownDto;

  @ApiProperty({ description: 'Penalties breakdown' })
  penalties: PenaltiesBreakdownDto;

  @ApiProperty({ description: 'Deductions breakdown' })
  deductions: DeductionsBreakdownDto;

  @ApiProperty({ description: 'Leave breakdown' })
  leaves: LeaveBreakdownDto;

  @ApiProperty({ description: 'Refunds breakdown' })
  refunds: RefundsBreakdownDto;

  @ApiProperty({ description: 'Net salary (before refunds)' })
  netSalary: number;

  @ApiProperty({ description: 'Final net pay (after all adjustments)' })
  netPay: number;

  @ApiProperty({ description: 'Summary of calculation' })
  summary: SalarySummaryDto;
}
