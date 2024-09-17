import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron } from '@nestjs/schedule';
import { Model } from 'mongoose';
import { CampaignService } from 'src/campaign/campaign.service';
import { EmailService } from 'src/email/email.service';
import { PurchaseHistory, Users } from 'src/schemas/user.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SchedulerService {
  constructor(
    private campaignService: CampaignService,
    private emailService: EmailService,
    @InjectModel(Users.name) private userModel: Model<Users>,
  ) {}

  //Helper function to return month and day
  private getMonthDay(date: Date): { month: number; day: number } {
    return {
      month: date.getMonth() + 1,
      day: date.getDate(),
    };
  }

  // Helper function to get date range for the upcoming week in  the format of MM DD
  private getUpcomingWeekRange(): {
    startMonthDay: { month: number; day: number };
    endMonthDay: { month: number; day: number };
  } {
    const today = new Date();
    const start = new Date(today.setHours(0, 0, 0, 0));
    const end = new Date(today.setHours(0, 0, 0, 0));
    start.setDate(today.getDate()); //we must include -7 days to make this campaign available for a week before and after the birthday.
    end.setDate(today.getDate() + 7);
    const startMonthDay = this.getMonthDay(start);
    const endMonthDay = this.getMonthDay(end);
    console.log(startMonthDay, endMonthDay);
    return { startMonthDay, endMonthDay };
  }

  // Helper function to get date range
  private getUpcomingWeekRangeDate(): {
    start: Date;
    end: Date;
  } {
    const today = new Date();
    const start = new Date(today.setHours(0, 0, 0, 0));
    const end = new Date(today.setHours(0, 0, 0, 0));
    start.setDate(today.getDate()); //we must include -7 days to make this campaign available for a week before and after the birthday.
    end.setDate(today.getDate() + 7);

    return { start, end };
  }

  // Helper function to check if the email was sent within the upcoming birthday period
  private isWithinBirthdayPeriod(sentAt: Date): boolean {
    const { start, end } = this.getUpcomingWeekRangeDate();
    return sentAt >= start && sentAt <= end;
  }

  // Function to fetch users with upcoming birthdays in the next week
  private async getUsersWithUpcomingBirthdays(): Promise<
    { id: string; email: string; name: string; bdayCampaignSentAt: Date }[]
  > {
    const { startMonthDay, endMonthDay } = this.getUpcomingWeekRange();
    try {
      const addFieldsStage = {
        $addFields: {
          month: { $month: '$bdate' },
          day: { $dayOfMonth: '$bdate' },
        },
      };

      let matchCondition: any = {};

      // Condition 1: Birthdays within the same month
      if (startMonthDay.month === endMonthDay.month) {
        matchCondition = {
          $and: [
            { month: startMonthDay.month },
            { day: { $gte: startMonthDay.day, $lte: endMonthDay.day } },
          ],
        };
      }
      // Condition 2: Birthdays spanning across two months
      else if (startMonthDay.month < endMonthDay.month) {
        matchCondition = {
          $or: [
            {
              $and: [
                { month: startMonthDay.month },
                { day: { $gte: startMonthDay.day } },
              ],
            },
            {
              $and: [
                { month: endMonthDay.month },
                { day: { $lte: endMonthDay.day } },
              ],
            },
          ],
        };
      }
      // Condition 3: Birthdays spanning from December to January
      else if (startMonthDay.month === 12 && endMonthDay.month === 1) {
        matchCondition = {
          $or: [
            {
              $and: [{ month: 12 }, { day: { $gte: startMonthDay.day } }],
            },
            {
              $and: [{ month: 1 }, { day: { $lte: endMonthDay.day } }],
            },
          ],
        };
      }

      // Final aggregation pipeline
      const users = await this.userModel
        .aggregate([
          addFieldsStage,
          {
            $match: matchCondition,
          },
        ])
        .exec();

      // Map users to an array of relevant info (id, email, name)
      return users.map((user) => ({
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        bdayCampaignSentAt: user.bdayCampaign?.sentAt,
      }));
    } catch (error) {
      console.error('Error details:', error);
      throw new InternalServerErrorException(
        'Failed to fetch users with upcoming birthdays',
      );
    }
  }

  // Cron job to send birthday campaign to users with upcoming birthdays
  //@Cron('*/30 * * * * *') // Run every 30 minutes
  @Cron('0 0 0 * * *')
  async executeCron() {
    console.log('Cron Job running');
    const users = await this.getUsersWithUpcomingBirthdays();
    const userIds = users.map((user) => user.id);
    for (const user of users) {
      // Check if email was sent recently (within the same birthday period)
      const sentAt = user.bdayCampaignSentAt;
      if (sentAt && this.isWithinBirthdayPeriod(sentAt)) {
        console.log(`Email already sent to ${user.email}. Skipping.`);
        continue;
      }
      // Get the campaign details
      const campaignDetails = await this.campaignService.getBirthdayCampaign(
        user.id,
      );

      //Send email
      this.emailService.sendEmail(
        user.name,
        user.email,
        campaignDetails.discountCode,
        campaignDetails.recommendations,
      );

      // Update the bdayCampaign field
      await this.userModel.updateOne(
        { _id: user.id },
        {
          $set: {
            bdayCampaign: {
              discountCode: await bcrypt.hash(campaignDetails.discountCode, 10),
              recommendations: campaignDetails.recommendations,
              sentAt: new Date().setHours(0, 0, 0, 0),
            },
          },
        },
      );
    }
    // For safty Removing the bdayCampaign field for users not in the upcoming birthdays list
    await this.userModel.updateMany(
      {
        _id: { $nin: userIds },
        bdayCampaign: { $exists: true },
      },
      {
        $unset: { bdayCampaign: '' },
      },
    );
  }
}
