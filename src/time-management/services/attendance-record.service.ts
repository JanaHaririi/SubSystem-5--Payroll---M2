import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AttendanceRecord, AttendanceRecordDocument, Punch } from '../models/attendance-record.schema';
import { CreateAttendancePunchDto } from '../dtos/create-attendance-record-dto';
import { PunchType } from '../models/enums/index';
import { EmployeeProfileService } from '../../employee-profile/employee-profile.service';
import { ScheduleRule, ScheduleRuleDocument } from '../models/schedule-rule.schema';
import { ShiftAssignment, ShiftAssignmentDocument } from '../models/shift-assignment.schema';
@Injectable()
export class AttendanceRecordService {
  constructor(
    @InjectModel(AttendanceRecord.name)
    private attendanceModel: Model<AttendanceRecordDocument>,
    private employeeProfileService: EmployeeProfileService,
    @InjectModel(ScheduleRule.name)
    private scheduleRuleModel: Model<ScheduleRuleDocument>,
    @InjectModel(ShiftAssignment.name)
    private shiftAssignmentModel: Model<ShiftAssignmentDocument>,

  ) {}

  
  async recordClockIn(dto: CreateAttendancePunchDto) {
    if (dto.punchType !== PunchType.IN) {
      throw new BadRequestException('Punch type must be IN.');
    }
  
    
    const employee = await this.employeeProfileService.getMyProfile(dto.employeeId);
    if (!employee) {
      throw new NotFoundException('Employee not found.');
    }
  
    let record = await this.attendanceModel.findOne({ employeeId: new Types.ObjectId(dto.employeeId) });
    if (!record) {
      
      record = await this.attendanceModel.create({
        employeeId: new Types.ObjectId(dto.employeeId),
        punches: [],
        totalWorkMinutes: 0,
        hasMissedPunch: false,
      });
    }

    const scheduleRule = await this.scheduleRuleModel.findOne({ employeeId: dto.employeeId });
    if (!scheduleRule) {
      throw new NotFoundException('Schedule rule not found.');
    }
  
   
    const todayIndex = new Date().getDay();
    if (scheduleRule.pattern[todayIndex] === '0') {
      throw new BadRequestException('Cannot clock in on a rest day.');
    }
  
   
    const punch: Punch = { time: new Date(), type: dto.punchType };
    record.punches.push(punch);
    await record.save();
  
    return {
      success: true,
      message: 'Clocked in successfully!',
      data: record,
    };
  }
  
  
  async recordClockOut(dto: CreateAttendancePunchDto) {
    if (dto.punchType !== PunchType.OUT) {
      throw new BadRequestException('Punch type must be OUT.');
    }
  
    const employee = await this.employeeProfileService.getMyProfile(dto.employeeId);
    if (!employee) throw new NotFoundException('Employee not found.');
  
    const record = await this.attendanceModel.findOne({ employeeId: new Types.ObjectId(dto.employeeId) });
    if (!record) throw new NotFoundException('No attendance record found.');
  
    const scheduleRule = await this.scheduleRuleModel.findOne({ employeeId: dto.employeeId });
    if (!scheduleRule) throw new NotFoundException('Schedule rule not found.');
  
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const hasClockedInToday = record.punches.some(p => 
      p.type === PunchType.IN &&
      new Date(p.time).setHours(0, 0, 0, 0) === today.getTime()
    );
    if (!hasClockedInToday) throw new BadRequestException('Cannot clock out without clocking in first.');
  
    const now = new Date();
    const punch: Punch = { time: now, type: dto.punchType };
    record.punches.push(punch);
  
    // Compute totalWorkMinutes by summing all IN->OUT intervals for today
    const todayPunches = record.punches.filter(p =>
      new Date(p.time).setHours(0,0,0,0) === today.getTime()
    );
  
    let totalMinutes = 0;
    for (let i = 0; i < todayPunches.length; i++) {
      if (todayPunches[i].type === PunchType.IN) {
        const outPunch = todayPunches.slice(i+1).find(p => p.type === PunchType.OUT);
        if (outPunch) {
          totalMinutes += Math.floor((new Date(outPunch.time).getTime() - new Date(todayPunches[i].time).getTime()) / 60000);
          i = todayPunches.indexOf(outPunch); // skip to next punch after OUT
        }
      }
    }
  
    record.totalWorkMinutes = totalMinutes;
    await record.save();
  
    return {
      success: true,
      message: 'Clocked out successfully!',
      data: record,
    };
  }
  
  
  

