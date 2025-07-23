import {Component, inject, OnInit} from '@angular/core';
import {
  AbstractControl,
  AsyncValidatorFn,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import {Router, RouterModule} from '@angular/router';
import {CommonModule} from "@angular/common";
import {MatSnackBar, MatSnackBarModule} from '@angular/material/snack-bar';
import {UserService} from '../../core/services/user.service';
import {MatIconModule} from "@angular/material/icon";
import {MatButtonModule} from "@angular/material/button";
import {MatCardModule} from "@angular/material/card";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {map, Observable} from "rxjs";

export interface RegisterRequest {
  username: string;
  password: string;
  email: string;
  name: string;
  surname: string;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterModule,
    CommonModule,
    MatSnackBarModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule
  ],
  template: `
    <div class="register-container">
      <mat-card class="register-card">
        <mat-card-header>
          <mat-card-title>Zarejestruj się</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline">
              <mat-label>Nazwa użytkownika</mat-label>
              <input matInput formControlName="username" required>
              @if (registerForm.get('username')?.errors?.['usernameExists']) {
                <mat-error>Nazwa użytkownika jest już zajęta.</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Email</mat-label>
              <input matInput formControlName="email" required>
              @if (registerForm.get('email')?.errors?.['emailExists']) {
                <mat-error>Email jest już zajęty.</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Imię</mat-label>
              <input matInput formControlName="name" required>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Nazwisko</mat-label>
              <input matInput formControlName="surname" required>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Hasło</mat-label>
              <input matInput [type]="hide ? 'password' : 'text'" formControlName="password" required minlength="4">
              <button mat-icon-button matSuffix (click)="hide = !hide" type="button">
                <mat-icon>{{ hide ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              @if (registerForm.get('password')?.errors?.['required'] && registerForm.get('password')?.touched) {
                <mat-error>Hasło jest wymagane.</mat-error>
              }
              @if (registerForm.get('password')?.errors?.['minlength'] && registerForm.get('password')?.touched) {
                <mat-error>Hasło musi mieć przynajmniej 4 znaki.</mat-error>
              }
            </mat-form-field>

            <button mat-raised-button color="primary" type="submit" class="w-100"
                    [disabled]="registerForm.invalid">Zarejestruj się
            </button>
          </form>
          <div class="text-center mt-3">
            <p>Masz już konto? <a mat-button color="primary" routerLink="/login">Login</a></p>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .register-container {
      display: flex;
      justify-content: center;
      align-items: start;
      min-height: 100vh;
      padding: 20px;
      background-color: white;
    }

    .register-card {
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
  `]
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  hide = true;
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private userService = inject(UserService);

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      username: ['', [Validators.required], [this.existingUsernameValidator()]],
      email: ['', [Validators.required, Validators.email], [this.existingEmailValidator()]],
      name: ['', Validators.required],
      surname: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(4)]]
    }, {updateOn: 'blur'});
  }

  existingUsernameValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      return this.userService.checkUsernameExists(control.value).pipe(
        map(exists => (exists ? {usernameExists: true} : null))
      );
    };
  }

  existingEmailValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      return this.userService.checkEmailExists(control.value).pipe(
        map(exists => (exists ? {emailExists: true} : null))
      );
    };
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      return;
    }
    this.snackBar.open('Sprawdź podanego maila i kliknij w link aktywacyjny', 'Close', {
      duration: 3000
    });
    this.userService.registerUser(this.registerForm.value).subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error(error);
        alert('Registration failed. Please try again.');
      }
    });
  }
}


