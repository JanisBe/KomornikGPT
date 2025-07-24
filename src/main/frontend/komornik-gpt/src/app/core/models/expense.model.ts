import {User} from './user.model';
import {Group} from './group.model';
import {Currency} from './currency.model';
import {ExpenseCategory} from './expense-category.model';

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
  isPaid?: boolean;
  category?: ExpenseCategory;
}

export interface CreateExpenseDto {
  description: string;
  amount: number;
  currency: Currency;
  date: string;
  payerId: number;
  groupId: number;
  splits: ExpenseSplitDto[];
  category?: {
    mainCategory: string;
    subCategory: string;
  };
}

export interface ExpenseSplitDto {
  userId: number;
  amountOwed: number;
}

export interface SettlementDto {
  from: string;
  to: string;
  amount: number;
  currency: string;
}
