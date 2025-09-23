import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BehaviorSubject, catchError, filter, Observable, of, shareReplay, take, tap} from 'rxjs';
import {Router} from '@angular/router';
import {LoginRequest, LoginResponse, UpdateUserRequest, User} from '../models/user.model';
import {environment} from '../../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = environment.apiUrl;
  private readonly serverUrl = environment.serverUrl;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public user$ = this.currentUserSubject.asObservable();
  private authCheckInProgress: Observable<User> | null = null;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.checkAuthStatus();
  }

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, request, {withCredentials: true})
      .pipe(
        tap(response => {
          this.currentUserSubject.next(response.user);
        })
      );
  }

  logout(): void {
    this.http.post(`${this.serverUrl}/logout`, {}, {
      withCredentials: true
    })
      .subscribe({
        next: () => {
          this.clearAuthState();
          this.router.navigate(['/login']);
        },
        error: () => {
          // Even if there's an error, clear the auth state and redirect
          this.clearAuthState();
          this.router.navigate(['/login']);
        }
      });
  }

  getCurrentUser(): Observable<User> {
    // If there's already a check in progress, return that
    if (this.authCheckInProgress) {
      return this.authCheckInProgress;
    }
    if (!!this.currentUserSubject.value) {
      return this.currentUserSubject.asObservable().pipe(
        filter((user): user is User => user !== null),
        take(1)
      );
    }
    // Start a new check
    this.authCheckInProgress = this.http.get<User>(`${this.apiUrl}/auth/user`, {withCredentials: true})
      .pipe(
        tap({
          next: (user: any) => {
            if (user && user.authenticated) {
              this.currentUserSubject.next(user);
            } else {
              this.currentUserSubject.next(null);
            }
          },
          error: () => {
            this.currentUserSubject.next(null);
          },
          complete: () => {
            this.authCheckInProgress = null;
          }
        }),
        shareReplay(1)
      );

    return this.authCheckInProgress;
  }

  getCurrentUserOrNull(): Observable<User | null> {
    return this.http.get<User>(`${this.apiUrl}/auth/user`, {withCredentials: true})
      .pipe(
        tap((user: any) => {
          if (user && user.authenticated) {
            this.currentUserSubject.next(user);
          } else {
            this.currentUserSubject.next(null);
          }
        }),
        catchError(() => {
          this.currentUserSubject.next(null);
          return of(null);
        })
      );
  }

  updateProfile(request: UpdateUserRequest): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/users/me`, request, {withCredentials: true})
      .pipe(
        tap(user => {
          const currentUser = this.currentUserSubject.value;
          if (currentUser) {
            const updatedUser = {
              ...currentUser,
              ...user,
              expensesPaid: user.expensesPaid || [],
              splits: user.splits || [],
              groups: user.groups || []
            };
            this.currentUserSubject.next(updatedUser);
          }
        })
      );
  }

  isAuthenticated(): boolean {
    return !!this.currentUserSubject.value;
  }

  clearAuthState(): void {
    this.currentUserSubject.next(null);
  }

  getLoggedUser() {
    return this.currentUserSubject.value;
  }

  private checkAuthStatus(): void {
    // Don't check auth status if user has token in URL - let them access public content
    if (this.hasTokenInUrl()) {
      this.currentUserSubject.next(null);
      return;
    }

    this.getCurrentUser().subscribe({
      next: (response: any) => {
        if (response.authenticated) {
          this.currentUserSubject.next(response);
          // Only navigate if we're on the login page
          if (this.router.url === '/login') {
            this.router.navigate(['/groups']);
          }
        } else {
          this.currentUserSubject.next(null);
        }
      },
      error: () => {
        this.currentUserSubject.next(null);
      }
    });
  }

  private hasTokenInUrl(): boolean {
    // Use window.location.href as router.url might not be available in constructor
    return window.location.href.includes('token=');
  }
}
