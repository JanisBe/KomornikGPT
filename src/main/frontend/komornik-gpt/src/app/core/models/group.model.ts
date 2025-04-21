import {User} from './user.model';

export interface Group {
  id: number;
  name: string;
  users: User[];
  createdBy: User;
  createdAt: string;
  expenses?: any[];
}
