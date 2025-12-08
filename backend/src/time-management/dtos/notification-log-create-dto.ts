import { IsMongoId, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { Types } from "mongoose";

export class NotificationLogCreateDto{
    @IsMongoId()
    @IsNotEmpty()
    to:Types.ObjectId;

    @IsString()
    @IsNotEmpty()
    type:string

    @IsString()
    @IsOptional()
    message:string
}
