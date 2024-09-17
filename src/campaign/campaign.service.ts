import { Injectable } from '@nestjs/common';
import { DiscountsService } from 'src/discounts/discounts.service';
import { RecommendationsService } from 'src/recommendations/recommendations.service';

@Injectable()
export class CampaignService {
  constructor(
    private discountService: DiscountsService,
    private recommendationService: RecommendationsService,
  ) {}
  async getBirthdayCampaign(userId: string): Promise<{
    discountCode: string;
    recommendations: { pname: string; image: string; productid: string }[];
  }> {
    const discountCode =
      await this.discountService.generateDiscountCode(userId);
    const recommendations =
      await this.recommendationService.getRecommendations(userId);
    return {
      discountCode,
      recommendations,
    };
  }
}
