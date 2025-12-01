import { EmployeeProfileService } from './../../employee-profile/employee-profile.service';
import { ShiftAssignmentCreateDto } from './../dtos/shift-assignment-create-dto';
import { ShiftAssignmentDocument } from './../models/shift-assignment.schema';
import { BadRequestException, Body, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { ShiftAssignment } from "../models/shift-assignment.schema";
import { Model, Types } from 'mongoose';
import { EmployeeProfile, EmployeeProfileDocument } from '../../employee-profile/models/employee-profile.schema';
import { Department, DepartmentDocument } from '../../organization-structure/models/department.schema';
import { Position, PositionDocument } from '../../organization-structure/models/position.schema';
import { Shift, ShiftDocument } from '../models/shift.schema';
import { OrganizationStructureService } from '../../organization-structure/organization-structure.service';
import { ShiftAssignmentStatus } from '../models/enums';
import { ShiftAssignmentUpdateDto } from '../dtos/shift-assignment-update-dto';

@Injectable()
export class ShiftAssignmentService{
    constructor(
        @InjectModel(ShiftAssignment.name) 
        private shiftAssignmentModel:Model<ShiftAssignmentDocument>,
        @InjectModel(Shift.name)
        private shiftModel: Model<ShiftDocument>,
        private employeeProfileService:EmployeeProfileService,
        private organizationStructureService:OrganizationStructureService
        
        
){}
    async assignShift(assignData:ShiftAssignmentCreateDto){
        if(!assignData.employeeId&&!assignData.departmentId&&!assignData.positionId){
            throw new BadRequestException("Either Employee ID, Department ID or Position ID must be provided!");
        }
        const dataLength = [
            assignData.employeeId,assignData.departmentId,assignData.positionId
        ].filter(Boolean).length
        if(dataLength>1){
            throw new BadRequestException("Only provide either Employee ID, Department ID or Position ID");
        }
        if(!assignData.shiftId){
            throw new BadRequestException("Shift ID must be provided!")
        }

        if(assignData.employeeId){
            const employee = await this.employeeProfileService.getMyProfile(assignData.employeeId.toString())
            if(!employee) throw new NotFoundException("Employee not found!")
        }
        if(assignData.departmentId){
            const department = await this.organizationStructureService.getDepartmentById(assignData.departmentId.toString())
            if(!department) throw new NotFoundException("Department not found!")
        }
        if(assignData.positionId){
            const position = await this.organizationStructureService.getPositionById(assignData.positionId.toString())
            if(!position) throw new NotFoundException("Position not found!")
        }
        const shift = await this.shiftModel.findById(assignData.shiftId)
        if(!shift) throw new NotFoundException("Shift not found!")
        const shiftAssignment = await this.shiftAssignmentModel.create({
            employeeId: assignData.employeeId,
            departmentId: assignData.departmentId,
            positionId: assignData.positionId,
            shiftId: assignData.shiftId
        })
        return{
            success: true,
            message: "Shift Assigned Successfully!",
            data: shiftAssignment
        }
    }
    async updateShiftAssignment(newStatus:ShiftAssignmentStatus,shiftAssignmentId:string){
        if(!Object.values(ShiftAssignmentStatus).includes(newStatus)){
            throw new BadRequestException(`Status: ${newStatus} is invalid!`)
        }  
        const shiftAssignment = await this.shiftAssignmentModel.findByIdAndUpdate(shiftAssignmentId, {
            status: newStatus}, {new: true})
        if(!shiftAssignment){
            throw new NotFoundException('Shift Assignment not found!')
        }
        return{
            success:true,
            message: "Shift Assignment Status Updated Successfully!",
            data: shiftAssignment
        }
    }
    async getShiftAssignmentById(shiftAssignmentId: string){
        const shiftAssignment = await this.shiftAssignmentModel.findById(shiftAssignmentId)
        if(!shiftAssignment) throw new NotFoundException('Shift Assignment not found!')
        return{
            sucess: true,
            message: "Shift assignment found successfully!",
            data: shiftAssignment
        }
    }
    async getAllShiftAssignments(){
        const shiftAssignments = await this.shiftAssignmentModel.find()
            .populate('employeeId')
            .populate('shiftId')
            .populate('positionId')
            .populate('departmentId')
            .exec()
        if(!shiftAssignments) throw new NotFoundException('Shift Assignments not found!')
        return{
            success:true,
            message: "Shift Assignments found successfully!",
            data: shiftAssignments
        }
    }
    async extendShiftAssignment(dto:ShiftAssignmentUpdateDto,shiftAssignmentId: string){
        const newEndDate = new Date(dto.endDate);
        if(isNaN(newEndDate.getTime())) throw new BadRequestException("Invalid date format. Use ISO format like YYYY-MM-DD.")
        // Check if the provided date is in the future
        if (newEndDate <= new Date()) {
            throw new BadRequestException('The extension date must be in the future.');
        }
        const shiftAssignment = await this.shiftAssignmentModel.findById(shiftAssignmentId)
        if(!shiftAssignment) throw new NotFoundException('Shift Assignment not found!')
        shiftAssignment.endDate = newEndDate
        await shiftAssignment.save()
    
        return{
            success:true,
            message: "Shift assignment expiry date extended!",
            data:shiftAssignment
        }
    }
    async detectUpcomingExpiry(){
        const shiftAssignments = await this.shiftAssignmentModel.find()
        const near_days = 3
        const now = Date.now()
        if(!shiftAssignments) throw new NotFoundException('Shift assignments not found!')
        const processed = shiftAssignments.map(s=>{
            const diffDays = (s.endDate!.getTime() - now) / (1000*60*60*24)
            
        })
        return{
            success:true,
            message: "Shift Assignments nearing expiry returned!",
            data:processed
        }
        
    }
    
}