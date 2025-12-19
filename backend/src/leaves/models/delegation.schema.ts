import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DelegationDocument = Delegation & Document;

@Schema({ timestamps: true })
export class Delegation {
  @Prop({ type: Types.ObjectId, ref: 'EmployeeProfile', required: true })
  managerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'EmployeeProfile', required: true })
  delegateManagerId: Types.ObjectId;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ default: true })
  isActive: boolean;
}

export const DelegationSchema = SchemaFactory.createForClass(Delegation);
