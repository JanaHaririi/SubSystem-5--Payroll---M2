import { IsDateString, IsNotEmpty } from "class-validator";

export class ShiftAssignmentUpdateDto{
    @IsDateString()
    @IsNotEmpty()
    endDate:string
}