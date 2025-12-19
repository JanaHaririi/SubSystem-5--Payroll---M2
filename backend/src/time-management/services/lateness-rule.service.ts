import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { LatenessRule, LatenessRuleDocument } from '../models/lateness-rule.schema';
import { LatenessRuleCreateDto } from '../dtos/lateness-rule-create.dto';
import { LatenessRuleUpdateDto } from '../dtos/lateness-rule-update.dto';
import { Shift, ShiftDocument } from '../models/shift.schema';
import { ShiftAssignment , ShiftAssignmentDocument} from '../models/shift-assignment.schema';


import {
  AttendanceRecord,
  AttendanceRecordDocument
} from '../../time-management/models/attendance-record.schema';

import {
  ScheduleRule,
  ScheduleRuleDocument
} from '../../time-management/models/schedule-rule.schema';

@Injectable()
export class LatenessRuleService {
  constructor(
    @InjectModel(LatenessRule.name)
    private readonly latenessRuleModel: Model<LatenessRuleDocument>,

    @InjectModel(AttendanceRecord.name)
    private readonly attendanceRecordModel: Model<AttendanceRecordDocument>,

    @InjectModel(ScheduleRule.name)
    private readonly scheduleRuleModel: Model<ScheduleRuleDocument>,

    @InjectModel(Shift.name)
    private readonly shiftModel: Model<ShiftDocument>,

    @InjectModel(ShiftAssignment.name)
    private readonly shiftAssignmentModel: Model<ShiftAssignmentDocument>,
  ) {}



  // CREATE
  async createLatenessRule(dto: LatenessRuleCreateDto) {
    const created = await this.latenessRuleModel.create(dto);
    return {
      success: true,
      message: 'Lateness rule created successfully',
      data: created,
    };
  }

  // LIST
  async listLatenessRules() {
    return this.latenessRuleModel.find();
  }

  // UPDATE
  async updateLatenessRule(id: string, dto: LatenessRuleUpdateDto) {
    const updated = await this.latenessRuleModel.findByIdAndUpdate(
      id,
      dto,
      { new: true }
    );
    if (!updated) throw new NotFoundException('Lateness rule not found');

    return {
      success: true,
      message: 'Lateness rule updated successfully',
      data: updated,
    };
  }

  // DELETE
  async deleteLatenessRule(id: string) {
    const deleted = await this.latenessRuleModel.findByIdAndDelete(id);
    if (!deleted) throw new NotFoundException('Lateness rule not found');

    return {
      success: true,
      message: 'Lateness rule deleted successfully',
    };
  }

  async findById(id: string) {
    return this.latenessRuleModel.findById(id);
  }

  async getActiveRule() {
    const rule = await this.latenessRuleModel.findOne({ active: true });
    if (!rule) throw new NotFoundException('No active lateness rule set.');
    return rule;
  }

  // APPLY PENALTY
  async applyLatenessPenalty(actualMinutesLate: number, ruleId: string) {
    const rule = await this.latenessRuleModel.findById(ruleId);

    if (!rule) throw new NotFoundException('Lateness rule not found');

    const finalMinutes = Math.max(
      actualMinutesLate - rule.gracePeriodMinutes,
      0
    );

    const penalty = Math.round(finalMinutes * rule.deductionForEachMinute);

    return {
      success: true,
      ruleUsed: rule.name,
      effectiveLateMinutes: finalMinutes,
      calculatedPenalty: penalty,
    };
  }

  async detectRepeatedLateness(employeeId: string) {
 
    const records = await this.attendanceRecordModel.find({
      employeeId: new Types.ObjectId(employeeId)
    });
  
    if (!records.length) {
      return {
        success: true,
        message: 'No attendance records found',
        repeatedLateness: 0
      };
    }
  
   
    const shiftAssignments = await this.shiftAssignmentModel.find({
      employeeId: new Types.ObjectId(employeeId),
      $or: [
        { endDate: { $exists: false } },
        { endDate: null },
        { endDate: { $gte: new Date(0) } } 
      ]
    }).lean();
  
    if (!shiftAssignments || shiftAssignments.length === 0) {
      
      return {
        success: true,
        message: 'No shift assignments found for employee; cannot compute lateness',
        repeatedLateness: 0
      };
    }
  
    let latenessCount = 0;
  
  
    const assignmentForDate = (date: Date) => {
      return shiftAssignments.find(a => {
        const start = new Date(a.startDate);
        const end = a.endDate ? new Date(a.endDate) : null;
        
        return date >= start && (!end || date <= end);
      }) || shiftAssignments[0]; 
    };
  
    for (const record of records) {
     
      const firstIn = (record.punches ?? []).find(p => p.type === 'IN');
      if (!firstIn) continue;
  
      const actual = new Date(firstIn.time);
  
      const assignment = assignmentForDate(actual);
      if (!assignment || !assignment.shiftId) continue;
  
      // load shift to get startTime (string like "09:00")
      const shift = await this.shiftModel.findById(assignment.shiftId).lean();
      if (!shift || !shift.startTime) continue;
  
      // build expected datetime: use attendance date + shift.startTime
      const [hourStr, minStr] = (shift.startTime as string).split(':');
      const expected = new Date(actual);
      expected.setHours(Number(hourStr), Number(minStr), 0, 0);
  
      const diffMinutes = Math.floor((actual.getTime() - expected.getTime()) / 60000);
      if (diffMinutes > 0) latenessCount++;
    }
  
    const isRepeated = latenessCount >= 3;
  
    return {
      success: true,
      repeatedLateness: latenessCount,
      isRepeated,
      action: isRepeated ? 'Escalate to HR for disciplinary action' : 'No escalation required'
    };
  }
 

}
