import {ChangeDetectionStrategy, Component, inject, OnInit, signal} from '@angular/core';

import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import {MatCardModule} from '@angular/material/card';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatDividerModule} from '@angular/material/divider';
import {MatListModule} from '@angular/material/list';
import {RouterModule} from '@angular/router';
import {Group} from '../../core/models/group.model';
import {UpdateUserRequest, User} from '../../core/models/user.model';
import {AuthService} from '../../core/services/auth.service';
import {GroupService} from '../../core/services/group.service';
import {NotificationService} from '../../core/services/notification.service';
import {HttpErrorResponse} from '@angular/common/http';
import {DatePipe} from '@angular/common';
import {MatIconModule} from '@angular/material/icon';
import {WebAuthnService} from '../../core/services/webauthn.service';
import {WebAuthnCredentialDto} from '../../core/models/webauthn.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DatePipe,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatExpansionModule,
    MatDividerModule,
    MatListModule,
    RouterModule,
    MatIconModule
  ],
  template: `
    <div class="profile-container">
      <mat-card class="profile-card">
        <mat-card-header>
          <mat-card-title>Twój profil</mat-card-title>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="profileForm" (ngSubmit)="onSubmit()">
            <div class="form-field">
              <mat-form-field appearance="outline">
                <mat-label>Imię</mat-label>
                <input matInput formControlName="name" required>
                @if (profileForm.get('name')?.errors?.['required'] && profileForm.get('name')?.touched) {
                  <mat-error>Imię jest wymagane</mat-error>
                }
              </mat-form-field>
            </div>

            <div class="form-field">
              <mat-form-field appearance="outline">
                <mat-label>Nazwisko</mat-label>
                <input matInput formControlName="surname" required>
                @if (profileForm.get('surname')?.errors?.['required'] && profileForm.get('surname')?.touched) {
                  <mat-error> Nazwisko jest wymagane</mat-error>
                }
              </mat-form-field>
            </div>

            <div class="form-field">
              <mat-form-field appearance="outline">
                <mat-label>Email</mat-label>
                <input matInput formControlName="email" type="email" required>
                @if (profileForm.get('email')?.errors?.['required'] && profileForm.get('email')?.touched) {
                  <mat-error>Email jest wymagany</mat-error>
                }
                @if (profileForm.get('email')?.errors?.['email'] && profileForm.get('email')?.touched) {
                  <mat-error>Wprowadź poprawny adres email</mat-error>
                }
              </mat-form-field>
            </div>

            <mat-expansion-panel>
              <mat-expansion-panel-header>
                <mat-panel-title>
                  Zmień hasło
                </mat-panel-title>
              </mat-expansion-panel-header>

              <div class="form-field">
                <mat-form-field appearance="outline">
                  <mat-label>Obecne hasło</mat-label>
                  <input matInput [type]="hideCurrent ? 'password' : 'text'" formControlName="currentPassword">
                  <button mat-icon-button matSuffix (click)="hideCurrent = !hideCurrent" type="button">
                    <mat-icon>{{hideCurrent ? 'visibility_off' : 'visibility'}}</mat-icon>
                  </button>
                  @if (profileForm.get('currentPassword')?.errors?.['required'] && profileForm.get('currentPassword')?.touched) {
                    <mat-error>Obecne hasło jest wymagane</mat-error>
                  }
                </mat-form-field>
              </div>

              <div class="form-field">
                <mat-form-field appearance="outline">
                  <mat-label>Nowe hasło</mat-label>
                  <input matInput [type]="hideNew ? 'password' : 'text'" formControlName="newPassword">
                  <button mat-icon-button matSuffix (click)="hideNew = !hideNew" type="button">
                    <mat-icon>{{hideNew ? 'visibility_off' : 'visibility'}}</mat-icon>
                  </button>
                  @if (profileForm.get('newPassword')?.errors?.['minlength'] && profileForm.get('newPassword')?.touched) {
                    <mat-error>Nowe hasło musi mieć conajmniej 4 znaki</mat-error>
                  }
                </mat-form-field>
              </div>

              <div class="form-field">
                <mat-form-field appearance="outline">
                  <mat-label>Potwierdź nowe hasło</mat-label>
                  <input matInput [type]="hideConfirm ? 'password' : 'text'" formControlName="confirmNewPassword">
                  <button mat-icon-button matSuffix (click)="hideConfirm = !hideConfirm" type="button">
                    <mat-icon>{{ hideConfirm ? 'visibility_off' : 'visibility' }}</mat-icon>
                  </button>
                  @if (profileForm.get('confirmNewPassword')?.errors?.['required'] && profileForm.get('confirmNewPassword')?.touched) {
                    <mat-error>Potwierdzenie hasła jest wymagane</mat-error>
                  }
                  @if (profileForm.errors?.['passwordsMismatch'] && profileForm.get('confirmNewPassword')?.touched) {
                    <mat-error>Hasła nie są identyczne</mat-error>
                  }
                </mat-form-field>
              </div>
            </mat-expansion-panel>

            <mat-expansion-panel class="passkey-panel">
              <mat-expansion-panel-header>
                <mat-panel-title>
                  <mat-icon class="panel-icon">fingerprint</mat-icon>
                  Logowanie odciskiem palca / Passkeys
                </mat-panel-title>
              </mat-expansion-panel-header>

              <div class="passkey-content">
                <p class="passkey-description">
                  Możesz logować się do aplikacji bez hasła za pomocą czytnika linii papilarnych, Face ID lub klucza
                  bezpieczeństwa na tym urządzeniu.
                </p>

                @if (isBiometricsSupported()) {
                  <div class="passkey-add-action">
                    <button mat-stroked-button color="primary" type="button"
                            (click)="registerPasskey()"
                            [disabled]="isPasskeyLoading()">
                      <mat-icon>add</mat-icon>
                      {{ isPasskeyLoading() ? 'Rejestrowanie...' : 'Dodaj to urządzenie' }}
                    </button>
                  </div>
                } @else {
                  <div class="unsupported-hint">
                    <mat-icon>info</mat-icon>
                    <span>Ta przeglądarka lub urządzenie nie wspiera rejestracji WebAuthn.</span>
                  </div>
                }

                <div class="registered-devices-section">
                  <h4>Zarejestrowane urządzenia</h4>
                  <mat-list>
                    @for (cred of credentials(); track cred.id) {
                      <mat-list-item class="device-item">
                        <mat-icon matListItemIcon>devices</mat-icon>
                        <div matListItemTitle>{{ cred.label }}</div>
                        <div matListItemLine class="device-meta">
                          Dodano: {{ cred.created | date:'shortDate' }}
                        </div>
                        <button mat-icon-button matListItemMeta color="warn" type="button"
                                (click)="deletePasskey(cred.id)"
                                title="Usuń to urządzenie">
                          <mat-icon>delete</mat-icon>
                        </button>
                      </mat-list-item>
                    }
                    @if (credentials().length === 0) {
                      <mat-list-item>
                        <span class="no-devices-text">Brak zarejestrowanych urządzeń.</span>
                      </mat-list-item>
                    }
                  </mat-list>
                </div>
              </div>
            </mat-expansion-panel>

            <div class="form-actions">
              <button mat-raised-button color="primary" type="submit"
                      [disabled]="!profileForm.valid || isLoading()">
                {{ isLoading() ? 'Zapisywanie...' : 'Zapisz zmiany' }}
              </button>
            </div>
          </form>

          <mat-divider class="my-4"></mat-divider>

          <h3>Moje grupy</h3>
          <mat-list>
            @for (group of userGroups; track group.id) {
              <mat-list-item class="group-item">
                <a [routerLink]="['/groups', group.id]" class="group-link">
                  {{ group.name }}
                </a>
              </mat-list-item>
            }
            @if (userGroups.length === 0) {
              <mat-list-item>
                Nie należysz do żadnej grupy.
              </mat-list-item>
            }
          </mat-list>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    .profile-container {
      display: flex;
      justify-content: center;
      padding: 20px;
    }

    .profile-card {
      width: 100%;
      max-width: 600px;
    }

    .form-field {
      width: 100%;
      margin-bottom: 16px;
    }

    mat-form-field {
      width: 100%;
    }

    .form-actions {
      margin-top: 24px;
      display: flex;
      justify-content: flex-end;
    }

    .passkey-panel {
      margin-top: 16px;
    }

    .panel-icon {
      margin-right: 8px;
      vertical-align: middle;
    }

    .passkey-content {
      padding: 8px 0;
    }

    .passkey-description {
      margin-bottom: 16px;
      font-size: 0.9rem;
      color: rgba(0, 0, 0, 0.7);
    }

    .passkey-add-action {
      margin-bottom: 16px;
    }

    .unsupported-hint {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      margin-bottom: 16px;
      background: rgba(0, 0, 0, 0.05);
      border-radius: 4px;
      font-size: 0.85rem;
    }

    .registered-devices-section h4 {
      margin: 16px 0 8px 0;
      font-size: 0.95rem;
      font-weight: 600;
    }

    .device-meta {
      font-size: 0.8rem;
      color: rgba(0, 0, 0, 0.54);
    }

    .no-devices-text {
      font-size: 0.85rem;
      color: rgba(0, 0, 0, 0.54);
    }

    mat-card-header {
      margin-bottom: 24px;
    }

    .my-4 {
      margin: 24px 0;
    }

    h3 {
      margin: 0 0 16px 0;
      font-weight: 500;
    }

    .group-item {
      cursor: pointer;
    }

    .group-item:hover {
      background-color: rgba(0, 0, 0, 0.04);
    }

    .group-link {
      text-decoration: none;
      color: inherit;
      display: block;
      width: 100%;
      padding: 16px;
    }

    .group-link:hover {
      color: #1976d2;
    }
  `]
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  isLoading = signal(false);
  userGroups: Group[] = [];
  hideCurrent = true;
  hideNew = true;
  hideConfirm = true;

  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly groupService = inject(GroupService);
  private readonly notificationService = inject(NotificationService);
  readonly credentials = signal<WebAuthnCredentialDto[]>([]);
  readonly isPasskeyLoading = signal(false);
  readonly isBiometricsSupported = signal(false);
  private readonly webAuthnService = inject(WebAuthnService);

  constructor() {
    this.profileForm = this.fb.group({
      name: ['', Validators.required],
      surname: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      currentPassword: [''],
      newPassword: ['', Validators.minLength(4)],
      confirmNewPassword: ['']
    }, {validators: this.passwordsMatchValidator});
  }

  passwordsMatchValidator(form: AbstractControl): ValidationErrors | null {
    const newPassword = form.get('newPassword')?.value;
    const confirmNewPassword = form.get('confirmNewPassword')?.value;
    return newPassword === confirmNewPassword ? null : {passwordsMismatch: true};
  }

  ngOnInit(): void {
    // Check WebAuthn support
    this.webAuthnService.isPlatformAuthenticatorAvailable().then(avail => {
      this.isBiometricsSupported.set(avail || this.webAuthnService.isSupported());
    });
    this.loadPasskeys();

    // Load user data
    this.authService.getCurrentUser().subscribe({
      next: (user: User) => {
        this.profileForm.patchValue({
          name: user.name,
          surname: user.surname,
          email: user.email
        });
      },
      error: (error) => {
        console.error(error);
        this.notificationService.showError('Nie załadowano danych');
      }
    });

    // Load user's groups
    this.groupService.getMyGroups().subscribe({
      next: (groups: Group[]) => {
        this.userGroups = groups;
      },
      error: (error) => {
        console.error(error);
        this.notificationService.showError('Nie załadowano grup');
      }
    });
  }

  loadPasskeys(): void {
    this.webAuthnService.getCredentials().subscribe({
      next: (creds) => this.credentials.set(creds),
      error: (err) => console.error('Failed to load passkeys', err)
    });
  }

  async registerPasskey(): Promise<void> {
    try {
      this.isPasskeyLoading.set(true);
      await this.webAuthnService.registerCurrentDevice();
      this.notificationService.showSuccess('Urządzenie zostało pomyślnie dodane!');
      this.loadPasskeys();
    } catch (error: any) {
      if (error?.name === 'NotAllowedError') {
        return;
      }
      const msg = error?.error?.message || error?.message || 'Nie udało się zarejestrować urządzenia.';
      this.notificationService.showError(msg);
    } finally {
      this.isPasskeyLoading.set(false);
    }
  }

  deletePasskey(id: number): void {
    this.webAuthnService.deleteCredential(id).subscribe({
      next: () => {
        this.notificationService.showSuccess('Urządzenie zostało usunięte');
        this.loadPasskeys();
      },
      error: (error) => {
        const msg = error?.error?.message || 'Błąd podczas usuwania urządzenia';
        this.notificationService.showError(msg);
      }
    });
  }

  onSubmit(): void {
    if (this.profileForm.valid) {
      this.isLoading.set(true);

      // Validate password fields
      const newPassword = this.profileForm.get('newPassword')?.value;
      if (newPassword && !this.profileForm.get('currentPassword')?.value) {
        this.notificationService.showError('Wpisz aktualne hasło');
        this.isLoading.set(false);
        return;
      }

      const updateRequest: UpdateUserRequest = {
        name: this.profileForm.get('name')?.value,
        surname: this.profileForm.get('surname')?.value,
        email: this.profileForm.get('email')?.value
      };

      if (newPassword) {
        updateRequest.currentPassword = this.profileForm.get('currentPassword')?.value;
        updateRequest.newPassword = newPassword;
      }

      this.authService.updateProfile(updateRequest).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.notificationService.showSuccess('Profil zaktualizowany poprawnie');
          this.profileForm.patchValue({
            currentPassword: '',
            newPassword: '',
            confirmNewPassword: ''
          });
        },
        error: (error: HttpErrorResponse) => {
          let message = 'Nie udało się zaktualizować profilu.';
          if (error.status === 401) {
            message = 'Nie jesteś zalogowany. Zaloguj się ponownie.';
          }
          this.isLoading.set(false);
          this.notificationService.showError(message);
          console.error(error);
        }
      });
    }
  }
}
