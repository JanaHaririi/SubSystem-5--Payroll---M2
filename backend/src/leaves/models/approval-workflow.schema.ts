import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ApprovalWorkflowDocument = HydratedDocument<ApprovalWorkflow>;

@Schema({ timestamps: true })
export class ApprovalWorkflow {
  @Prop({ type: Types.ObjectId, ref: 'LeaveType', required: true })
  leaveTypeId: Types.ObjectId;

  @Prop({
    type: [
      {
        role: { type: String, required: true },
        order: { type: Number, required: true },
      },
    ],
    default: [],
  })
  flow: {
    role: string;
    order: number;
  }[];
}

export const ApprovalWorkflowSchema =
  SchemaFactory.createForClass(ApprovalWorkflow);
