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
  viewToken?: string;
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

export interface UpdateGroupRequest {
  name?: string;
  description?: string;
  isPublic?: boolean;
  members: {
    userId?: number;
    userName: string;
    email: string;
  }[];
}

export interface CreateGroupRequest {
  name: string;
  members: {
    userId?: number;
    userName: string;
    email?: string;
  }[];
}

export interface GroupResponse {
  id: number;
  name: string;
  users: {
    id: number;
    username: string;
    email: string;
    name: string;
    surname: string;
    role: string;
  }[];
  expenses?: Expense[];
  createdAt?: string;
  updatedAt?: string;
  createdBy?: {
    id: number;
    username: string;
    email: string;
    name: string;
    surname: string;
    role: string;
  };
}
