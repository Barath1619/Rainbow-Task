This system is an extension of the In an application, designed to offer users a personalized, one-time opportunity to claim a special discount during their birthday week. The system generates a unique discount code and recommends up to three products based on the user's previous purchases, which are then sent via email. Additionally, a dedicated birthday section featuring these product recommendations will be prominently displayed on the home screen, enhancing user engagement and ensuring a seamless experience during their birthday week.

### Assumptions

I have assumed that there is a database with user information and previous purchase details. I have also managed to built a end point to add users and add product purchases for the testing.

### Architectural Design for Birthday Discount Campaign System

1. **Campaign Triggering**: The system should trigger emails before the user's birthday.
2. **Personalized Recommendations**: Suggest products based on past purchase history .
3. **Discount Code Generation**: A unique discount code must be generated and sent to the user.
4. **BirthDay Section**: When the user opens the app within the birthday week, the same product recommendations and discount should be displayed.
5. **Security & Scalability**: The system must be scalable to handle of users and secure to protect user data.

### Project Structure in NestJS

```bash
src/
│
├── campaign/                     # Campaign module
│   ├── campaign.controller.ts    # API endpoints for the campaign
│   ├── campaign.service.ts       # get results from discount and recomm.
│   └── campaign.module.ts        # Module declaration
│
├── discount/                      # Discount generation module
│   ├── discount.service.ts        # Generates unique discount codes
│   └── discount.module.ts         # Module declaration
│
├── recommendation/                # Recommendation engine module
│   ├── recommendation.service.ts  # Fetch personalized products for users
│   └── recommendation.module.ts   # Module declaration
│
├── scheduler/                     # Scheduler called every day at 12 
│   ├── scheduler.service.ts       # Uses cron jobs to check users with upcoming birthdays and gets the detials from campaign and sends to eamil services.
│   └── scheduler.module.ts        # Module declaration
│
├── email/                         # Email service using mailjet 
│   ├── email.service.ts           # Handles sending emails
│   └── email.module.ts            # Module declaration
├── users/                         # Email service using mailjet 
│   ├── users.service.ts           # Handles user creating and purchase
│   ├── users.module.ts            # Module declaration
│   └── users.control.ts           # All user related end points 
├── app.module.ts                  # Main app module
└── main.ts                        # Entry point
```

### End To End Flow Diagram

![Uploading Screenshot 2024-09-16 at 8.51.14 PM.png…]()

1. **`main.ts` and `app.module.ts`**: These files serve as the **central entry point** of the application. The `main.ts` file is responsible for bootstrapping the NestJS application, while `app.module.ts` is the root module that imports all relevant modules. This also includes the necessary module to initiate cron jobs, which are managed by the `SchedulerService` inside `scheduler.module.ts`.
2. **`app.module.ts` establishes the database connection with MongoDB Atlas**: Using `MongooseModule.forRoot()`, the application is configured to connect to MongoDB Atlas.
3. **`app.module.ts` also triggers the Cron jobs defined in `SchedulerService.ts`**: The cron job is configured to run every day at **12 AM** through the `Cron` decorator declared in  the `SchedulerService.ts` part of the `SchedulerModule`.
4. **`SchedulerService.ts` determines the start and end time for the campaign period**: It defines the campaign period by calculating the current date and the dates within a **one-week range**. It uses three different date-range conditions:
    - Birthdays within the same month
    - Birthdays spanning across two months
    - Birthdays spanning from December to January
