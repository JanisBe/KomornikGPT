import {Component, OnInit} from '@angular/core';

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
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatDividerModule} from '@angular/material/divider';
import {MatListModule} from '@angular/material/list';
import {RouterModule} from '@angular/router';
import {Group} from '../../core/models/group.model';
import {UpdateUserRequest, User} from '../../core/models/user.model';
import {AuthService} from '../../core/services/auth.service';
import {GroupService} from '../../core/services/group.service';
import {HttpErrorResponse} from '@angular/common/http';
import {MatIconModule} from '@angular/material/icon';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    ReactiveFormsModule,
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

            <div class="form-actions">
              <button mat-raised-button color="primary" type="submit"
                      [disabled]="!profileForm.valid || isLoading">
                {{ isLoading ? 'Zapisywanie...' : 'Zapisz zmiany' }}
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
  isLoading = false;
  userGroups: Group[] = [];
  hideCurrent = true;
  hideNew = true;
  hideConfirm = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private groupService: GroupService,
    private snackBar: MatSnackBar
  ) {
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
        this.snackBar.open('Nie załadowano danych', 'Close', {
          duration: 3000
        });
      }
    });

    // Load user's groups
    this.groupService.getMyGroups().subscribe({
      next: (groups: Group[]) => {
        this.userGroups = groups;
      },
      error: (error) => {
        console.error(error);
        this.snackBar.open('Nie załadowano grup', 'Close', {
          duration: 3000
        });
      }
    });
  }

  onSubmit(): void {
    if (this.profileForm.valid) {
      this.isLoading = true;

      // Validate password fields
      const newPassword = this.profileForm.get('newPassword')?.value;
      if (newPassword && !this.profileForm.get('currentPassword')?.value) {
        this.snackBar.open('Wpisz aktualne hasło', 'Close', {
          duration: 3000
        });
        this.isLoading = false;
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
          this.isLoading = false;
          this.snackBar.open('Profil zaktualizowany poprawnie', 'Close', {
            duration: 3000
          });
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
          this.isLoading = false;
          this.snackBar.open(message, 'Close', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
          console.error(error);
        }
      });
    }
  }
}
