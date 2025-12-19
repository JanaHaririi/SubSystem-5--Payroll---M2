import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PayrollDisputeDocument = HydratedDocument<PayrollDispute>;

@Schema({ timestamps: true })
export class PayrollDispute {
  @Prop({ required: true })
  employeeId: string;

  @Prop({ required: true })
  description: string;

  @Prop({ default: 'open' })
  status: 'open' | 'resolved';

  @Prop()
  amount?: number;
}

export const PayrollDisputeSchema = SchemaFactory.createForClass(PayrollDispute);

