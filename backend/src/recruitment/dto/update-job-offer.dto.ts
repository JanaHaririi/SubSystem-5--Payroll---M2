import { CreateJobOfferDto } from "./create-job-offer.dto";
import { PartialType } from "@nestjs/mapped-types";

export class UpdateJobOfferDto extends PartialType(CreateJobOfferDto){}