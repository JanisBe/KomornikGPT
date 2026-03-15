import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {AuthService} from './auth.service';
import {Router} from '@angular/router';
import {map} from 'rxjs/operators';
import {User} from '../models/user.model';


@Injectable({
  providedIn: 'root'
})
export class SocialAuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private readonly oauth2ApiUrl = `${environment.oAuth}`;
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private router = inject(Router);

  constructor() {
    if (window.location.pathname === '/auth/callback') {
      this.handleAuthCallback();
    }
  }

  loginWithGoogle(): void {
    window.location.href = `${this.oauth2ApiUrl}/google`;
  }

  loginWithFacebook(): void {
    window.location.href = `${this.oauth2ApiUrl}/facebook`;
  }

  loginWithGithub(): void {
    window.location.href = `${this.oauth2ApiUrl}/github`;
  }

  private handleAuthCallback(): void {
    console.log("social auth callback");
    // Get user info from backend which will use the HTTP-only cookie
    this.http.get<User>(`${this.apiUrl}/user`, {withCredentials: true}).pipe(
      map(user => {
        if (user.authenticated) {
          // Update current user in the auth service
          this.authService.getCurrentUser().subscribe();
        } else {
          // Handle authentication failure
          this.router.navigate(['/login']);
        }
      })
    ).subscribe();
  }
}
