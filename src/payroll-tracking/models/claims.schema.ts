import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { EmployeeProfile } from '../../employee-profile/models/employee-profile.schema';
import { ClaimStatus } from '../enums/payroll-tracking-enum';

export type ClaimsDocument = HydratedDocument<Claims>;

@Schema({ timestamps: true, collection: 'claims' })
export class Claims {
  @Prop({ required: true, unique: true })
  claimId: string; // e.g. CLAIM-0001

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  claimType: string; // medical, travel, housing...

  @Prop({ type: Types.ObjectId, ref: EmployeeProfile.name, required: true })
  employeeId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: EmployeeProfile.name })
  financeStaffId?: Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop()
  approvedAmount?: number;

  @Prop({
    required: true,
    type: String,
    enum: Object.values(ClaimStatus),
    default: ClaimStatus.UNDER_REVIEW,
  })
  status: ClaimStatus;

  @Prop()
  rejectionReason?: string;

  @Prop()
  resolutionComment?: string;
}

export const claimsSchema = SchemaFactory.createForClass(Claims);
