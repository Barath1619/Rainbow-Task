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

    request
      .then((result: { body: any }) => {
        console.log(result.body);
      })
      .catch((err: { statusCode: number }) => {
        console.log(err.statusCode);
      });
  }
}
