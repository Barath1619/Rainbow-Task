# R-ainbow

**Introduction**

This system is an extension of the Rainbow application, designed to offer users a personalized, one-time opportunity to claim a special discount during their birthday week. The system generates a unique discount code and recommends up to three products based on the user's previous purchases, which are then sent via email. Additionally, a dedicated birthday section featuring these product recommendations will be prominently displayed on the home screen, enhancing user engagement and ensuring a seamless experience during their birthday week.

### Assumptions

I have assumed that there is a database with user information and previous purchase details. I have also managed to built a end point to add users and add product purchases for the testing.

### Architectural Design for Birthday Discount Campaign System

1. **Campaign Triggering**: The system should trigger emails before the user's birthday.
2. **Personalized Recommendations**: Suggest products based on past purchase history .
3. **Discount Code Generation**: A unique discount code must be generated and sent to the user.
4. **BirthDay Section**: When the user opens the app within the birthday week, the same product recommendations and discount should be displayed.
5. **Security & Scalability**: The system must be scalable to handle of users and secure to protect user data.

src/
│
├── campaign/ # Campaign module
│ ├── campaign.controller.ts # API endpoints for the campaign
│ ├── campaign.service.ts # get results from discount and recomm.
│ └── campaign.module.ts # Module declaration
│
├── discount/ # Discount generation module
│ ├── discount.service.ts # Generates unique discount codes
│ └── discount.module.ts # Module declaration
│
├── recommendation/ # Recommendation engine module
│ ├── recommendation.service.ts # Fetch personalized products for users
│ └── recommendation.module.ts # Module declaration
│
├── scheduler/ # Scheduler called every day at 12
│ ├── scheduler.service.ts # Uses cron jobs to check users with upcoming birthdays and gets the detials from campaign and sends to eamil services.
│ └── scheduler.module.ts # Module declaration
│
├── email/ # Email service using mailjet
│ ├── email.service.ts # Handles sending emails
│ └── email.module.ts # Module declaration
├── users/ # Email service using mailjet
│ ├── users.service.ts # Handles user creating and purchase
│ ├── users.module.ts # Module declaration
│ └── users.control.ts # All user related end points
├── app.module.ts # Main app module
└── main.ts # Entry point

How to run the application

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
"bdate": "09-15-1997", // Use a date between today and the next 7 days for scheduling purposes.
"email": "abc@gmail.com" // Must be unique, provide your email to receive the birthday email.
}
Expected Response:
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

3. Add Products to Purchase List
   Once the user is created, you can add products to their purchase history for recommendations.

Endpoint:
POST http://localhost:3000/users/buy/
Body:
{
"userid": 7, // Use the userid from the user creation response
"pname": "grapes", // Product name
"pcode": 3, // Product code must be unique for each product (e.g., 1 for apple, 2 for banana, 3 for grapes)
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
"\_id": "66e760e67a9a0c917f253ffd",
"\_\_v": 0
},
"message": "Product bought",
"status": 201
}

4. Trigger Emails with Cron Jobs
   Set the cron job to run every 30 seconds (modify scheduler.service.ts) and observe the emails being triggered automatically based on upcoming birthdays.

The emails will contain personalized discount codes and product recommendations based on the user's purchase history.

You're All Set!
Once the application is running and the cron job is set up, you should receive personalized birthday emails with recommendations and discount codes within 30 seconds if the user's birthday is within the specified range.
