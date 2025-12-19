import { PartialType } from "@nestjs/mapped-types";
import { CreateJobTemplateDto } from "./create-job-template.dto";
import { CreateJobRequisitionDto } from "./create-job-requisition.dto";

export class UpdateJobRequisitionDto extends PartialType(CreateJobRequisitionDto){}