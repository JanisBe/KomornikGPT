import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {AuthService} from './auth.service';

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

  // Replace these with your actual client IDs
  private readonly googleClientId = 'YOUR_GOOGLE_CLIENT_ID';
  private readonly facebookAppId = 'YOUR_FACEBOOK_APP_ID';
  private readonly githubClientId = 'YOUR_GITHUB_CLIENT_ID';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    // Initialize Google Sign-In
    this.loadGoogleScript();
    // Initialize Facebook SDK
    this.loadFacebookSDK();
  }

  loginWithGoogle(): Promise<void> {
    return new Promise((resolve, reject) => {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: this.googleClientId,
        scope: 'email profile',
        callback: (response: GoogleTokenResponse) => {
          if (response.access_token) {
            this.verifyGoogleToken(response.access_token)
              .subscribe({
                next: (authResponse) => {
                  this.handleLoginSuccess(authResponse);
                  resolve();
                },
                error: (error) => reject(error)
              });
          } else {
            reject('Google login failed');
          }
        },
      });
      client.requestAccessToken();
    });
  }

  loginWithFacebook(): Promise<void> {
    return new Promise((resolve, reject) => {
      window.FB.login((response: FacebookAuthResponse) => {
        if (response.authResponse) {
          this.verifyFacebookToken(response.authResponse.accessToken)
            .subscribe({
              next: (authResponse) => {
                this.handleLoginSuccess(authResponse);
                resolve();
              },
              error: (error) => reject(error)
            });
        } else {
          reject('Facebook login failed');
        }
      }, {scope: 'email,public_profile'});
    });
  }

  loginWithGithub(): Promise<void> {
    return new Promise((resolve, reject) => {
      const redirectUri = `${window.location.origin}/auth/github/callback`;
      const scope = 'user:email';
      const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${this.githubClientId}&redirect_uri=${redirectUri}&scope=${scope}`;

      window.location.href = githubAuthUrl;
    });
  }

  private loadGoogleScript(): void {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    document.head.appendChild(script);
  }

  private loadFacebookSDK(): void {
    const script = document.createElement('script');
    script.innerHTML = `
      window.fbAsyncInit = function() {
        FB.init({
          appId: '${this.facebookAppId}',
          cookie: true,
          xfbml: true,
          version: 'v18.0'
        });
      };
    `;
    document.head.appendChild(script);

    const fbScript = document.createElement('script');
    fbScript.src = 'https://connect.facebook.net/en_US/sdk.js';
    fbScript.async = true;
    fbScript.defer = true;
    fbScript.crossOrigin = 'anonymous';
    document.head.appendChild(fbScript);
  }

  private handleLoginSuccess(authResponse: SocialAuthResponse): void {
    localStorage.setItem('token', authResponse.token);
    localStorage.setItem('user', JSON.stringify(authResponse.user));
  }

  private verifyGoogleToken(token: string): Observable<SocialAuthResponse> {
    return this.http.post<SocialAuthResponse>(`${this.apiUrl}/google`, {token});
  }

  private verifyFacebookToken(token: string): Observable<SocialAuthResponse> {
    return this.http.post<SocialAuthResponse>(`${this.apiUrl}/facebook`, {token});
  }

  private verifyGithubToken(code: string): Observable<SocialAuthResponse> {
    return this.http.post<SocialAuthResponse>(`${this.apiUrl}/github`, {code});
  }
}
