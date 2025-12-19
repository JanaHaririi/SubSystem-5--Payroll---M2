import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { ScheduleRule, ScheduleRuleDocument } from "../models/schedule-rule.schema";
import { ScheduleRuleCreateDto } from "./../dtos/schedule-rule-create-dto";
import { ScheduleRuleUpdateDto } from "./../dtos/schedule-rule-update-dto";

@Injectable()
export class ScheduleRuleService {
  constructor(
    @InjectModel(ScheduleRule.name)
    private scheduleRuleModel: Model<ScheduleRuleDocument>,
  ) {}

  

  
  async createScheduleRule(dto: ScheduleRuleCreateDto) {
    if (!dto.name) {
      throw new BadRequestException("Name cannot be empty");
    }
    if (!dto.pattern) {
      throw new BadRequestException("Pattern cannot be empty");
    }

    const createdRule = await this.scheduleRuleModel.create(dto);
    //return createdRule;

    //malak edits 
    return {
  success: true,
  message: "Schedule rule created successfully",
  data: createdRule,
};

  }

  
  async getAllScheduleRules(){
    const rules = await this.scheduleRuleModel.find();
    //if (!rules || rules.length === 0) {
     // throw new NotFoundException("No schedule rules found");
   // }
    // malak edits 
     return {
  success: true,
  data: rules,
};


  }

  
  async getScheduleRuleById(id: Types.ObjectId){
    const rule = await this.scheduleRuleModel.findById(id);
    if (!rule) {
      throw new NotFoundException(`Schedule rule with ID ${id} not found`);
    }
   // return rule;
   return {
  success: true,
  data: rule,
};

  }

 
  async updateScheduleRule(id: Types.ObjectId, dto: ScheduleRuleUpdateDto){
    const updated = await this.scheduleRuleModel.findByIdAndUpdate(id, dto, { new: true });
    if (!updated) {
      throw new NotFoundException(`Schedule rule with ID ${id} not found`);
    }
   // return updated;
   return {
  success: true,
  message: "Schedule rule updated successfully",
  data: updated,
};

  }


  async deleteScheduleRule(id: Types.ObjectId) {
    const deleted = await this.scheduleRuleModel.findByIdAndDelete(id);
    if (!deleted) {
      throw new NotFoundException(`Schedule rule with ID ${id} not found`);
    }
    return { 
        success: true,
        message: "Schedule rule deleted successfully", 
        data: deleted 
      };
  }
}
