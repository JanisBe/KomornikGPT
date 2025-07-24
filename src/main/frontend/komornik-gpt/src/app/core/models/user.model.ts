import {Group} from './group.model';

export interface User {
  id: number;
  username: string;
  email: string;
  name: string;
  surname: string;
  role: string;
  authenticated?: boolean;
  expensesPaid?: number[];
  splits?: number[];
  groups?: Group[];
  password?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
}

export interface UpdateUserRequest {
  name: string;
  surname: string;
  email: string;
  currentPassword?: string;
  newPassword?: string;
}

export interface CreateUserRequest {
  name: string;
  surname: string;
  username: string;
  email: string;
}

export interface PendingUser extends CreateUserRequest {
  tempId: string;
}

export interface MemberInput {
  userName: string;
  email: string;
  userId?: string | number;
}

export interface CreatedUserResponse {
  tempId: string;
  createdUser: User;
}

export interface RegisterRequest {
  username: string;
  password: string;
  email: string;
  name: string;
  surname: string;
}
