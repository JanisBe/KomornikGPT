import {User} from './user.model';
import {Group} from './group.model';

export interface ExpenseSplit {
  id: number;
  user: User;
  amountOwed: number;
  isPaid: boolean;
}

export interface Expense {
  id: number;
  description: string;
  amount: number;
  date: Date;
  payer: User;
  group: Group;
  splits: ExpenseSplit[];
  createdAt?: Date;
  updatedAt?: Date;
}
