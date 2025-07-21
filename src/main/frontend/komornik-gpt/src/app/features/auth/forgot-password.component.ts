import {Component} from '@angular/core';

import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router, RouterModule} from '@angular/router';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {MatIconModule} from '@angular/material/icon';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {PasswordService} from '../../core/services/password.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatCardModule,
    MatProgressBarModule,
    MatIconModule
  ],
  template: `
    <div class="forgot-password-container">
      <mat-card class="forgot-password-card">
        <mat-card-header>
          <mat-card-title>Przypomnij hasło</mat-card-title>
        </mat-card-header>

        @if (isLoading) {
          <mat-progress-bar mode="indeterminate"></mat-progress-bar>
        }

        <mat-card-content>
          @if (!emailSent) {
            <p class="instruction">Podaj adres email, na który zostanie wysłany link do resetowania hasła.</p>
            <form [formGroup]="forgotPasswordForm" (ngSubmit)="onSubmit()">
              <mat-form-field appearance="outline">
                <mat-label>Email</mat-label>
                <input matInput type="email" formControlName="email" required>
                @if (forgotPasswordForm.get('email')?.errors?.['required'] && (forgotPasswordForm.get('email')?.dirty || forgotPasswordForm.get('email')?.touched)) {
                  <mat-error>Email jest wymagany</mat-error>
                } @else if (forgotPasswordForm.get('email')?.errors?.['email'] && (forgotPasswordForm.get('email')?.dirty || forgotPasswordForm.get('email')?.touched)) {
                  <mat-error>Email jest niepoprawny</mat-error>
                }
              </mat-form-field>

              @if (errorMessage) {
                <div class="error-message">{{ errorMessage }}</div>
              }

              <div class="form-actions">
                <button mat-raised-button
                        color="primary"
                        type="submit"
                        [disabled]="forgotPasswordForm.invalid || isLoading">
                  Wyślij link resetujący
                </button>
                <button mat-button
                        type="button"
                        [routerLink]="['/login']">
                  Powrót do logowania
                </button>
              </div>
            </form>
          } @else {
            <div class="success-message">
              <mat-icon color="primary">check_circle</mat-icon>
              <p>Link do resetowania hasła został wysłany na podany adres email.</p>
              <button mat-button
                      type="button"
                      [routerLink]="['/login']">
                Powrót do logowania
              </button>
            </div>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .forgot-password-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background-color: #f5f5f5;
    }

    .forgot-password-card {
      width: 100%;
      max-width: 400px;
      padding: 20px;
    }

    mat-form-field {
      width: 100%;
      margin-bottom: 16px;
    }

    .form-actions {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 16px;
    }

    .error-message {
      color: #f44336;
      margin-bottom: 16px;
    }

    .instruction {
      margin-bottom: 24px;
      color: rgba(0, 0, 0, 0.6);
    }

    .success-message {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 24px 0;
    }

    .success-message mat-icon {
      font-size: 48px;
      height: 48px;
      width: 48px;
      margin-bottom: 16px;
    }
  `]
})
export class ForgotPasswordComponent {
  forgotPasswordForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  emailSent = false;
  private readonly apiUrl = `${environment.apiUrl}/`;
  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private snackBar: MatSnackBar,
    private passwordService: PasswordService
  ) {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
    if (this.forgotPasswordForm.valid) {
      const email = this.forgotPasswordForm.get('email')?.value;
      this.isLoading = true;
      this.errorMessage = '';

      this.passwordService.forgotPassword(email)
        .subscribe({
          next: () => {
            this.isLoading = false;
            this.emailSent = true;
          },
          error: (error) => {
            this.isLoading = false;
            console.error(error);

            if (error.status === 404) {
              this.errorMessage = 'Nie znaleziono użytkownika z podanym adresem email';
            } else {
              this.errorMessage = 'Wystąpił błąd podczas wysyłania linku resetującego. Spróbuj ponownie.';
            }

            this.snackBar.open(this.errorMessage, 'Zamknij', {
              duration: 5000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['error-snackbar']
            });
          }
        });
    }
  }
}
