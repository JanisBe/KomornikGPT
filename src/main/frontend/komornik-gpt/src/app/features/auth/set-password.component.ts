import {Component, inject} from '@angular/core';

import {
  AbstractControl,
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import {Router, RouterLink} from '@angular/router';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatIconModule} from "@angular/material/icon";
import {PasswordService} from '../../core/services/password.service';

@Component({
  selector: 'app-set-password',
  standalone: true,
  imports: [ReactiveFormsModule, MatInputModule, MatButtonModule, RouterLink, FormsModule, MatIconModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="password-form">
      <h2>Ustaw nowe hasło</h2>

      @if (this.error) {
        <div class="error">{{ this.error }}</div>
      }

      <mat-form-field appearance="outline">
        <mat-label>Nowe hasło:</mat-label>
        <input matInput [type]="hide ? 'password' : 'text'" formControlName="newPassword" required minlength="4"/>
        <button mat-icon-button matSuffix (click)="hide = !hide" type="button">
          <mat-icon>{{ hide ? 'visibility_off' : 'visibility' }}</mat-icon>
        </button>
        @if (form.get('newPassword')?.errors?.['required'] && (form.get('newPassword')?.dirty || form.get('newPassword')?.touched)) {
          <mat-error>Hasło jest wymagane</mat-error>
        }
        @if (form.get('newPassword')?.errors?.['minlength'] && (form.get('newPassword')?.dirty || form.get('newPassword')?.touched)) {
          <mat-error>Hasło musi mieć przynajmniej 4 znaki</mat-error>
        }
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Powtórz hasło:</mat-label>
        <input matInput [type]="hideConfirm ? 'password' : 'text'" formControlName="confirmPassword"
               required/>
        <button mat-icon-button matSuffix (click)="hideConfirm = !hideConfirm" type="button">
          <mat-icon>{{ hideConfirm ? 'visibility_off' : 'visibility' }}</mat-icon>
        </button>
        @if (form.get('confirmPassword')?.errors?.['incorrect']) {
          <mat-error>Hasła nie są takie same</mat-error>
        } @else if ((form.get('confirmPassword')?.dirty || form.get('confirmPassword')?.touched)) {
          <mat-error>Powtórz hasło</mat-error>
        }
      </mat-form-field>
      <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid">Zapisz hasło</button>
      <button mat-raised-button color="primary" type="button" [routerLink]="['/groups']">Pomiń tym razem</button>
    </form>
  `,
  styles: [`
    .password-form {
      max-width: 400px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .error {
      color: red;
    }
  `]
})
export class SetPasswordComponent {
  error: string | undefined;
  hide = true;
  hideConfirm = true;
  private fb = inject(FormBuilder);
  form = this.fb.group({
    newPassword: ['', [Validators.required, Validators.minLength(4)]],
    confirmPassword: ['', Validators.required]
  }, {validators: this.passwordsMatchValidator, updateOn: 'blur'});
  private passwordService = inject(PasswordService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  onSubmit(): void {
    if (this.form.invalid) return;
    const {newPassword} = this.form.value;

    if (newPassword != null) {
      this.passwordService.setPassword(newPassword).subscribe({
        next: () => {
          this.snackBar.open('Hasło zostało zaktualizowane.', 'OK', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
          });
          this.router.navigate(['/groups'])
        },
        error: () => this.error = 'Nie udało się ustawić hasła.'
      });
    }
  }

  passwordsMatchValidator(form: AbstractControl): ValidationErrors | null {
    const password = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return password === confirmPassword ? null : {passwordsMismatch: true};
  }
}
