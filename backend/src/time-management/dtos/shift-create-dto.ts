import { IsBoolean, IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { PunchPolicy } from "../models/enums";
import { Types } from "mongoose";

export class ShiftCreateDto{
    @IsString()
    @IsNotEmpty()
    name:string

    @IsMongoId()
    @IsNotEmpty()
    shiftType:Types.ObjectId

    @IsString()
    @IsNotEmpty()
    startTime:string

    @IsString()
    @IsNotEmpty()
    endTime:string

    @IsEnum(PunchPolicy)
    @IsOptional()
    punchPolicy:PunchPolicy

    @IsNumber()
    @IsOptional()
    graceInMinutes:number

    @IsNumber()
    @IsOptional()
    graceOutMinutes:number

    @IsBoolean()
    @IsOptional()
    requiresApprovalForOvertime:boolean

    @IsBoolean()
    @IsOptional()
    active: boolean
}