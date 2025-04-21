import {User} from './user.model';

export interface Split {
  id?: number;
  amount: number;
  user: User;
  expenseId: number;
  isPaid: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
