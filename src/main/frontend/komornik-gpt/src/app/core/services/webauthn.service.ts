import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {User} from '../models/user.model';
import {environment} from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WebAuthnService {
  private readonly apiUrl = `${environment.apiUrl}/webauthn/`;

  constructor(private http: HttpClient) {
  }

  // Rejestracja WebAuthn
  async register(user: User) {
    // 1. Pobierz opcje rejestracji z backendu
    const options = await this.http.post<any>(
      this.apiUrl + 'register/options',
      {username: user.username}
    ).toPromise();

    // 2. Zamień challenge i user.id na Uint8Array
    options.challenge = this.base64urlToUint8Array(options.challenge);
    options.user.id = this.base64urlToUint8Array(options.user.id);

    // 3. Wywołaj WebAuthn API
    const credential: PublicKeyCredential = await navigator.credentials.create({publicKey: options}) as PublicKeyCredential;

    // 4. Zamień credential na JSON (base64url)
    const credentialJSON = this.credentialToJSON(credential);
    credentialJSON.username = user.username;

    // 5. Wyślij credential do backendu
    await this.http.post(this.apiUrl + 'register/', credentialJSON).toPromise();
  }

  // Logowanie WebAuthn
  async authenticate(user: User) {
    // 1. Pobierz opcje logowania z backendu
    const options = await this.http.post<any>(
      this.apiUrl + 'register/options',
      {username: user.username}
    ).toPromise();

    options.challenge = this.base64urlToUint8Array(options.challenge);
    if (options.allowCredentials) {
      options.allowCredentials = options.allowCredentials.map((cred: any) => ({
        ...cred,
        id: this.base64urlToUint8Array(cred.id)
      }));
    }

    // 2. Wywołaj WebAuthn API
    const assertion: PublicKeyCredential = await navigator.credentials.get({publicKey: options}) as PublicKeyCredential;
    const assertionResponse = assertion.response as AuthenticatorAssertionResponse;

    // 3. Zamień assertion na JSON (base64url)
    const assertionJSON = {
      id: assertion.id,
      rawId: this.arrayBufferToBase64url(assertion.rawId),
      type: assertion.type,
      response: {
        clientDataJSON: this.arrayBufferToBase64url(assertionResponse.clientDataJSON),
        authenticatorData: this.arrayBufferToBase64url(assertionResponse.authenticatorData),
        signature: this.arrayBufferToBase64url(assertionResponse.signature),
        userHandle: assertionResponse.userHandle ? this.arrayBufferToBase64url(assertionResponse.userHandle) : null
      },
      username: user.username
    };

    // 4. Wyślij assertion do backendu
    await this.http.post(this.apiUrl + 'authenticate', assertionJSON).toPromise();
  }

  isWebAuthnSupported(): boolean {
    return !!window.PublicKeyCredential;
  }

  // Pomocnicze funkcje:
  private base64urlToUint8Array(base64url: string): Uint8Array {
    const padding = '='.repeat((4 - base64url.length % 4) % 4);
    const base64 = (base64url + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = atob(base64);
    return new Uint8Array([...raw].map(c => c.charCodeAt(0)));
  }

  private arrayBufferToBase64url(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  private credentialToJSON(credential: any): any {
    if (!credential) return null;
    return {
      id: credential.id,
      rawId: this.arrayBufferToBase64url(credential.rawId),
      type: credential.type,
      response: {
        clientDataJSON: this.arrayBufferToBase64url(credential.response.clientDataJSON),
        attestationObject: this.arrayBufferToBase64url(credential.response.attestationObject)
      }
      // Możesz dodać inne pola jeśli backend ich oczekuje
    };
  }
}
