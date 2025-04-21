import {Group} from './group.model';

export interface User {
  id: number;
  username: string;
  email: string;
  name: string;
  surname: string;
  role: string;
  expensesPaid?: number[];
  splits?: number[];
  groups?: Group[];
  password?: string;
}
