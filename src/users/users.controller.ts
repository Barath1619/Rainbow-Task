import { Body, Controller, Get, Post } from '@nestjs/common';
import { CreateUserDto } from 'src/dto/create-user.dto';
import { UsersService } from './users.service';
import { BuyProductDto } from 'src/dto/buy-product.dto';
import { UserResponse } from 'src/interface/UserResponse.interface';
import { SignInDto } from 'src/dto/sign-in.dto';

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

  @Post('signin')
  async signin(@Body() signin: SignInDto): Promise<UserResponse> {
    return this.usersService.signin(signin);
  }
}
