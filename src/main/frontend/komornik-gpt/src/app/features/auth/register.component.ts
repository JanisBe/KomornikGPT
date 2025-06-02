import {Component} from '@angular/core';

import {FormsModule} from '@angular/forms';
import {Router, RouterModule} from '@angular/router';
import {HttpClient} from '@angular/common/http';
import {MatButtonModule} from '@angular/material/button';

interface RegisterRequest {
  username: string;
  password: string;
  email: string;
  name: string;
  surname: string;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterModule, MatButtonModule],
  template: `
    <div class="row justify-content-center">
      <div class="col-md-6 col-lg-4">
        <div class="card">
          <div class="card-body">
            <h2 class="card-title text-center mb-4">Zarejestruj się</h2>
            <form (ngSubmit)="onSubmit()">
              <div class="mb-3">
                <label for="username" class="form-label">Nazwa użytkownika</label>
                <input type="text" class="form-control" id="username" [(ngModel)]="user.username" name="username"
                       required>
              </div>
              <div class="mb-3">
                <label for="email" class="form-label">Email</label>
                <input type="email" class="form-control" id="email" [(ngModel)]="user.email" name="email" required>
              </div>
              <div class="mb-3">
                <label for="name" class="form-label">Imię</label>
                <input type="text" class="form-control" id="name" [(ngModel)]="user.name" name="name" required>
              </div>
              <div class="mb-3">
                <label for="surname" class="form-label">Nazwisko</label>
                <input type="text" class="form-control" id="surname" [(ngModel)]="user.surname" name="surname" required>
              </div>
              <div class="mb-3">
                <label for="password" class="form-label">Hasło</label>
                <input type="password" class="form-control" id="password" [(ngModel)]="user.password" name="password"
                       required>
              </div>
              <button type="submit" class="btn btn-primary w-100">Zarejestruj się</button>
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
export class RegisterComponent {
  user: RegisterRequest = {
    username: '',
    password: '',
    email: '',
    name: '',
    surname: ''
  };

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
  }

  onSubmit(): void {
    if (!this.user.name || !this.user.surname) {
      alert('Wypełnij wszystkie pola.');
      return;
    }

    this.http.post('/api/users/register', this.user).subscribe({
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
