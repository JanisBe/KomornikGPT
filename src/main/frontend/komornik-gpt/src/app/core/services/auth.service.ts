import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BehaviorSubject, Observable, tap} from 'rxjs';
import {Router} from '@angular/router';
import {TokenService} from './token.service';
import {User} from '../models/user.model';

export interface LoginRequest {
  username: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
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
  }

  login(credentials: LoginRequest): Observable<{ token: string }> {
    return this.http.post<{ token: string }>('/api/auth/login', credentials)
      .pipe(
        tap(response => {
          this.tokenService.setToken(response.token);
          this.getCurrentUser().subscribe();
        })
      );
  }

  logout(): void {
    this.tokenService.removeToken();
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getCurrentUser(): Observable<User> {
    return this.http.get<User>('/api/users/me')
      .pipe(
        tap(user => {
          this.currentUserSubject.next(user);
        })
      );
  }

  isAuthenticated(): boolean {
    const hasToken = this.tokenService.hasToken();
    return hasToken;
  }
}
