import {Component, OnInit} from '@angular/core';

import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import {AuthService, LoginRequest} from '../../core/services/auth.service';
import {SocialAuthService} from '../../core/services/social-auth.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {MatIconModule} from '@angular/material/icon';
import {MatDividerModule} from '@angular/material/divider';
import {User} from '../../core/models/user.model';
import {WebAuthnService} from '../../core/services/webauthn.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatCardModule,
    MatProgressBarModule,
    MatIconModule,
    MatDividerModule
  ],
  template: `
    <div class="login-container">
      <mat-card class="login-card">
        <mat-card-header>
          <mat-card-title>Login</mat-card-title>
        </mat-card-header>

        @if (isLoading) {
          <mat-progress-bar mode="indeterminate"></mat-progress-bar>
        }

        <mat-card-content>
          <div class="divider">
            <mat-divider></mat-divider>
            <span class="divider-text">lub</span>
            <mat-divider></mat-divider>
          </div>
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" required>
              @if (loginForm.get('email')?.errors?.['required'] && (loginForm.get('email')?.dirty || loginForm.get('email')?.touched)) {
                <mat-error>Email is required</mat-error>
              } @else if (loginForm.get('email')?.errors?.['email'] && (loginForm.get('email')?.dirty || loginForm.get('email')?.touched)) {
                <mat-error>Email is invalid</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Password</mat-label>
              <input matInput type="password" formControlName="password" required>
              @if (loginForm.get('password')?.invalid && (loginForm.get('password')?.dirty || loginForm.get('password')?.touched)) {
                <mat-error>Password is required</mat-error>
              }
            </mat-form-field>

            @if (errorMessage) {
              <div class="error-message">{{ errorMessage }}</div>
            }

            <div class="form-actions">
              <button mat-raised-button
                      color="primary"
                      type="submit"
                      [disabled]="loginForm.invalid || isLoading">
                {{ isLoading ? 'Logging in...' : 'Login' }}
              </button>
              <button mat-button
                      type="button"
                      [routerLink]="['/register']">
                Zarejestruj się
              </button>
              <button mat-button
                      type="button"
                      [routerLink]="['/forgot-password']">
                Przypomnij hasło
              </button>
            </div>
          </form>

          <div class="divider">
            <mat-divider></mat-divider>
            <span class="divider-text">lub</span>
            <mat-divider></mat-divider>
          </div>

          <div class="social-login-container">
            <div class="social-login">
              <button mat-raised-button
                      class="google-btn"
                      (click)="loginWithGoogle()"
                      [disabled]="isLoading">
                <img src="assets/google-logo.svg" alt="Google logo" class="social-icon">
                Zaloguj Googlem
              </button>
              <button mat-raised-button
                      class="facebook-btn"
                      (click)="loginWithFacebook()"
                      [disabled]="isLoading">
                <img src="assets/facebook-logo.svg" alt="Facebook logo" class="social-icon">
                Zaloguj Facebookiem
              </button>
              <button mat-raised-button
                      class="github-btn"
                      (click)="loginWithGithub()"
                      [disabled]="isLoading">
                <img src="assets/github-logo.svg" alt="GitHub logo" class="social-icon" style="background: white">
                Zaloguj GitHubem
              </button>
            </div>
          </div>
        </mat-card-content>

        <mat-card-actions>
          <div class="register-link">
            Nie masz konta?
            <a mat-button color="primary" routerLink="/register" style="padding-bottom: 2px;">
              Zarejestruj się
            </a>
          </div>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`

    .auth-container {
      text-align: center;
      padding: 50px;
    }

    .success {
      color: green;
    }

    .error {
      color: red;
    }

    button {
      margin: 5px;
      padding: 10px 20px;
      font-size: 16px;
    }

    p {
      margin: 10px;
      font-size: 16px;
    }


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
      max-width: 480px;
    }

    mat-card-header {
      justify-content: center;
      margin-bottom: 20px;
    }

    mat-card-title {
      font-size: 24px;
      margin: 0;
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

    .social-login-container {
      display: flex;
      justify-content: center;
    }

    .social-login {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 24px;
      width: 400px;
    }

    .social-login button {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 0 8px;
    }

    .social-icon {
      width: 20px;
      height: 20px;
      object-fit: contain;
      margin-right: 8px;
    }

    .google-btn {
      background-color: white;
      color: rgba(0, 0, 0, 0.87);
      border: 1px solid #dadce0;
      height: 40px;
      font-family: 'Roboto', sans-serif;
      font-weight: 500;
    }

    .facebook-btn {
      background-color: white;
      color: #1877f2;
      border: 1px solid #1877f2;
      height: 40px;
      font-weight: 500;
    }

    .github-btn {
      background-color: #24292F;
      color: white;
      height: 40px;
      font-weight: 500;
    }

    .fingerprint-btn {
      background-color: #ffffff;
      color: #000000;
      border: 1px solid #cccccc;
      height: 40px;
      font-weight: 500;
    }

    .divider {
      display: flex;
      align-items: center;
      gap: 16px;
      margin: 24px 0;
    }

    .divider mat-divider {
      flex: 1;
    }

    .divider-text {
      color: rgba(0, 0, 0, 0.54);
      font-size: 14px;
    }

    @media (max-width: 480px) {
      .form-actions {
        flex-direction: column;
        gap: 8px;
      }

      .social-login {
        width: 100%;
      }
    }
  `]
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  message: string | null = null; // Message to display feedback to the user
  isSuccess: boolean = false; // Indicates if the last action was successful
  isWebAuthnSupported: boolean = false;
  protected readonly matchMedia = matchMedia;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private socialAuthService: SocialAuthService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private webAuthnService: WebAuthnService
  ) {
  }

  // Trigger registration process and update the UI based on the outcome
  async register() {
    const user: User = {
      username: this.loginForm.get('email')?.value
    } as User;
    try {
      await this.webAuthnService.register(user);
      this.message = "Registration successful!";
      this.isSuccess = true;
    } catch (err) {
      console.log(err);
      this.message = "Registration failed. Please try again.";
      this.isSuccess = false;
    }
  }
  ngOnInit(): void {
    this.isWebAuthnSupported = this.webAuthnService.isWebAuthnSupported();
    console.log(this.isWebAuthnSupported);
    this.route.queryParams.subscribe(params => {
      const requiresPassword = params['requiresPassword'] === 'true';
      if (requiresPassword) {
        this.router.navigate(['/set-password']);
      } else {
        this.router.navigate(['/groups']);
      }
    });
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  async loginWithGoogle(): Promise<void> {
    try {
      this.isLoading = true;
      this.errorMessage = '';
      this.socialAuthService.loginWithGoogle();
    } catch (error) {
      this.handleError(error);
    }
  }

  async loginWithFacebook(): Promise<void> {
    try {
      this.isLoading = true;
      this.errorMessage = '';
      this.socialAuthService.loginWithFacebook();
    } catch (error) {
      this.handleError(error);
    }
  }

  async loginWithGithub(): Promise<void> {
    try {
      this.isLoading = true;
      this.errorMessage = '';
      this.socialAuthService.loginWithGithub();
    } catch (error) {
      this.handleError(error);
    }
  }

  async loginWithFingerprint(): Promise<void> {
    if (!this.loginForm.get('email')?.value) {
      this.errorMessage = 'Please enter your email address first';
      return;
    }

    try {
      this.isLoading = true;
      this.errorMessage = '';
      const user: User = {username: this.loginForm.get('email')?.value} as User;
      await this.webAuthnService.authenticate(user);
      this.showSuccessAndRedirect();
    } catch (error) {
      this.handleError(error);
    }
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      const credentials: LoginRequest = this.loginForm.value;
      this.isLoading = true;
      this.errorMessage = '';

      this.authService.login(credentials).subscribe({
        next: () => {
          this.showSuccessAndRedirect();
        },
        error: (error) => {
          this.handleError(error);
        }
      });
    }
  }

  private showSuccessAndRedirect(): void {
    this.isLoading = false;
    this.snackBar.open('Login successful', 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
    this.router.navigate(['/groups']);
  }

  private handleError(error: any): void {
    this.isLoading = false;
    console.error(error);

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

  // Trigger authentication process and update the UI based on the outcome
  async login() {
    const user: User = {
      username: this.loginForm.get('email')?.value
    } as User;
    try {
      await this.webAuthnService.authenticate(user);
      this.message = "Authentication successful!";
      this.isSuccess = true;
    } catch (err) {
      console.log(err);
      this.message = "Authentication failed. Please try again.";
      this.isSuccess = false;
    }
  }
}
