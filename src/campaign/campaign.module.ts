import { Module } from '@nestjs/common';
import { CampaignService } from './campaign.service';
import { CampaignController } from './campaign.controller';
import { DiscountsModule } from 'src/discounts/discounts.module';
import { RecommendationsModule } from 'src/recommendations/recommendations.module';

@Module({
  imports: [DiscountsModule, RecommendationsModule],
  providers: [CampaignService],
  controllers: [CampaignController],
  exports: [CampaignService],
})
export class CampaignModule {}
