import { Module } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  PurchaseHistory,
  PurchaseHistorySchema,
  Users,
  UsersSchema,
} from 'src/schemas/user.schema';

@Module({
  providers: [RecommendationsService],
  exports: [RecommendationsService],
  imports: [
    MongooseModule.forFeature([
      { name: PurchaseHistory.name, schema: PurchaseHistorySchema },
    ]),
    MongooseModule.forFeature([{ name: Users.name, schema: UsersSchema }]),
  ],
})
export class RecommendationsModule {}
