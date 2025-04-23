import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {AuthService} from './auth.service';
import {Router} from '@angular/router';

// Add type declarations for external SDKs
declare global {
  interface Window {
    google: any;
    FB: any;
  }
}

export interface SocialAuthResponse {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

interface FacebookAuthResponse {
  authResponse: {
    accessToken: string;
    userID: string;
    expiresIn: string;
    signedRequest: string;
    graphDomain: string;
    data_access_expiration_time: number;
  };
  status: string;
}

interface GoogleTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

@Injectable({
  providedIn: 'root'
})
export class SocialAuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private readonly oauth2ApiUrl = `${environment.oAuth}`;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router
  ) {
    // Check for token in URL parameters after OAuth2 redirect
    this.checkForTokenInUrl();
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

  private checkForTokenInUrl(): void {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (token) {
      // Store the token
      localStorage.setItem('token', token);

      // Remove token from URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);

      // Navigate to the groups page
      this.router.navigate(['/groups']);
    }
  }
}
