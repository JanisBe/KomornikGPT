import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {User} from '../models/user.model';
import {RegisterRequest} from '../../features/auth/register.component';

export interface CreateUserRequest {
  name: string;
  surname: string;
  username: string;
  email: string;
}

export interface UpdateUserRequest {
  name?: string;
  surname?: string;
  email?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PasswordService {
  private readonly apiUrl = `${environment.apiUrl}/pwd`;

  constructor(private http: HttpClient) {
  }

  registerUser(user: RegisterRequest): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/register`, user);
  }

  forgotPassword(email: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/forgot-password`, {email});
  }

  resetPassword(token: string, password: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/reset-password`, {token, password});
  }
}
