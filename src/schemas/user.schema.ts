import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { privateDecrypt } from 'crypto';
import { Date, Document } from 'mongoose';

@Schema()
export class PurchaseHistory extends Document {
  @Prop({ required: true })
  userid: number;
  @Prop({ required: true })
  orderid: number;
  @Prop({ required: true })
  pcode: number;
  @Prop({ required: true })
  pname: string;
  @Prop({ required: true })
  category: string;
  @Prop({ required: false })
  price: number;
  @Prop({ required: false })
  pdesc?: string;
  @Prop({ required: false })
  status?: string;
  @Prop({ required: false })
  image?: string;
}

@Schema()
export class Recommendations extends Document {
  @Prop({ required: false })
  pname?: string;

  @Prop({ required: false })
  image?: string;

  @Prop({ required: false })
  productid?: string;
}

@Schema()
export class Users extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, type: Date })
  bdate: Date;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  userid: number;

  @Prop({
    required: false,
    type: {
      discountCode: { type: String },
      recommendations: {
        type: [SchemaFactory.createForClass(Recommendations)],
      },
      sentAt: { type: Date },
      active: { type: Boolean },
    },
  })
  bdayCampaign?: {
    discountCode: string;
    recommendations: Recommendations[];
    sentAt?: Date;
    active?: Boolean;
  };

  @Prop({ required: false, type: [PurchaseHistory] })
  purchaseHistory: PurchaseHistory[];
}

export const UsersSchema = SchemaFactory.createForClass(Users);
export const PurchaseHistorySchema =
  SchemaFactory.createForClass(PurchaseHistory);