  // detectMissedPunches
  async detectMissedPunches(employeeId: string) {
    const record = await this.attendanceModel.findOne({ employeeId: new Types.ObjectId(employeeId) });
    if (!record) throw new NotFoundException('No attendance record found.');


    record.hasMissedPunch = record.punches.some((p, i, arr) => {
      if (p.type === PunchType.IN) {
        const next = arr[i + 1];
        return !next || next.type !== PunchType.OUT;
      }
      return false;
    });

    await record.save();
    return { success: true, message: 'Missed punches detected', data: record };
  }

  // listAttendanceForEmployee

  async listAttendanceForEmployee(
    employeeId: string,
    startDate?: string,
    endDate?: string
  ) {

    const employee = await this.employeeProfileService.getMyProfile(employeeId);
    if (!employee) throw new NotFoundException('Employee not found.');
  
   
    const record = await this.attendanceModel.findOne({
      employeeId: new Types.ObjectId(employeeId)
    });
  
    if (!record) {
      return {
        success: true,
        message: 'No attendance punches found.',
        data: []
      };
    }
  
    
    if (!startDate && !endDate) {
      return {
        success: true,
        message: 'All attendance punches fetched.',
        data: record.punches
      };
    }
  
    
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
  
    if (start) start.setHours(0, 0, 0, 0);
    if (end) end.setHours(23, 59, 59, 999);
  
  
    const filtered = record.punches.filter(p => {
      const t = new Date(p.time).getTime();
  
      if (start && end)
        return t >= start.getTime() && t <= end.getTime();
  
      if (start)
        return t >= start.getTime();
  
      if (end)
        return t <= end.getTime();
  
      return true;
    });
  
    return {
      success: true,
      message: 'Attendance punches fetched for the specified period.',
      data: filtered
    };
  }
  

  // rest of crud

  // update: update by timestamp 3shan theres no punch id

  async updatePunchByTime(
    employeeId: string,
    punchTime: string,
    update: { time?: string; type?: 'IN' | 'OUT' }
  ) {
    const record = await this.attendanceModel.findOne({
      employeeId: new Types.ObjectId(employeeId)
    });
  
    if (!record) throw new NotFoundException('Attendance record not found.');
  
    const target = record.punches.find(
      p => new Date(p.time).getTime() === new Date(punchTime).getTime()
    );
  
    if (!target) throw new NotFoundException('Punch not found.');
  
    if (update.time) target.time = new Date(update.time);
    if (update.type) target.type = update.type as PunchType;
  
    await record.save();
  
    return {
      success: true,
      message: 'Punch updated.',
      data: record
    };
  }
  

  // nafs el kalam f delete

  async deletePunchByTime(employeeId: string, punchTime: string) {
  const record = await this.attendanceModel.findOne({
    employeeId: new Types.ObjectId(employeeId)
  });

  if (!record) throw new NotFoundException('Attendance record not found.');

  const before = record.punches.length;

  record.punches = record.punches.filter(
    p => new Date(p.time).getTime() !== new Date(punchTime).getTime()
  );

  const after = record.punches.length;

  if (before === after)
    throw new NotFoundException('Punch not found.');

  await record.save();

  return {
    success: true,
    message: 'Punch deleted.',
    data: record
  };

  
}


// delete all punches for date


async deletePunchesForDate(employeeId: string, date: string) {
  const record = await this.attendanceModel.findOne({
    employeeId: new Types.ObjectId(employeeId)
  });

  if (!record) throw new NotFoundException('Attendance record not found.');

  const day = new Date(date).setHours(0,0,0,0);

  record.punches = record.punches.filter(p => {
    const t = new Date(p.time).setHours(0,0,0,0);
    return t !== day;
  });

  await record.save();

  return {
    success: true,
    message: 'Punches for date deleted.',
    data: record
  };
}

  

}
