import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {User} from '../models/user.model';
import {AuthService} from './auth.service';
import {map} from 'rxjs/operators';

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
export class UserService {
  private apiUrl = '/api/users';

  constructor(private http: HttpClient, private authService: AuthService) {
  }

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  getUser(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/me`);
  }

  createUser(request: CreateUserRequest): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/create-without-password`, request);
  }

  updateUser(id: number, request: UpdateUserRequest): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${id}`, request);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  isAdmin(user: User): boolean {
    return user && user.role === 'ADMIN';
  }

  canModifyUser(targetUser: User): Observable<boolean> {
    return this.authService.getCurrentUser().pipe(
      map(currentUser => currentUser && (this.isAdmin(currentUser) || currentUser.id === targetUser.id))
    );
  }
}
