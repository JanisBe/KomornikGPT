import {User} from './user.model';
import {Group} from './group.model';
import {Currency} from './currency.model';

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
  currency: Currency;
  date: Date;
  payer: User;
  group: Group;
  splits: ExpenseSplit[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateExpenseDto {
  description: string;
  amount: number;
  currency: Currency;
  date: string;
  payerId: number;
  groupId: number;
  splits: ExpenseSplitDto[];
}

export interface ExpenseSplitDto {
  userId: number;
  amountOwed: number;
}
