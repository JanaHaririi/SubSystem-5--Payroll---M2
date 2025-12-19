# Salary Calculation Implementation for Payroll Execution

## Overview

This document describes the comprehensive salary calculation system for the payroll execution module. The system calculates **netPay** by integrating inputs from multiple subsystems and applying all relevant deductions, penalties, and refunds.

## Formula

```
netPay = (baseSalary + allowances + bonuses + refunds)
         - (penalties + taxes + insurance)
         - (penalties from missing working hours/days)
         - (unpaid leave deductions)
```

## Architecture

### Files Structure

```
backend/src/payroll-execution/
├── services/
│   └── salary-calculation.service.ts    # Core salary calculation logic
├── dto/
│   └── salary-calculation-response.dto.ts  # Response DTOs for API
├── payroll-phase1-1.service.ts          # Refactored to use SalaryCalculationService
└── payroll-execution.module.ts          # Updated to provide SalaryCalculationService
```

## Key Components

### 1. SalaryCalculationService

Located in `backend/src/payroll-execution/services/salary-calculation.service.ts`

#### Main Method: `calculateNetPay()`

```typescript
async calculateNetPay(
  employeeId: Types.ObjectId,
  payrollPeriod: Date,
  baseSalary: number,
  allowances: number = 0,
  bonusAmount: number = 0,
  exitBenefitAmount: number = 0,
)
```

**Returns:** Comprehensive salary breakdown including:
- Salary components (base, allowances, bonuses, benefits)
- Penalties breakdown (manual, working hours, unpaid leave)
- Deductions breakdown (taxes, insurance)
- Leave breakdown (paid/unpaid days)
- Refunds breakdown
- Final netPay amount

### 2. Integration Points

#### A. Time Management Module Integration

**Source:** `backend/src/time-management/models/attendance-record.schema.ts`

Fetches:
- `AttendanceRecord` - Daily working hours
- `OvertimeRule` - Overtime configurations

**Calculation:**
```typescript
private async calculateWorkingHoursPenalties(
  employeeId: Types.ObjectId,
  payrollPeriod: Date,
  baseSalary: number,
)
```

- Compares expected hours (8/day) vs actual hours worked
- Calculates penalty for missing hours: `(expectedHours - actualHours) × hourlyRate`
- Returns daily breakdown and total penalty

#### B. Leaves Module Integration

**Source:** `backend/src/leaves/models/leave-request.schema.ts`

Fetches:
- `LeaveRequest` - All approved leave requests for the period
- Distinguishes between paid and unpaid leaves

**Calculation:**
```typescript
private async calculateLeaveAdjustments(
  employeeId: Types.ObjectId,
  payrollPeriod: Date,
  baseSalary: number,
)
```

- **Paid Leaves** (Annual, Sick, etc.): No deduction (employee still paid)
- **Unpaid Leaves** (Leave without pay, etc.): Deduction = `unpaidDays × dailyRate`
- Daily rate = `baseSalary / 22` (assuming 22 working days/month)

#### C. Payroll Configuration Module Integration

**Sources:**
- `backend/src/payroll-configuration/models/taxRules.schema.ts`
- `backend/src/payroll-configuration/models/insuranceBrackets.schema.ts`
- `backend/src/payroll-configuration/models/allowance.schema.ts`

**Calculations:**
```typescript
private async calculateTaxDeductions(baseSalary: number)
private async calculateInsuranceDeductions(baseSalary: number)
```

- Applies all APPROVED tax rules: `baseSalary × (rate / 100)`
- Matches salary to insurance brackets and applies employee rate
- Returns breakdown by rule/bracket

#### D. Payroll Execution Module Internal

**Source:** `backend/src/payroll-execution/models/employeePenalties.schema.ts`

Fetches:
- Manual penalties (e.g., discipline, damage)

## Calculation Workflow

### Phase 1.1A: Initial Setup
- Validate payroll run
- Fetch active employees
- Assign pay grades and calculate base salaries
- Apply proration for mid-month hires/terminations

### Phase 1.1: Draft Generation (Enhanced)
1. For each employee:
   - Fetch bonuses and exit benefits
   - Call `SalaryCalculationService.calculateNetPay()`
   - Receive complete breakdown
   - Store in `employeePayrollDetails`

2. `SalaryCalculationService` internally:
   - Fetches manual penalties
   - Calculates working hours penalties (Time Management)
   - Calculates leave adjustments (Leaves)
   - Calculates tax deductions
   - Calculates insurance deductions
   - Calculates refunds (if available)
   - Returns aggregated results

### Phase 1.1B: Deprecated
- No longer used; all calculations in Phase 1.1

### Phase 2: Validation
- Validates calculated netPay
- Flags anomalies
- Ensures bank details are present

## Database Models

### employeePayrollDetails
```typescript
{
  employeeId: ObjectId,
  baseSalary: number,
  allowances: number,
  netSalary: number,
  netPay: number,  // After all deductions and refunds
  deductions: number,
  bonus: number,
  benefit: number,
  bankStatus: string,
  exceptions: string,
  payrollRunId: ObjectId,
}
```

