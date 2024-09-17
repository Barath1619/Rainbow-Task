import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

@Injectable()
export class DiscountsService {
  async generateDiscountCode(userId: string): Promise<string> {
    return `DISCOUNT${randomUUID()}${userId}`;
  }
}
