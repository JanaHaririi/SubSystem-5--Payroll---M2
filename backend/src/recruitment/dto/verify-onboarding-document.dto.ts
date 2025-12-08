// backend/src/dto/verify-onboarding-document.dto.ts
import { IsMongoId, IsNotEmpty } from 'class-validator';

export class VerifyOnboardingDocumentDto {
  @IsMongoId()
  @IsNotEmpty()
  verifiedBy: string; // HR employee who verified document
}