5. **`getUsersWithUpcomingBirthdays()` accesses user data from the database**: The method pulls relevant user records from the MongoDB database, specifically retrieving the `dateOfBirth` field. This is used to determine eligible users for the campaign, filtering only those whose birthdays are within the next 7 days.
6. **`campaign.service.ts` is called to handle the core business logic**: Once the eligible users are identified, `CampaignService` is invoked to generate personalized discount codes and gather product recommendations for each user. This service acts as the **central orchestrator**, combining logic from both the `DiscountService` and `RecommendationService`.
7. **`campaign.service.ts` in turn calls `discount.service.ts`**: The `DiscountService` is responsible for generating a **unique discount code** for each user using the `UUID v4` standard.
8. **`campaign.service.ts`** also calls `recommendation.service.ts` to obtain the necessary product recommendations. 
9. **`recommendation.service.ts` accesses the purchase history of users**: This service retrieves the purchase data for each user from the database and applies **custom logic** to rank products by their frequency and relevance based on their past behavior, ensuring that the campaign remains effective and targeted.
10.  **`email.service.ts` is invoked to send personalized emails**: Once the discount codes and recommended products are generated, `EmailService` is responsible for sending out the birthday campaign emails to the users. This is done via the **Mailjet API**, where each email contains the discount code and a curated list of recommended products. 
11. **The discount code and recommendations are stored in the database**: To provide a seamless user experience, the discount code and recommended products are also saved in the database. This data persistence ensures that users can redeem their discount and see the recommended products from the email and the app interface on their birthday week.
12. **The user receives the email with discount codes and recommended products**: After processing, the user receives a personalized email with a **unique discount code** and up to three recommended products.
13. **Finally, users can view their recommended products in the application**: When users log into the application during their birthday week, they will see the **birthday section** on their home screen. This section highlights the personalized discounts and the recommended products, allowing them to quickly access the campaign offers.

### Module Structure:

![Uploading Screenshot 2024-09-15 at 9.21.49 PM.png…]()


### Skeleton Code

App Module (`app.module.ts`)

```tsx
import { SchedulerModule } from './scheduler/scheduler.module';
import { UsersModule } from './users/users.module';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ScheduleModule } from '@nestjs/schedule';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    SchedulerModule,
    UsersModule,
    ScheduleModule.forRoot(),
    ConfigModule.forRoot(),
    MongooseModule.forRoot(process.env.MONGODB_URI),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

Scheduler Module (`scheduler/scheduler.module.ts`)

```tsx
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
```

Scheduler Service (`scheduler/scheduler.service.ts`)

```tsx
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
  // Function to fetch users with upcoming birthdays in the next week
  private async getUsersWithUpcomingBirthdays(): Promise<
    { id: string; email: string; name: string; bdayCampaignSentAt: Date }[]
  > {
      // Condition 1: Birthdays within the same month
      
      // Condition 2: Birthdays spanning across two months
      
      // Condition 3: Birthdays spanning from December to January
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
     
    // For safty Removing the bdayCampaign field for users not in the upcoming birthdays list
   
  }
}

```

Campaign Module (`campaign/campaign.module.ts`)

```tsx
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
```

Campaign Service (`campaign/campaign.service.ts`)

```tsx
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
```

Discount Module (`discount/discount.module.ts`)

```tsx
import { Module } from '@nestjs/common';
import { DiscountsService } from './discounts.service';

@Module({
  providers: [DiscountsService],
  exports: [DiscountsService],
})
export class DiscountsModule {}
```

Discount Service (`discount/discount.service.ts`)

```tsx
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

@Injectable()
export class DiscountsService {
  async generateDiscountCode(userId: string): Promise<string> {
    return `DISCOUNT${randomUUID()}${userId}`;
  }
}
```

Recommendation Module (`recommendation/recommendation.module.ts`)

```tsx
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
```

Recommendation service (`recommendation/recommendation.service.ts`)

```tsx
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PurchaseHistory, Users } from 'src/schemas/user.schema';

@Injectable()
export class RecommendationsService {
  constructor(@InjectModel(Users.name) private userModel: Model<Users>) {}

  async getRecommendations(
    userId: string,
  ): Promise<{ pname: string; image: string; productid: string }[]> {
    // Algorithm for the top 3 most recommended products 
    return sortedProducts.slice(0, 3).map((p) => ({
      pname: p.details.pname,
      image: p.details.image,      
      }));
  }
}

