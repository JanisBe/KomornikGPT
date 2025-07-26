import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {CreateUserRequest, RegisterRequest, User} from '../models/user.model';
import {AuthService} from './auth.service';
import {map} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient, private authService: AuthService) {
  }

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  findUsersFriends(id: number): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/${id}/friends`);
  }

  getUser(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/me`);
  }

  createUser(user: CreateUserRequest): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/create-without-password`, user);
  }

  updateUser(id: number, user: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${id}`, user);
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

  checkUsernameExists(username: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/check/username?username=${username}`);
  }

  checkEmailExists(email: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/check/email?email=${email}`);
  }

  registerUser(user: RegisterRequest): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/register`, user);
  }
}
