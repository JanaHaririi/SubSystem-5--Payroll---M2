import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { OvertimeRule, OvertimeRuleDocument } from '../models/overtime-rule.schema';
import { OvertimeRuleCreateDto } from '../dtos/overtime-rule-create.dto';
import { OvertimeRuleUpdateDto } from '../dtos/overtime-rule-update.dto';
import { ApplyOvertimeDto } from '../dtos/apply-overtime.dto';

@Injectable()
export class OvertimeRuleService {
  constructor(
    @InjectModel(OvertimeRule.name)
    private readonly overtimeRuleModel: Model<OvertimeRuleDocument>,
  ) {}

   
  async createOvertimeRule(dto: OvertimeRuleCreateDto) {
    const created = await this.overtimeRuleModel.create(dto);

    return {
      success: true,
      message: 'Overtime rule created successfully',
      data: created,
    };
  }
 
  async listOvertimeRules() {
    return this.overtimeRuleModel.find();
  }

   
  async findById(id: string) {
    return this.overtimeRuleModel.findById(id);
  }

 
  async updateOvertimeRule(id: string, dto: OvertimeRuleUpdateDto) {
    const updated = await this.overtimeRuleModel.findByIdAndUpdate(
      id,
      dto,
      { new: true },
    );

    if (!updated) {
      throw new NotFoundException('Overtime rule not found');
    }

    return {
      success: true,
      message: 'Overtime rule updated successfully',
      data: updated,
    };
  }

 
  async deleteOvertimeRule(id: string) {
    const deleted = await this.overtimeRuleModel.findByIdAndDelete(id);

    if (!deleted) {
      throw new NotFoundException('Overtime rule not found');
    }

    return {
      success: true,
      message: 'Overtime rule deleted successfully',
    };
  }
  async applyOvertimeCalculation(dto: ApplyOvertimeDto) {
  const { employeeId, date, workedHours, scheduledHours } = dto;

  // Step 1: Get the active rule
  const rule = await this.overtimeRuleModel.findOne({ active: true });
  if (!rule) {
    throw new NotFoundException('No active overtime rule found');
  }

  // Step 2: Compute raw overtime
  const overtimeHours = Math.max(0, workedHours - scheduledHours);

  // Step 3: If no overtime → early exit
  if (overtimeHours === 0) {
    return {
      success: true,
      message: "No overtime worked",
      data: {
        employeeId,
        date,
        overtimeHours: 0,
        approved: false,
        ruleUsed: rule.name
      }
    };
  }

  // Step 4: Approval logic
  const isApproved = rule.approved ? true : false;

  // Step 5: Return final result
  return {
    success: true,
    message: "Overtime calculation completed",
    data: {
      employeeId,
      date,
      overtimeHours,
      approved: isApproved,
      ruleUsed: rule.name
    }
  };
}

}
