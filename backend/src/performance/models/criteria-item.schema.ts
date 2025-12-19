import { Prop, Schema } from '@nestjs/mongoose';

@Schema({ _id: false })
export class CriteriaItem {
  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ required: true })
  weight: number;
}
