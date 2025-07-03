import {User} from './user.model';
import {Expense} from './expense.model';
import {Currency} from './currency.model';

export interface Group {
  id: number;
  name: string;
  description?: string;
  members: User[];
  expenses?: Expense[];
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: User;
  isPublic?: boolean;
  defaultCurrency?: Currency;
}

export interface GroupExpenses {
  group: Group;
  expenses: Expense[];
}

export interface CreateGroupRequest {
  name: string;
  description?: string;
  isPublic: boolean;
  defaultCurrency: Currency;
  members: { userId?: number; userName: string; email?: string }[];
  sendInvitationEmail: boolean;
}