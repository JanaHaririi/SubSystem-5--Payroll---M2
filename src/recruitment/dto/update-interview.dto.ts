import { CreateInterviewDto } from "./create-interview.dto";
import { PartialType } from "@nestjs/mapped-types";

export class UpdateInterviewDto extends PartialType(CreateInterviewDto) {}