```

Email Module (`email/email.module.ts`)

```tsx
import { Module } from '@nestjs/common';
import { EmailService } from './email.service';

@Module({
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
```

Email Service (`email/email.service.ts`)

```tsx
import { Injectable } from '@nestjs/common';
import { Client } from 'node-mailjet';

@Injectable()
export class EmailService {
  async sendEmail(
    name: string,
    emailid: string,
    discountCode: string,
    products: { pname: string; image: string; productid: string }[],
  ) {
    const mailjet = new Client({
      apiKey: process.env.MAILJET_API_KEY,
      apiSecret: process.env.MAILJET_API_SECRET,
    });

    const request = mailjet.post('send', { version: 'v3.1' }).request({
    //Message, to, from, discount code and recommendations
    }]
    request
      .then((result: { body: any }) => {
        console.log(result.body);
      })
      .catch((err: { statusCode: number }) => {
        console.log(err.statusCode);
      });
  }
}
```

### Entity Relationship Diagram.

![Screenshot 2024-09-17 at 1.59.50 AM.png](https://prod-files-secure.s3.us-west-2.amazonaws.com/25191181-6ef9-4334-928e-e7440e2bab7f/f44afc01-7130-42d5-8952-a061d5c31c16/Screenshot_2024-09-17_at_1.59.50_AM.png)

### Additional Consideration

- **Data Cleaning**: Old campaign data should be removed to keep the system efficient. This can also apply to old discount codes. (which is done in this project)
- **Fallback Mechanism for Discount Code Generation**: If the discount service fails to generate a code, consider storing pre-generated codes and using them as backups.
- **Sensitive Data Encryption**: Ensure sensitive data like email addresses, discount codes, and any PII (Personally Identifiable Information) are encrypted both in transit (using HTTPS/TLS) and at rest (using encryption mechanisms like MongoDB’s encryption-at-rest). Discount coupons are hashed when storing it in the DB.(This is achieved in the project using Bycrpt)
- **Authentication & Authorization**: Only authorized users should have access to campaign generation and user information. Use **JWT tokens** or **OAuth2** to secure API endpoints.
- **Environment Variables**: Securely manage environment variables (e.g., MongoDB URI, Mailjet API keys) using services like **AWS Secrets Manager** instead of storing them in plain `.env` files.
- **Asynchronous Operations**: Sending emails and generating recommendations should be decoupled from the cron job via message queues (e.g., RabbitMQ, Kafka) to ensure the cron job doesn’t block and can process many users efficiently.
- **Optimizing Cron Jobs**: Instead of querying the database every day for all users with upcoming birthdays, precompute and cache users with upcoming birthdays (e.g., every month).
- **Alerting**: Set up alerts for failures in sending emails, failed cron jobs, or critical service downtimes
- **Unit Testing**: Ensure that every service (e.g., `DiscountService`, `RecommendationService`, `EmailService`) has robust unit tests to validate logic and catch issues early.
- **Integration Testing**: Simulate interactions between services to ensure that data flows correctly from user selection, discount generation, recommendation fetching, and email sending.

### **Proposed Microservices Architecture**

In the proposed microservices architecture, each module would be a standalone service. Here’s how it would be broken down:

1. **User Service**
    
    Responsible for handling user-related actions (creation, purchase history).
    
2. **Discount Service**
    
    Handles the generation of unique discount codes for users.
    
3. **Recommendation Service**
    
    Fetches personalized product recommendations for users based on their purchase history.
    
4. **Campaign Service**
    
    Coordinates the birthday campaign, calls both the discount and recommendation services, and triggers email sending.
    
5. **Email Service**
    
    Responsible for sending emails using an external service using Mailjet .
    
6. **Scheduler Service**
    
    Uses a cron job to check upcoming birthdays and communicates with the campaign service to trigger the entire process.
    

![Screenshot 2024-09-17 at 1.09.38 AM.png](https://prod-files-secure.s3.us-west-2.amazonaws.com/25191181-6ef9-4334-928e-e7440e2bab7f/84181267-b8ae-445c-bb89-53f43dce698f/Screenshot_2024-09-17_at_1.09.38_AM.png)

**Key Advantages of Microservices Architecture**:

- **Scalability**:
    
    Each service can be scaled independently based on its load.
    
- Remove BottleNecks:
    
    Flow of data, tasks, or resources is restricted or slowed down, causing a decrease in overall efficiency and performance.
    
- **Maintainability**:
    
    Codebases are easier to manage when each service has its own responsibilities.
    
- **Fault Isolation**:
    
    Failure in one service (e.g., recommendation) won’t bring down the entire system.
    

## Code Explanation

### AppModule

- AppModule is the Starting point, `SchedulerModule` and `UserModule` is imported. `ScheduleModule.forRoot()` will be trigging the Cron jobs
- `MongooseModule.forRoot(process.env.MONGODB_URI)` will be connecting to the MongoDB database.

```
@Module({
  imports: [
    SchedulerModule,
    UsersModule,
    ScheduleModule.forRoot(),
    ConfigModule.forRoot(),
    MongooseModule.forRoot(process.env.MONGODB_URI),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

### SchedulerModule

- A cron job runs every day at 00:00 am and finds the Users with Upcoming Birthday using `this.getUsersWithUpcomingBirthdays();`

```
@Cron('0 0 0 * * *')
  async executeCron() {
    console.log('Cron Job running');
    const users = await this.getUsersWithUpcomingBirthdays();
    const userIds = users.map((user) => user.id);
```

- Below is the algorithm for finding the users with their birthdays in a set time period

```tsx
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
        
```

- Check if there are any emails sent to the already.

```
for (const user of users) {
      // Check if email was sent recently (within the same birthday period)
      const sentAt = user.bdayCampaignSentAt;
      if (sentAt && this.isWithinBirthdayPeriod(sentAt)) {
        console.log(`Email already sent to ${user.email}. Skipping.`);
        continue;
      }
```

- calls campaign information using `this.campaignService.getBirthdayCampaign(user.id);` function from the Campaign module.

```tsx
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

```

- After receiving the details from the Campaign module, it send email using `this.emailService.sendEmail` of the Email Module.

```jsx
/Send email
      this.emailService.sendEmail(
        user.name,
        user.email,
        campaignDetails.discountCode,
        campaignDetails.recommendations,
      );
```

- Additionally store the information like discount code, recommendation and SentAt information in the database in an object for future use. Also remove that `bdayCampaign` object from all other users who don’t fall in that time frame

```tsx
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
```

### CampaignModule

- This module just calls the `generateDiscountCode(userId)` and `getRecommendations(userId);`  from the `DiscountModule` and `RecommendationModule`.

```tsx
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
```

### DiscountModule

- It generates a unique discount code for the each user using their userid and **Universally Unique Identifier version 4** (UUID v4)

```tsx
@Injectable()
export class DiscountsService {
  async generateDiscountCode(userId: string): Promise<string> {
    return `DISCOUNT${randomUUID()}${userId}`;
  }
}
```

### RecommendationModule

- This is responsible for providing the upto 3 recommendations based users purchase history.

```
async getRecommendations(
    userId: string,
  ): Promise<{ pname: string; image: string; productid: string }[]> {
    const userdetails = await this.userModel.findById(userId).exec();

    const productMap: { [key: string]: { count: number; details: any } } = {};

    for (const purchase of userdetails.purchaseHistory) {
      const productKey = purchase.pcode;

      if (!(productKey in productMap)) {
        productMap[productKey] = { count: 1, details: purchase };
      } else {
        productMap[productKey].count++;
      }
    }
    // Convert the productCount object to an array and sort by count in descending order
    const sortedProducts = Object.values(productMap).sort(
      (a, b) => b.count - a.count,
    );

    // Return the top 3 most purchased products
    return sortedProducts.slice(0, 3).map((p) => ({
      pname: p.details.pname,
      //image: p.details.image,      //Ideally this the field but because I have not added image in my DB, I have hardcoded image url.
      productid: p.details._id.toString(),
      image:
        'https://www.healthyeating.org/images/default-source/home-0.0/nutrition-topics-2.0/general-nutrition-wellness/2-2-2-2foodgroups_vegetables_detailfeature.jpg?sfvrsn=226f1bc7_6',
    }));
  }
}
```

### EmailModule

- This module describes the content of the email to be sent to the users and uses third party api Mailjet to send emails to the users.
- Its gets the information like discount code and recommendation products and integrates with the email content.

```
const request = mailjet.post('send', { version: 'v3.1' }).request({
      Messages: [
        {
          From: {
            Email: `r.barathofficial@gmail.com`,
            Name: 'R-ainbow',
          },
          To: [
            {
              Email: `${emailid}`,
              Name: `${name}`,
            },
          ],
          Subject:
            '🎉 Happy Birthday! Enjoy a Special Discount Just for You! 🎁',
          TextPart: 'Greetings from Mailjet!',
          HTMLPart: `<div style="font-family: Arial, sans-serif; color: #333;">
    <h3>Dear ${name},</h3>
    <p>
      We hope you have an amazing birthday week ahead! To make your day even more special,
      we’re excited to offer you an exclusive birthday discount just for you.
    </p>
    
    <h4>Your Birthday Discount Code:</h4>
    <div style="background-color: #f7f7f7; padding: 15px; text-align: center; border-radius: 5px;">
      <h3 style="color: #d9534f;">${discountCode}</h3>
    </div>
    
    <p>Use this code at checkout to save on your next purchase!</p>

    <h4>Here are some personalized recommendations we think you’ll love:</h4>
    <div style="padding: 10px 0;">
      ${products
        .map(
          (product) => `
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="${product.image}" alt="${product.pname}" style="width: 150px; border-radius: 5px;" />
          <h4 style="margin-top: 10px;">${product.pname}</h4>
        </div>
      `,
        )
        .join('')}
    </div>

    <p>Thank you for being a valued customer! We hope this offer makes your birthday even better.</p>
    
    <p>Enjoy,</p>
    <p><strong>Team R-ainbow</strong></p>
    
    <p>Visit our store at <a href="https://r-ainbow.com/" style="color: #337ab7;">R-ainbow</a>!</p>
  </div>`,
        },
      ],
    });
```

![Screenshot 2024-09-15 at 2.23.58 PM.png](https://prod-files-secure.s3.us-west-2.amazonaws.com/25191181-6ef9-4334-928e-e7440e2bab7f/dd68d18b-6e3b-438b-8452-00668957f513/Screenshot_2024-09-15_at_2.23.58_PM.png)

![Screenshot 2024-09-15 at 2.24.21 PM.png](https://prod-files-secure.s3.us-west-2.amazonaws.com/25191181-6ef9-4334-928e-e7440e2bab7f/a9f79a4d-bd16-4844-9361-a12cfbde11a5/Screenshot_2024-09-15_at_2.24.21_PM.png)

### UserModule

This is additional module which I have built to add users to the DB also to add order to the purchase history for each of the users, for the need of data for testing

```tsx
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post('create')
  async createUsers(
    @Body() createUsersDto: CreateUserDto,
  ): Promise<UserResponse> {
    return this.usersService.createUser(createUsersDto);
  }

  @Get('allusers')
  async getAllUsers(): Promise<any> {
    return this.usersService.getAllUsers();
  }

  @Post('buy')
  async buyProduct(@Body() buyProduct: BuyProductDto): Promise<UserResponse> {
    return this.usersService.buyProduct(buyProduct);
  }

  @Get('allpurchase')
  async getAllPurchases(): Promise<UserResponse> {
    return this.usersService.getAllPurchases();
  }
}
```

### Assumed Schema

Below is how the assumed schema of the users looks like, bdayCampaign is the one which determined of the users will the birthday section a not, if its present, then it means they are eligible, I have also kept the active and sentAt field, where active field will be true initially but turns false if the user access discount coupons should not work. similarly sentAt field is recorded to check if the user have been sent the email to not send them any duplicate emails  

```tsx
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
```

### How to run the application (ReadMe.md)

```

1. Install Dependencies
   npm install
2. Set Up Environment Variables
   Create a .env file at the root of the project (if it doesn't exist already) and add your necessary environment variables, such as Mailjet API keys, JWT secret and database connection strings.  
   note: You can use my .env.example file for now, I'll keep my db running.
3. Run the Application
   npm run start:dev

Testing the API

visit: http://localhost:3000/ (in postman) ==> you can see "hello world"

create user api:
POST http://localhost:3000/users/create/
body:
{
"name": "Barath152",
"bdate": "09-15-1997", // give in a date between from today to +7, otherwise it will be ignored. you can change it in schedule.service.ts  
 "email": "abc@gmail.com" // must be unique, provide ur email address to receive the email
}

you should receive below response.
{
"data": {
"name": "Barath152",
"bdate": "1997-09-14T23:00:00.000Z",
"email": "r.barathofficial+6731.@gmail.com",
"userid": 7,
"\_id": "66e7601d7a9a0c917f253ffa",
"purchaseHistory": [],
"\_\_v": 0
},
"message": "User added",
"status": 201
}

add products to purchase list, so that you can get recommendation out of the purchase.
POST localhost:3000/users/buy/

body:
{
"userid":6, //use the userid from the user creation response
"pname":"grapes", // product name
"pcode":3 // Product code must be uniques for each product, example: 1 for apple, 2 for banana, 3 for grapes
"category":"fruits",
}

you should receive below response.
{
"data": {
"userid": 7,
"orderid": 30,
"pcode": 3,
"pname": "grapes",
"category": "fruits",
"\_id": "66e760e67a9a0c917f253ffd",
"\_\_v": 0
},
"message": "Product bought",
"status": 201
}

Testing the API

1. Check the Default Route

Visit the following URL in Postman:
GET http://localhost:3000/

You should see the response:
"hello world"

2. Create a User
Use this API to create a new user.

Endpoint:
POST http://localhost:3000/users/create/
Body:
{
  "name": "Barath152",
  "bdate": "09-15-1997",  // Use a date between today and the next 7 days for scheduling purposes.
  "email": "abc@gmail.com" // Must be unique, provide your email to receive the birthday email.
}
Expected Response:
{
  "data": {
    "name": "Barath152",
    "bdate": "1997-09-14T23:00:00.000Z",
    "email": "r.barathofficial+6731.@gmail.com",
    "userid": 7,
    "_id": "66e7601d7a9a0c917f253ffa",
    "purchaseHistory": [],
    "__v": 0
  },
  "message": "User added",
  "status": 201
}

3. Add Products to Purchase List
Once the user is created, you can add products to their purchase history for recommendations.

Endpoint:
POST http://localhost:3000/users/buy/
Body:
{
  "userid": 7,         // Use the userid from the user creation response
  "pname": "grapes",   // Product name
  "pcode": 3,          // Product code must be unique for each product (e.g., 1 for apple, 2 for banana, 3 for grapes)
  "category": "fruits"
}
Expected Response:
{
  "data": {
    "userid": 7,
    "orderid": 30,
    "pcode": 3,
    "pname": "grapes",
    "category": "fruits",
    "_id": "66e760e67a9a0c917f253ffd",
    "__v": 0
  },
  "message": "Product bought",
  "status": 201
}

4. Trigger Emails with Cron Jobs
Set the cron job to run every 30 seconds (modify scheduler.service.ts) and observe the emails being triggered automatically based on upcoming birthdays.

The emails will contain personalized discount codes and product recommendations based on the user's purchase history.

You're All Set!
Once the application is running and the cron job is set up, you should receive personalized birthday emails with recommendations and discount codes within 30 seconds if the user's birthday is within the specified range.
```
