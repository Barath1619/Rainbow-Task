import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { promises } from 'dns';
import { Model } from 'mongoose';
import { Message } from 'node-mailjet';
import { BuyProductDto } from 'src/dto/buy-product.dto';
import { CreateUserDto } from 'src/dto/create-user.dto';
import { SignInDto } from 'src/dto/sign-in.dto';
import { UserResponse } from 'src/interface/UserResponse.interface';
import { PurchaseHistory, Users } from 'src/schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(Users.name) private userModel: Model<Users>,
    @InjectModel(PurchaseHistory.name)
    private purchaseHistoryModel: Model<PurchaseHistory>,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<UserResponse> {
    const userCount = await this.userModel.countDocuments();
    const newUser = new this.userModel({
      userid: userCount + 1,
      ...createUserDto,
    });
    try {
      await newUser.save();
      return { data: newUser, message: 'User added', status: 201 };
    } catch (error) {
      console.error('Error details:', error);
      if (error.code === 11000) {
        // Duplicate key error (e.g., email already exists)
        throw new ConflictException('Email already exists.');
      } else if (error.name === 'ValidationError') {
        // Validation error
        throw new BadRequestException('Validation failed');
      } else {
        throw new InternalServerErrorException('Failed to create user.');
      }
    }
  }

  async getAllUsers(): Promise<UserResponse> {
    try {
      const data = await this.userModel.find().exec();
      return {
        data,
        message: 'Users fetched',
        status: 200,
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to get all user.');
    }
  }

  async buyProduct(buyProduct: BuyProductDto): Promise<UserResponse> {
    const purchaseHistoryCount =
      await this.purchaseHistoryModel.countDocuments();
    const newPurchase = new this.purchaseHistoryModel({
      orderid: purchaseHistoryCount + 1,
      ...buyProduct,
    });
    try {
      await newPurchase.save();

      const user = await this.userModel.findOne({ userid: newPurchase.userid });
      if (!user) {
        throw new NotFoundException('User not found');
      }
      user.purchaseHistory.push(newPurchase);
      await user.save();
      return { data: newPurchase, message: 'Product bought', status: 201 };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Failed to purchase Product.');
    }
  }

  async getAllPurchases(): Promise<UserResponse> {
    try {
      const data = await this.purchaseHistoryModel.find().exec();
      return {
        data,
        message: 'Purchase History fetched',
        status: 200,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to fetch all purchase history.',
      );
    }
  }

  async signin(signin: SignInDto): Promise<UserResponse> {
    try {
      const user = await this.userModel.find({ email: signin.email }).exec();
      if (!user) {
        throw new NotFoundException('User not found');
      }

      return {
        data: [],
        message: 'Purchase History fetched',
        status: 200,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to fetch all purchase history.',
      );
    }
  }
}
