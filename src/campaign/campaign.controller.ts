import { Controller, Get, Param } from '@nestjs/common';
import { CampaignService } from './campaign.service';

@Controller('campaign')
export class CampaignController {
  constructor(private campaignService: CampaignService) {}

  @Get('birthday/:userId')
  async getBirthdayCampaign(@Param('userId') userId: string) {
    return this.campaignService.getBirthdayCampaign(userId);
  }
}
