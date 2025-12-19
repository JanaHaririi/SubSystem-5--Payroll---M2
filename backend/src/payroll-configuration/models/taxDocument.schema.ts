import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TaxDocumentDocument = HydratedDocument<TaxDocument>;

@Schema({ timestamps: true })
export class TaxDocument {
  @Prop({ required: true })
  employeeId: string;

  @Prop({ required: true })
  year: number;

  @Prop({ required: true })
  downloadUrl: string;
}

export const TaxDocumentSchema = SchemaFactory.createForClass(TaxDocument);

