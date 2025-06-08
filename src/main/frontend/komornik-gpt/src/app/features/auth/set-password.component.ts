import {Component, inject} from '@angular/core';

import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router, RouterLink} from '@angular/router';
import {HttpClient} from '@angular/common/http';
import {MatInputModule} from '@angular/material/input';
import {MatButton} from '@angular/material/button';

@Component({
  selector: 'app-set-password',
  standalone: true,
  imports: [ReactiveFormsModule, MatInputModule, MatButton, RouterLink],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="password-form">
      <h2>Ustaw nowe hasło</h2>

      @if (this.error) {
        <div class="error">{{ this.error }}</div>
      }

      <mat-form-field appearance="outline">
        <mat-label>Nowe hasło:</mat-label>
        <input matInput type="password" formControlName="newPassword"/>
        @if (form.get('newPassword')?.invalid && (form.get('newPassword')?.dirty || form.get('newPassword')?.touched)) {
          <mat-error>Hasło jest wymagane</mat-error>
        }
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Powtórz hasło:</mat-label>
        <input matInput type="password" formControlName="confirmPassword" (blur)="comparePasswords()"/>
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
  private fb = inject(FormBuilder);
  form = this.fb.group({
    newPassword: ['', Validators.required],
    confirmPassword: ['', Validators.required]
  });
  private http = inject(HttpClient);
  private router = inject(Router);

  onSubmit(): void {
    if (this.form.invalid) return;
    const {newPassword} = this.form.value;
    this.comparePasswords();

    this.http.post('/api/set-password', {password: newPassword}, {
      withCredentials: true
    }).subscribe({
      next: () => this.router.navigate(['/groups']),
      error: () => this.error = 'Nie udało się ustawić hasła.'
    });
  }

  comparePasswords() {
    const {newPassword, confirmPassword} = this.form.value;
    if (newPassword !== confirmPassword) {
      this.form.controls['confirmPassword'].setErrors({'incorrect': true});
      return;
    } else {
      this.form.controls['confirmPassword'].setErrors(null);
    }
  }
}
