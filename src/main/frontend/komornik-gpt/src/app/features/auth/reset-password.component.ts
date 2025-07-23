import {Component, inject, OnInit} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import {MatSnackBar, MatSnackBarModule} from '@angular/material/snack-bar';
import {CommonModule} from '@angular/common';
import {MatCardModule} from '@angular/material/card';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {PasswordService} from '../../core/services/password.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatIconModule
  ],
  template: `
    <div class="reset-password-container">
      <mat-card class="reset-password-card">
        <mat-card-header>
          <mat-card-title>Ustaw nowe hasło</mat-card-title>
        </mat-card-header>

        @if (isLoading) {
          <mat-progress-bar mode="indeterminate"></mat-progress-bar>
        }

        <mat-card-content>
          <form [formGroup]="resetPasswordForm" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline">
              <mat-label>Nowe hasło</mat-label>
              <input matInput [type]="hide ? 'password' : 'text'" formControlName="password" required>
              <button mat-icon-button matSuffix (click)="hide = !hide" type="button">
                <mat-icon>{{ hide ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              @if (resetPasswordForm.get('password')?.errors?.['required'] && resetPasswordForm.get('password')?.touched) {
                <mat-error>Hasło jest wymagane</mat-error>
              }
              @if (resetPasswordForm.get('password')?.errors?.['minlength'] && resetPasswordForm.get('password')?.touched) {
                <mat-error>Hasło musi mieć przynajmniej 4 znaki</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Potwierdź hasło</mat-label>
              <input matInput [type]="hideConfirm ? 'password' : 'text'" formControlName="confirmPassword" required>
              <button mat-icon-button matSuffix (click)="hideConfirm = !hideConfirm" type="button">
                <mat-icon>{{ hideConfirm ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              @if (resetPasswordForm.get('confirmPassword')?.errors?.['required'] && resetPasswordForm.get('confirmPassword')?.touched) {
                <mat-error>Potwierdzenie hasła jest wymagane</mat-error>
              }
              @if (resetPasswordForm.errors?.['passwordsMismatch'] && resetPasswordForm.get('confirmPassword')?.touched) {
                <mat-error>Hasła nie są identyczne</mat-error>
              }
            </mat-form-field>

            @if (errorMessage) {
              <div class="error-message">{{ errorMessage }}</div>
            }

            <div class="form-actions">
              <button mat-raised-button color="primary" type="submit"
                      [disabled]="resetPasswordForm.invalid || isLoading || !this.token">
                Ustaw hasło
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .reset-password-container {
      display: flex;
      justify-content: center;
      align-items: start;
      min-height: 100vh;
      padding: 20px;
      background-color: white;
    }

    .reset-password-card {
      width: 100%;
      max-width: 400px;
    }

    mat-card-header {
      justify-content: center;
      margin-bottom: 20px;
    }

    mat-form-field {
      width: 100%;
      display: block;
      margin-bottom: 16px;
    }

    .form-actions {
      display: flex;
      justify-content: center;
      margin-top: 24px;
    }

    .error-message {
      color: #f44336;
      text-align: center;
      margin-bottom: 1rem;
    }
  `]
})
export class ResetPasswordComponent implements OnInit {
  resetPasswordForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  hide = true;
  hideConfirm = true;
  token = '';
  private fb = inject(FormBuilder);
  private passwordService = inject(PasswordService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);

  ngOnInit(): void {
    this.resetPasswordForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(4)]],
      confirmPassword: ['', Validators.required]
    }, {validators: this.passwordsMatchValidator});

    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
      if (!this.token) {
        this.errorMessage = 'Brak tokenu resetującego hasło.';
      }
    });
  }

  passwordsMatchValidator(form: AbstractControl): ValidationErrors | null {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return password === confirmPassword ? null : {passwordsMismatch: true};
  }

  onSubmit(): void {
    if (this.resetPasswordForm.valid && this.token) {
      this.isLoading = true;
      this.errorMessage = '';
      const password = this.resetPasswordForm.get('password')?.value;

      this.passwordService.resetPassword(this.token, password).subscribe({
        next: () => {
          this.isLoading = false;
          this.snackBar.open('Hasło zostało zresetowane pomyślnie.', 'Zamknij', {duration: 3000});
          this.router.navigate(['/login']);
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = 'Wystąpił błąd podczas resetowania hasła. Spróbuj ponownie.';
          console.error(err);
        }
      });
    }
  }
}
