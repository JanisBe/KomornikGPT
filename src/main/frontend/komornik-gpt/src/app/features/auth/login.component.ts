import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Router, RouterModule} from '@angular/router';
import {AuthService, LoginRequest} from '../../core/services/auth.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatProgressBarModule} from '@angular/material/progress-bar';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatCardModule,
    MatProgressBarModule
  ],
  template: `
    <div class="login-container">
      <mat-card class="login-card">
        <mat-card-header>
          <mat-card-title>Login</mat-card-title>
        </mat-card-header>

        <mat-card-content>
          <form (ngSubmit)="onSubmit()" #loginForm="ngForm">
            <mat-progress-bar *ngIf="isLoading" mode="indeterminate"></mat-progress-bar>

            <div class="form-field">
              <mat-form-field appearance="outline">
                <mat-label>Username</mat-label>
                <input matInput
                       type="text"
                       [(ngModel)]="credentials.username"
                       name="username"
                       required
                       #username="ngModel">
                <mat-error *ngIf="username.invalid && (username.dirty || username.touched)">
                  Username is required
                </mat-error>
              </mat-form-field>
            </div>

            <div class="form-field">
              <mat-form-field appearance="outline">
                <mat-label>Password</mat-label>
                <input matInput
                       type="password"
                       [(ngModel)]="credentials.password"
                       name="password"
                       required
                       #password="ngModel">
                <mat-error *ngIf="password.invalid && (password.dirty || password.touched)">
                  Password is required
                </mat-error>
              </mat-form-field>
            </div>

            <div class="error-message" *ngIf="errorMessage">
              {{ errorMessage }}
            </div>

            <div class="form-actions">
              <button mat-raised-button
                      color="primary"
                      type="submit"
                      [disabled]="loginForm.invalid || isLoading">
                {{ isLoading ? 'Logging in...' : 'Login' }}
              </button>
            </div>
          </form>
        </mat-card-content>

        <mat-card-actions>
          <div class="register-link">
            Don't have an account? <a mat-button color="primary" routerLink="/register">Register</a>
          </div>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
      background-color: #f5f5f5;
    }

    .login-card {
      width: 100%;
      max-width: 400px;
    }

    mat-card-header {
      justify-content: center;
      margin-bottom: 20px;
    }

    mat-card-title {
      font-size: 24px;
      margin: 0;
    }

    .form-field {
      margin-bottom: 16px;
    }

    mat-form-field {
      width: 100%;
    }

    .form-actions {
      display: flex;
      justify-content: center;
      margin-top: 24px;
    }

    .form-actions button {
      width: 100%;
      padding: 8px;
    }

    .register-link {
      text-align: center;
      margin: 16px 0;
      width: 100%;
    }

    .error-message {
      color: #f44336;
      font-size: 14px;
      margin: 8px 0;
      text-align: center;
    }

    mat-progress-bar {
      margin-bottom: 20px;
    }
  `]
})
export class LoginComponent {
  credentials: LoginRequest = {
    username: '',
    password: ''
  };
  isLoading = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  onSubmit(): void {
    if (!this.credentials.username || !this.credentials.password) {
      this.errorMessage = 'Please fill in all fields';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.credentials).subscribe({
      next: () => {
        this.isLoading = false;
        this.snackBar.open('Login successful', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
        this.router.navigate(['/groups']);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Login failed:', error);

        if (error.status === 401) {
          this.errorMessage = 'Invalid username or password';
        } else if (error.status === 0) {
          this.errorMessage = 'Unable to connect to the server';
        } else {
          this.errorMessage = 'An error occurred during login. Please try again.';
        }

        this.snackBar.open(this.errorMessage, 'Close', {
          duration: 5000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
      }
    });
  }
}
