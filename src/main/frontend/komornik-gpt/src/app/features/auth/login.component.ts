import {ChangeDetectionStrategy, Component, inject, OnInit, signal} from '@angular/core';

import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import {AuthService} from '../../core/services/auth.service';
import {SocialAuthService} from '../../core/services/social-auth.service';
import {NotificationService} from '../../core/services/notification.service';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {MatIconModule} from '@angular/material/icon';
import {MatDividerModule} from '@angular/material/divider';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {LoginRequest, User} from '../../core/models/user.model';
import {WebAuthnService} from '../../core/services/webauthn.service';
import {BiometricPromptDialogComponent} from './biometric-prompt-dialog/biometric-prompt-dialog.component';

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
    MatDividerModule,
    MatDialogModule
  ],
  template: `
    <div class="login-container">
      <mat-card class="login-card">
        <mat-card-header>
          <mat-card-title>Zaloguj się</mat-card-title>
        </mat-card-header>

        @if (isLoading()) {
          <mat-progress-bar mode="indeterminate"></mat-progress-bar>
        }

        <mat-card-content>
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline">
              <mat-label>Email lub nazwa użytkownika</mat-label>
              <input matInput type="text" formControlName="email" autocomplete="username" required>
              <mat-hint>Możesz podać swój adres e-mail lub login</mat-hint>
              @if (loginForm.get('email')?.errors?.['required'] && (loginForm.get('email')?.dirty || loginForm.get('email')?.touched)) {
                <mat-error>Email lub nazwa użytkownika jest wymagana</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Hasło</mat-label>
              <input matInput [type]="hide ? 'password' : 'text'" formControlName="password"
                     autocomplete="current-password" required>
              <button mat-icon-button matSuffix (click)="hide = !hide" type="button">
                <mat-icon>{{ hide ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              @if (loginForm.get('password')?.invalid && (loginForm.get('password')?.dirty || loginForm.get('password')?.touched)) {
                <mat-error>Hasło jest wymagane</mat-error>
              }
            </mat-form-field>

            @if (errorMessage) {
              <div class="error-message">{{ errorMessage }}</div>
            }

            <div class="form-actions">
              <button mat-raised-button
                      color="primary"
                      type="submit"
                      [disabled]="loginForm.invalid || isLoading()">
                {{ isLoading() ? 'Logging in...' : 'Login' }}
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

          @if (hasBiometrics()) {
            <div class="biometric-login-container">
              <button mat-stroked-button
                      type="button"
                      class="biometric-btn"
                      (click)="loginWithPasskey()"
                      [disabled]="isLoading()">
                <mat-icon>fingerprint</mat-icon>
                Zaloguj odciskiem palca
              </button>
            </div>
          }

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
                      [disabled]="isLoading()">
                <img src="assets/google-logo.svg" alt="Google logo" class="social-icon">
                Zaloguj Googlem
              </button>
              <button mat-raised-button
                      class="facebook-btn"
                      (click)="loginWithFacebook()"
                      [disabled]="isLoading()">
                <img src="assets/facebook-logo.svg" alt="Facebook logo" class="social-icon">
                Zaloguj Facebookiem
              </button>
              <button mat-raised-button
                      class="github-btn"
                      (click)="loginWithGithub()"
                      [disabled]="isLoading()">
                <img src="assets/github-logo.svg" alt="GitHub logo" class="social-icon" style="background: white">
                Zaloguj GitHubem
              </button>
            </div>
          </div>
        </mat-card-content>

        <mat-card-actions>
          <div class="register-link">
            Nie masz konta?
            <a mat-button color="primary" routerLink="/register" class="register-action-link">
              Zarejestruj się
            </a>
          </div>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
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
      align-items: start;
      min-height: 100vh;
      padding: 20px;
    }

    .login-card {
      width: 100%;
      max-width: 560px;
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

    .register-action-link {
      font-weight: 500;
      color: var(--mat-sys-primary);
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
      width: 300px;
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
      height: 40px;
      font-family: 'Roboto', sans-serif;
      font-weight: 500;
    }

    .facebook-btn {
      height: 40px;
      font-weight: 500;
    }

    .google-btn, .facebook-btn {
      background-color: var(--mat-sys-surface-container-low, white);
      color: var(--mat-sys-on-surface, black);
      border: 1px solid var(--mat-sys-outline, #dadce0);
    }

    .github-btn {
      background-color: #24292F;
      color: white;
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
      color: var(--mat-sys-on-surface-variant, rgba(0, 0, 0, 0.54));
      font-size: 14px;
    }

    .biometric-login-container {
      margin-top: 12px;
      margin-bottom: 4px;
      display: flex;
      justify-content: center;
    }

    .biometric-btn {
      width: 100%;
      height: 42px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-size: 15px;
      font-weight: 500;
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
  isLoading = signal(false);
  errorMessage = '';
  message: string | null = null; // Message to display feedback to the user
  hide = true;

  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly socialAuthService = inject(SocialAuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly notificationService = inject(NotificationService);
  readonly hasBiometrics = signal(false);
  private readonly webAuthnService = inject(WebAuthnService);
  private readonly dialog = inject(MatDialog);

  ngOnInit(): void {
    this.webAuthnService.isPlatformAuthenticatorAvailable().then(avail => {
      this.hasBiometrics.set(avail);
    });

    this.loginForm = this.fb.group({
      email: ['', [Validators.required]],
      password: ['', Validators.required]
    });
    this.route.queryParams.subscribe(params => {
      if (params['requiresPassword']) {
        const requiresPassword = params['requiresPassword'] === 'true';
        if (requiresPassword) {
          this.router.navigate(['/set-password']);
        } else {
          this.router.navigate(['/groups']);
        }
      }

      const identifier = params['email'] || params['username'];
      if (identifier) {
        this.loginForm.get('email')?.setValue(identifier);
      }
      const error = params['error'];
      if (error) {
        this.errorMessage = error;
      }
    });
  }

  async loginWithPasskey(): Promise<void> {
    try {
      this.isLoading.set(true);
      this.errorMessage = '';
      await this.webAuthnService.loginWithPasskey();
      this.isLoading.set(false);
      this.notificationService.showSuccess('Zalogowano pomyślnie!');
      this.router.navigate(['/groups']);
    } catch (error: any) {
      this.isLoading.set(false);
      if (error?.name === 'NotAllowedError') {
        return;
      }
      const msg = error?.error?.message || error?.message || 'Nie udało się zalogować odciskiem palca.';
      this.errorMessage = msg;
      this.notificationService.showError(msg);
    }
  }

  async loginWithGoogle(): Promise<void> {
    try {
      this.isLoading.set(true);
      this.errorMessage = '';
      this.socialAuthService.loginWithGoogle();
    } catch (error: any) {
      this.isLoading.set(false);
      this.errorMessage = error.message || 'Google login failed';
    }
  }

  async loginWithFacebook(): Promise<void> {
    try {
      this.isLoading.set(true);
      this.errorMessage = '';
      this.socialAuthService.loginWithFacebook();
    } catch (error: any) {
      this.isLoading.set(false);
      this.errorMessage = error.message || 'Facebook login failed';
    }
  }

  async loginWithGithub(): Promise<void> {
    try {
      this.isLoading.set(true);
      this.errorMessage = '';
      this.socialAuthService.loginWithGithub();
    } catch (error: any) {
      this.isLoading.set(false);
      this.errorMessage = error.message || 'GitHub login failed';
    }
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      const credentials: LoginRequest = this.loginForm.value;
      this.isLoading.set(true);
      this.errorMessage = '';

      this.authService.login(credentials)
        .subscribe({
          next: (response) => {
            this.isLoading.set(false);
            this.handlePostLoginPrompt(response.user);
          },
          error: (error) => {
            this.isLoading.set(false);
            this.handleError(error);
          }
        });
    }
  }

  private handlePostLoginPrompt(user: User): void {
    if (
      this.hasBiometrics() &&
      user?.id &&
      !this.webAuthnService.isPromptDismissed(user.id) &&
      !this.webAuthnService.isEnrolled(user.id)
    ) {
      const dialogRef = this.dialog.open(BiometricPromptDialogComponent, {
        width: '420px',
        disableClose: true
      });
      dialogRef.afterClosed().subscribe((enrolled: boolean) => {
        if (!enrolled && user.id) {
          this.webAuthnService.dismissPrompt(user.id);
        }
        this.router.navigate(['/groups']);
      });
    } else {
      this.router.navigate(['/groups']);
    }
  }

  private handleError(error: any): void {
    console.log("error", error);

    console.error(error);

    if (error.status === 401) {
      this.errorMessage = 'Złe dane logowania';
    } else if (error.status === 0) {
      this.errorMessage = 'Nie połączono z serwerem';
    } else {
      this.errorMessage = 'Nastąpił bład podczas logowania. Spróbuj ponownie.';
    }

    this.notificationService.showError(this.errorMessage);
  }
}
