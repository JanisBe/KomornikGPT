import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PasswordService {
  private readonly apiUrl = `${environment.apiUrl}/pwd`;

  constructor(private http: HttpClient) {
  }

  forgotPassword(email: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/forgot-password`, {email});
  }

  resetPassword(token: string, password: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/reset-password`, {token, password});
  }

  setPassword(newPassword: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/set-password`, {password: newPassword});
  }

  setPasswordWithToken(newPassword: string, token: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/set-password-with-token?token=${token}`, {password: newPassword});
  }
}
