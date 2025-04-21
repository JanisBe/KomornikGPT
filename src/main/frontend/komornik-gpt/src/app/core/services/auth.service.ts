import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BehaviorSubject, Observable, tap} from 'rxjs';
import {Router} from '@angular/router';
import {TokenService} from './token.service';
import {User} from '../models/user.model';
import {environment} from '../../../environments/environment';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface UpdateUserRequest {
  name: string;
  surname: string;
  email: string;
  currentPassword?: string;
  newPassword?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    private tokenService: TokenService
  ) {
    // Check if user is already logged in
    const token = this.tokenService.getToken();

    if (token) {
      this.getCurrentUser().subscribe({
        next: (user) => {
          this.router.navigate(['/groups']);
        },
        error: (error) => {
          console.error('Error loading user:', error);
          this.logout();
        }
      });
    }

    // Try to load user from localStorage on service initialization
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      this.currentUserSubject.next(JSON.parse(storedUser));
    }
  }

  login(request: LoginRequest): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/auth/login`, request)
      .pipe(
        tap(user => {
          localStorage.setItem('currentUser', JSON.stringify(user));
          this.currentUserSubject.next(user);
        })
      );
  }

  logout(): void {
    this.tokenService.removeToken();
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/me`);
  }

  updateProfile(request: UpdateUserRequest): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/users/me`, request)
      .pipe(
        tap(user => {
          // Update stored user data
          const currentUser = this.currentUserSubject.value;
          if (currentUser) {
            const updatedUser = {
              ...currentUser,
              ...user,
              expensesPaid: user.expensesPaid || [],
              splits: user.splits || [],
              groups: user.groups || []
            };
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
            this.currentUserSubject.next(updatedUser);
          }
        })
      );
  }

  isAuthenticated(): boolean {
    return this.tokenService.hasToken();
  }
}
