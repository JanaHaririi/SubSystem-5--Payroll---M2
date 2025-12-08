import { CreateFeedbackDto } from "./create-feedback.dto";
import { PartialType } from "@nestjs/mapped-types";

export class UpdateFeedbackDto extends PartialType(CreateFeedbackDto) {}