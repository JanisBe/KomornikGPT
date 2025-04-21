export interface User {
  id: number;
  username: string;
  email: string;
  name: string;
  surname: string;
  role: string;
  expensesPaid?: any[];
  splits?: any[];
  groups?: any[];
  password?: string;
} 