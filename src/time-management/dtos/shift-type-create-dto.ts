import { IsBoolean, IsNotEmpty, IsString } from "class-validator";

export class ShiftTypeCreateDto{
    @IsNotEmpty()
    @IsString()
    name:string;

    @IsNotEmpty()
    @IsBoolean()
    active:boolean;
}