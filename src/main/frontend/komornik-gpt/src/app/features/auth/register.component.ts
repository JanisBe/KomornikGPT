import {Component, inject, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router, RouterModule} from '@angular/router';
import {CommonModule} from "@angular/common";
import {MatSnackBar, MatSnackBarModule} from '@angular/material/snack-bar';
import {UserService} from '../../core/services/user.service';
import {MatIconModule} from "@angular/material/icon";
import {MatButtonModule} from "@angular/material/button";

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule, CommonModule, MatSnackBarModule, MatIconModule, MatButtonModule],
  template: `
    <div class="row justify-content-center">
      <div class="col-md-6 col-lg-4">
        <div class="card">
          <div class="card-body">
            <h2 class="card-title text-center mb-4">Zarejestruj się</h2>
            <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
              <div class="mb-3">
                <label for="username" class="form-label">Nazwa użytkownika</label>
                <input type="text" class="form-control" id="username" formControlName="username"
                       (blur)="checkUsername()" (input)="usernameExists = null" required>
                @if (usernameExists) {
                  <div class="text-danger">Nazwa użytkownika jest już zajęta.</div>
                }
              </div>
              <div class="mb-3">
                <label for="email" class="form-label">Email</label>
                <input type="email" class="form-control" id="email" formControlName="email"
                       (blur)="checkEmail()" (input)="emailExists = null" required>
                @if (emailExists) {
                  <div class="text-danger">Email jest już zajęty.</div>
                }
              </div>
              <div class="mb-3">
                <label for="name" class="form-label">Imię</label>
                <input type="text" class="form-control" id="name" formControlName="name" required>
              </div>
              <div class="mb-3">
                <label for="surname" class="form-label">Nazwisko</label>
                <input type="text" class="form-control" id="surname" formControlName="surname" required>
              </div>
              <div class="mb-3">
                <label for="password" class="form-label">Hasło</label>
                <div class="input-group">
                  <input [type]="hide ? 'password' : 'text'" class="form-control" id="password"
                         formControlName="password"
                         required minlength="4">
                  <button mat-icon-button (click)="hide = !hide" type="button" class="btn btn-outline-secondary">
                    <mat-icon>{{ hide ? 'visibility_off' : 'visibility' }}</mat-icon>
                  </button>
                </div>
                @if (registerForm.get('password')?.errors?.['required'] && registerForm.get('password')?.touched) {
                  <div class="text-danger">Hasło jest wymagane.</div>
                }
                @if (registerForm.get('password')?.errors?.['minlength'] && registerForm.get('password')?.touched) {
                  <div class="text-danger">Hasło musi mieć przynajmniej 4 znaki.</div>
                }
              </div>
              <button type="submit" class="btn btn-primary w-100"
                      [disabled]="registerForm.invalid || usernameExists || emailExists">Zarejestruj się
              </button>
            </form>
            <div class="text-center mt-3">
              <p>Masz już konto? <a mat-button color="primary" routerLink="/login">Login</a></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  usernameExists: boolean | null = null;
  emailExists: boolean | null = null;
  hide = true;
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private userService = inject(UserService);

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      name: ['', Validators.required],
      surname: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(4)]]
    });
  }

  checkUsername(): void {
    const username = this.registerForm.get('username')?.value;
    if (username) {
      this.userService.checkUsernameExists(username).subscribe({
        next: (exists) => {
          this.usernameExists = exists;
        }
      });
    }
  }

  checkEmail(): void {
    const email = this.registerForm.get('email')?.value;
    if (email) {
      this.userService.checkEmailExists(email).subscribe({
        next: (exists) => {
          this.emailExists = exists;
        }
      });
    }
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
