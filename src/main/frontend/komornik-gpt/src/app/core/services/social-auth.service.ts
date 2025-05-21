import {Injectable, OnInit} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {AuthService} from './auth.service';
import {Router} from '@angular/router';
import {map} from 'rxjs/operators';

// Add type declarations for external SDKs
declare global {
  interface Window {
    google: any;
    FB: any;
  }
}

@Injectable({
  providedIn: 'root'
})
export class SocialAuthService implements OnInit {
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private readonly oauth2ApiUrl = `${environment.oAuth}`;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router
  ) {

  }

  ngOnInit(): void {
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
    this.http.get<any>(`${this.apiUrl}/user`, {withCredentials: true}).pipe(
      map(response => {
        if (response.authenticated) {
          // Update current user in the auth service
          this.authService.getCurrentUser().subscribe(() => {
            // Navigate to groups page on success
            this.router.navigate(['/groups']);
          });
        } else {
          // Handle authentication failure
          this.router.navigate(['/login']);
        }
      })
    ).subscribe();
  }
}
