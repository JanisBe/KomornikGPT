import {User} from './user.model';
import {Expense} from './expense.model';

export interface Group {
  id: number;
  name: string;
  members: User[];
  expenses?: Expense[];
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: User;
}
