import { InjectModel } from "@nestjs/mongoose";
import { Shift, ShiftDocument } from "../models/shift.schema";
import { Model } from "mongoose";
import { ShiftCreateDto } from "../dtos/shift-create-dto";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { ShiftType, ShiftTypeDocument } from "../models/shift-type.schema";

export class ShiftService{
    constructor(
        @InjectModel(Shift.name)
        private shiftModel: Model<ShiftDocument>,
        @InjectModel(ShiftType.name)
        private shiftTypeModel: Model<ShiftTypeDocument>
    ){}
    async createShift(shiftData:ShiftCreateDto){
        if(!shiftData.name || !shiftData.startTime || !shiftData.endTime || !shiftData.shiftType){
            throw new BadRequestException('All data must be provided!')
        }
        const shiftType = await this.shiftTypeModel.findById(shiftData.shiftType)
        if(!shiftType) throw new NotFoundException('Shift Type not found!')

        const shift = await this.shiftModel.create({
            name: shiftData.name,
            startTime: shiftData.startTime,
            endTime:shiftData.endTime,
            shiftType: shiftData.shiftType,
            punchPolicy: shiftData.punchPolicy,
            graceInMinutes: shiftData.graceInMinutes,
            graceOutMinutes: shiftData.graceOutMinutes,
            active: shiftData.active,
            requiresApprovalForOvertime: shiftData.requiresApprovalForOvertime
        })
        return{
            success:true,
            message: "Shift Created Successfully!",
            data:shift

        }
    }
    async getAllShifts(){
        const shifts = await this.shiftModel.find()
        if(!shifts) throw new NotFoundException("No shifts found!")
        return{
            success:true,
            message: "Shifts found successfully!",
            data: shifts
        }
    }
    async getShiftById(shiftId:string){
        const shift = await this.shiftModel.findById(shiftId)
        if(!shift){
            throw new NotFoundException('No shift found!')
        }
        return{
            success:true,
            message:"Shift found by ID successfully!",
            data: shift
        }
    }
    async deactivateShift(shiftId:string){
        const shift = await this.shiftModel.findByIdAndUpdate(shiftId, {active:false}, {new:true})
        if(!shift) throw new NotFoundException('Shift not found!')
        return{
            success:true,
            message: "Shift deactivated successfully",
            data: shift
        }
    }
    async activateShit(shiftId:string){
        const shift = await this.shiftModel.findByIdAndUpdate(shiftId, {active:true}, {new:true})
        if(!shift) throw new NotFoundException("Shift not found!")
        return{
            success:true,
            message: "Shift activated successfully!",
            data:shift
        }
    }
    async deleteShift(shiftId:string){
        const shift = await this.shiftModel.findByIdAndDelete(shiftId)
        if(!shift) throw new NotFoundException('Shift not found!')
        return{
            success:true,
            message: "Shift deleted succesfully!",
            data:shift
        }
    }
}