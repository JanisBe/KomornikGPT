import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {MatIconModule} from '@angular/material/icon';
import {HttpClient} from '@angular/common/http';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
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
    <div class="reset-password-container">
      <mat-card class="reset-password-card">
        <mat-card-header>
          <mat-card-title>Resetowanie hasła</mat-card-title>
        </mat-card-header>

        @if (isLoading) {
          <mat-progress-bar mode="indeterminate"></mat-progress-bar>
        }

        <mat-card-content>
          @if (!resetSuccess && !tokenError) {
            <p class="instruction">Wprowadź nowe hasło dla swojego konta.</p>
            <form [formGroup]="resetPasswordForm" (ngSubmit)="onSubmit()">
              <mat-form-field appearance="outline">
                <mat-label>Nowe hasło</mat-label>
                <input matInput type="password" formControlName="password" required>
                @if (resetPasswordForm.get('password')?.errors?.['required'] && (resetPasswordForm.get('password')?.dirty || resetPasswordForm.get('password')?.touched)) {
                  <mat-error>Hasło jest wymagane</mat-error>
                } @else if (resetPasswordForm.get('password')?.errors?.['minlength'] && (resetPasswordForm.get('password')?.dirty || resetPasswordForm.get('password')?.touched)) {
                  <mat-error>Hasło musi mieć co najmniej 6 znaków</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Powtórz hasło</mat-label>
                <input matInput type="password" formControlName="confirmPassword" required>
                @if (resetPasswordForm.get('confirmPassword')?.errors?.['required'] && (resetPasswordForm.get('confirmPassword')?.dirty || resetPasswordForm.get('confirmPassword')?.touched)) {
                  <mat-error>Powtórzenie hasła jest wymagane</mat-error>
                } @else if (resetPasswordForm.errors?.['passwordMismatch'] && (resetPasswordForm.get('confirmPassword')?.dirty || resetPasswordForm.get('confirmPassword')?.touched)) {
                  <mat-error>Hasła nie są identyczne</mat-error>
                }
              </mat-form-field>

              @if (errorMessage) {
                <div class="error-message">{{ errorMessage }}</div>
              }

              <div class="form-actions">
                <button mat-raised-button
                        color="primary"
                        type="submit"
                        [disabled]="resetPasswordForm.invalid || isLoading">
                  Resetuj hasło
                </button>
              </div>
            </form>
          } @else if (resetSuccess) {
            <div class="success-message">
              <mat-icon color="primary">check_circle</mat-icon>
              <p>Twoje hasło zostało pomyślnie zresetowane.</p>
              <button mat-raised-button
                      color="primary"
                      type="button"
                      [routerLink]="['/login']">
                Przejdź do logowania
              </button>
            </div>
          } @else {
            <div class="error-message-container">
              <mat-icon color="warn">error</mat-icon>
              <p>{{ tokenError }}</p>
              <button mat-raised-button
                      color="primary"
                      type="button"
                      [routerLink]="['/forgot-password']">
                Spróbuj ponownie
              </button>
            </div>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .reset-password-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background-color: #f5f5f5;
    }

    .reset-password-card {
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

    .success-message, .error-message-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 24px 0;
    }

    .success-message mat-icon, .error-message-container mat-icon {
      font-size: 48px;
      height: 48px;
      width: 48px;
      margin-bottom: 16px;
    }

    .error-message-container {
      color: #f44336;
    }

    button {
      margin-top: 16px;
    }
  `]
})
export class ResetPasswordComponent implements OnInit {
  resetPasswordForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  resetSuccess = false;
  tokenError = '';
  token = '';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.resetPasswordForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, {validators: this.passwordMatchValidator});
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
      if (!this.token) {
        this.tokenError = 'Nieprawidłowy token resetowania hasła';
      }
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return password === confirmPassword ? null : {passwordMismatch: true};
  }

  onSubmit(): void {
    if (this.resetPasswordForm.valid && this.token) {
      this.isLoading = true;
      this.errorMessage = '';

      const password = this.resetPasswordForm.get('password')?.value;

      this.http.post(`/api/reset-password?token=${this.token}`, {password})
        .subscribe({
          next: () => {
            this.isLoading = false;
            this.resetSuccess = true;
          },
          error: (error) => {
            this.isLoading = false;
            console.error(error);

            if (error.status === 404) {
              this.tokenError = 'Token resetowania hasła nie został znaleziony';
            } else if (error.status === 400) {
              this.tokenError = 'Token resetowania hasła wygasł';
            } else {
              this.errorMessage = 'Wystąpił błąd podczas resetowania hasła. Spróbuj ponownie.';
            }

            this.snackBar.open(this.errorMessage || this.tokenError, 'Zamknij', {
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
