import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type LeavePaycodeMappingDocument = HydratedDocument<LeavePaycodeMapping>;

@Schema({ timestamps: true })
export class LeavePaycodeMapping {
  @Prop({ type: Types.ObjectId, ref: 'LeaveType', required: true, unique: true })
  leaveTypeId: Types.ObjectId;

  @Prop({ required: true })
  payrollCode: string; // e.g., "ANL-PAY", "SICK-PAY"

  @Prop()
  description?: string;
}

export const LeavePaycodeMappingSchema =
  SchemaFactory.createForClass(LeavePaycodeMapping);
