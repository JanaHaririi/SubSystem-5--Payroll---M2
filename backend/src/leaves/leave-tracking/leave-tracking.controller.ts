import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { LeaveTrackingService } from './leave-tracking.service';
import { AdjustLeaveDto } from '../dto/adjust-leave.dto';

@Controller('leave-tracking')
export class LeaveTrackingController {
  constructor(private readonly leaveTrackingService: LeaveTrackingService) {}

  @Post('accrue')
  accrue() {
    return this.leaveTrackingService.accrueEntitlements();
  }

  @Post('adjust')
   adjust(@Body() dto: AdjustLeaveDto) {
  return this.leaveTrackingService.adjustLeave(dto);
}


  @Post('year-end')
  yearEnd() {
    return this.leaveTrackingService.yearEndProcessing();
  }

  @Get('encash/:employeeId/:dailySalary')
  encash(@Param('employeeId') employeeId: string, @Param('dailySalary') dailySalary: string) {
    return this.leaveTrackingService.calculateEncashment(employeeId, Number(dailySalary));
  }

  @Get('balance/:employeeId')
  getBalance(@Param('employeeId') employeeId: string) {
    return this.leaveTrackingService.getLeaveBalances(employeeId);
  }

  // ⭐ TEMPORARY — Initialize entitlements for testing Phase 3
  // TEMP: Create entitlement for one employee + leave type
@Post('entitlement/:employeeId/:leaveTypeId')
async createSingleEntitlement(
  @Param('employeeId') employeeId: string,
  @Param('leaveTypeId') leaveTypeId: string
) {
  return this.leaveTrackingService.createSingleEntitlement(employeeId, leaveTypeId);
}

}
