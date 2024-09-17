import { PurchaseHistory, Users } from 'src/schemas/user.schema';

export interface UserResponse {
  data: Users | Users[] | PurchaseHistory | PurchaseHistory[];
  message: string;
  status: number;
}
