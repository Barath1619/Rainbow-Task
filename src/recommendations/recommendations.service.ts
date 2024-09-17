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
      //image: p.details.image,      //Ideally this the field but because i dont have not added image in my DB, I have encoded image url.
      productid: p.details._id.toString(),
      image:
        'https://www.healthyeating.org/images/default-source/home-0.0/nutrition-topics-2.0/general-nutrition-wellness/2-2-2-2foodgroups_vegetables_detailfeature.jpg?sfvrsn=226f1bc7_6',
    }));
  }
}
