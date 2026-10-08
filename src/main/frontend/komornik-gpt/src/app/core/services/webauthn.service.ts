import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {firstValueFrom, Observable} from 'rxjs';
import {
  browserSupportsWebAuthn,
  platformAuthenticatorIsAvailable,
  startAuthentication,
  startRegistration
} from '@simplewebauthn/browser';
import {WebAuthnCredentialDto} from '../models/webauthn.model';
import {AuthService} from './auth.service';
import {User} from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class WebAuthnService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  private readonly promptDismissedPrefix = 'komornik_passkey_prompt_dismissed_';
  private readonly enrolledPrefix = 'komornik_passkey_enrolled_';

  isSupported(): boolean {
    return browserSupportsWebAuthn();
  }

  async isPlatformAuthenticatorAvailable(): Promise<boolean> {
    if (!this.isSupported()) {
      return false;
    }
    try {
      return await platformAuthenticatorIsAvailable();
    } catch {
      return false;
    }
  }

  getCredentials(): Observable<WebAuthnCredentialDto[]> {
    return this.http.get<WebAuthnCredentialDto[]>('/api/auth/webauthn/credentials', {
      withCredentials: true
    });
  }

  deleteCredential(id: number): Observable<void> {
    return this.http.delete<void>(`/api/auth/webauthn/credentials/${id}`, {
      withCredentials: true
    });
  }

  async registerCurrentDevice(customLabel?: string): Promise<void> {
    const options = await firstValueFrom(
      this.http.post<any>('/webauthn/register/options', {}, {withCredentials: true})
    );

    const registrationResponse = await startRegistration({optionsJSON: options});

    const label = customLabel?.trim() || this.getDefaultDeviceLabel();

    await firstValueFrom(
      this.http.post<any>(
        '/webauthn/register',
        {
          publicKey: {
            credential: registrationResponse,
            label
          }
        },
        {withCredentials: true}
      )
    );

    const currentUser = this.authService.getLoggedUser();
    if (currentUser?.id) {
      this.markEnrolled(currentUser.id);
    }
  }

  async loginWithPasskey(): Promise<User> {
    const options = await firstValueFrom(
      this.http.post<any>('/webauthn/authenticate/options', {}, {withCredentials: true})
    );

    const authenticationResponse = await startAuthentication({optionsJSON: options});

    const userResponse = await firstValueFrom(
      this.http.post<User>('/login/webauthn', authenticationResponse, {withCredentials: true})
    );

    if (userResponse) {
      this.authService.setCurrentUser(userResponse);
      if (userResponse.id) {
        this.markEnrolled(userResponse.id);
      }
    }

    return userResponse;
  }

  getDefaultDeviceLabel(): string {
    if (typeof navigator === 'undefined') {
      return 'Urządzenie';
    }
    const ua = navigator.userAgent;
    if (/android/i.test(ua)) return 'Telefon Android';
    if (/iphone/i.test(ua)) return 'iPhone';
    if (/ipad/i.test(ua)) return 'iPad';
    if (/macintosh|mac os x/i.test(ua)) return 'Mac';
    if (/windows/i.test(ua)) return 'Windows';
    if (/linux/i.test(ua)) return 'Linux';
    return 'Moje urządzenie';
  }

  isPromptDismissed(userId: number): boolean {
    if (typeof localStorage === 'undefined') return false;
    return localStorage.getItem(`${this.promptDismissedPrefix}${userId}`) === 'true';
  }

  dismissPrompt(userId: number): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(`${this.promptDismissedPrefix}${userId}`, 'true');
    }
  }

  markEnrolled(userId: number): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(`${this.enrolledPrefix}${userId}`, 'true');
    }
  }

  isEnrolled(userId: number): boolean {
    if (typeof localStorage === 'undefined') return false;
    return localStorage.getItem(`${this.enrolledPrefix}${userId}`) === 'true';
  }
}
