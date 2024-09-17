import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { CampaignModule } from 'src/campaign/campaign.module';
import { EmailModule } from 'src/email/email.module';
import { MongooseModule } from '@nestjs/mongoose';
import {
  PurchaseHistory,
  PurchaseHistorySchema,
  Users,
  UsersSchema,
} from 'src/schemas/user.schema';

@Module({
  imports: [
    CampaignModule,
    EmailModule,
    MongooseModule.forFeature([{ name: Users.name, schema: UsersSchema }]),
    MongooseModule.forFeature([
      { name: PurchaseHistory.name, schema: PurchaseHistorySchema },
    ]),
  ],
  providers: [SchedulerService],
})
export class SchedulerModule {}