### employeePenalties
```typescript
{
  employeeId: ObjectId,
  penalties: [
    { reason: string, amount: number }
  ]
}
```

## Example Calculation

```
Employee: John Doe
Payroll Period: January 2024

=== INCOME ===
Base Salary:           $5,000.00
Allowances:            $  500.00
Signing Bonus:         $  200.00
Exit Benefit:          $    0.00
Gross Salary:          $5,700.00

=== PENALTIES ===
Manual Penalties:      $  100.00 (damage, discipline)
Missing Hours Penalty: $   50.00 (2 missing hours × $25/hr)
Unpaid Leave:          $  200.00 (2 unpaid days × $100/day)
Total Penalties:       $  350.00

=== DEDUCTIONS ===
Tax (10%):             $  500.00
Insurance (3%):        $  150.00
Total Deductions:      $  650.00

=== LEAVE BREAKDOWN ===
Paid Leave Days:       5 days (fully paid, no deduction)
Unpaid Leave Days:     2 days (deducted as shown above)

=== REFUNDS ===
(From previous overpayments)
Refunds:               $   50.00

=== FINAL CALCULATION ===
Gross:                 $5,700.00
- Penalties:           -$  350.00
- Deductions:          -$  650.00
= Net Salary:          $4,700.00
+ Refunds:             +$   50.00
= NET PAY:             $4,750.00
```

## API Response Format

The `SalaryCalculationResponseDto` provides complete transparency:

```json
{
  "salary": {
    "baseSalary": 5000,
    "allowances": 500,
    "bonusAmount": 200,
    "exitBenefitAmount": 0,
    "grossSalary": 5700
  },
  "penalties": {
    "manual": [
      { "reason": "Damage", "amount": 100 }
    ],
    "manualTotal": 100,
    "workingHours": [
      { "day": "2024-01-05", "expected": 8, "actual": 6, "penalty": 50 }
    ],
    "workingHoursTotal": 50,
    "unpaidLeave": [
      { "days": 2, "dailyRate": 100, "total": 200 }
    ],
    "unpaidLeaveTotal": 200,
    "totalPenalties": 350
  },
  "deductions": {
    "tax": [
      { "ruleName": "Income Tax", "rate": 10, "amount": 500 }
    ],
    "taxTotal": 500,
    "insurance": [
      { "bracketName": "Standard", "rate": 3, "amount": 150 }
    ],
    "insuranceTotal": 150,
    "totalDeductions": 650
  },
  "leaves": {
    "paidLeaveDays": 5,
    "unpaidLeaveDays": 2,
    "totalPaidLeaveValue": 500
  },
  "refunds": {
    "breakdown": [],
    "total": 50
  },
  "netSalary": 4700,
  "netPay": 4750,
  "summary": {
    "grossSalary": 5700,
    "minusAllPenalties": -350,
    "minusAllDeductions": -650,
    "plusRefunds": 50,
    "finalNetPay": 4750
  }
}
```

## Configuration Requirements

### 1. Time Management
- Set expected working hours per day (default: 8 hours)
- Configure overtime rules if applicable
- Ensure `AttendanceRecord` is populated daily

### 2. Leaves
- Configure leave types (Paid: Annual, Sick; Unpaid: Leave Without Pay)
- Ensure leave requests are approved before payroll run

### 3. Payroll Configuration
- Create and approve tax rules
- Create and approve insurance brackets with salary ranges
- Create and approve allowances

### 4. Employee Setup
- Assign pay grades to all employees
- Ensure bank details are present
- Set up employment dates for proration

## Error Handling

The service handles:
- Missing pay grades → Exception flagged
- Missing bank details → Exception flagged
- Invalid attendance records → Skipped with logging
- Leave requests outside period → Automatically filtered
- No active tax rules → No tax deduction

## Testing

To test the salary calculation:

```bash
# In the terminal
cd backend
npm test -- payroll-execution/services/salary-calculation.service

# Or run the entire payroll-execution test suite
npm test -- payroll-execution
```

## Integration Checklist

- [x] SalaryCalculationService created with all calculation logic
- [x] Time Management integration for working hours penalties
- [x] Leaves integration for paid/unpaid leave adjustments
- [x] Payroll configuration integration for taxes and insurance
- [x] PayrollPhase1_1Service updated to use SalaryCalculationService
- [x] PayrollExecutionModule configured with new service
- [x] DTOs created for comprehensive API responses
- [ ] Unit tests for each calculation method
- [ ] Integration tests for full payroll run
- [ ] Frontend integration for displaying calculation details

## Future Enhancements

1. **Refunds Integration** - Connect with payroll-tracking for refund calculations
2. **Performance Rules** - Integrate with performance module for bonuses/deductions
3. **Custom Deductions** - Add support for employee-specific deductions
4. **Multi-Currency** - Handle payroll in different currencies
5. **Audit Trail** - Track all salary calculation changes for compliance
6. **Real-time Validation** - Validate inputs as they're entered
7. **Bulk Adjustments** - Apply adjustments to multiple employees at once

## Support

For questions or issues, contact:
- Payroll System Admin
- Backend Development Team
