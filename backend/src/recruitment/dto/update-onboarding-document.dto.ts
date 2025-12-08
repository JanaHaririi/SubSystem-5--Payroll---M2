import { CreateOnboardingDocumentDto } from "./create-onboarding-document.dto";
import { PartialType } from "@nestjs/mapped-types";

export class UpdateOnboardingDocumentDto extends PartialType(CreateOnboardingDocumentDto) {}