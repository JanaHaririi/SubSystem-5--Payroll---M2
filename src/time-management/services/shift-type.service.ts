import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { ShiftType, ShiftTypeDocument } from "../models/shift-type.schema";
import { ShiftTypeCreateDto } from "../dtos/shift-type-create-dto";
import { BadRequestException, NotFoundException, Param } from "@nestjs/common";

export class ShiftTypeService{
    constructor(
        @InjectModel(ShiftType.name)
        private shiftTypeModel:Model<ShiftTypeDocument>,
    ){}
    async createShiftType(shiftTypeData: ShiftTypeCreateDto){ //Working!
        if(!shiftTypeData.name) throw new BadRequestException("Name must be provided!")
        if(!shiftTypeData.active) throw new BadRequestException("Activity must be provided!")
        const shiftType = await this.shiftTypeModel.create(shiftTypeData)
        return{
            success: true,
            message: "Shift Type Created Successfully!",
            data:shiftType
        }
    }
    async getAllShiftTypes(){ //Working!
        const shiftTypes = await this.shiftTypeModel.find()
        if(!shiftTypes) throw new NotFoundException('No Shift Types Found!')
        return{
            success:true,
            message:"Shift Types Found Successfully!",
            data: shiftTypes
        }
    }
    async getShiftTypeById(shiftTypeId:string){ //Working!
        const shiftType = await this.shiftTypeModel.findById(shiftTypeId)
        if(!shiftType) throw new NotFoundException("No Shift Types Found!")
        return{
            success:true,
            message:"Shift Type Found Successfully!",
            data: shiftType
        }
    }
    async deleteShiftType(shiftTypeId:string){ //Working!
        const deletedShiftType = await this.shiftTypeModel.findByIdAndDelete(shiftTypeId)
        return{
            success:true,
            message:"Shift Type Deleted Successfully!",
            data: deletedShiftType
        }
    }
}