import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Router, RouterModule} from '@angular/router';
import {AuthService, LoginRequest} from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="row justify-content-center">
      <div class="col-md-6 col-lg-4">
        <div class="card">
          <div class="card-body">
            <h2 class="card-title text-center mb-4">Login</h2>
            <form (ngSubmit)="onSubmit()">
              <div class="mb-3">
                <label for="username" class="form-label">Username</label>
                <input type="text" class="form-control" id="username" [(ngModel)]="credentials.username" name="username" required>
              </div>
              <div class="mb-3">
                <label for="password" class="form-label">Password</label>
                <input type="password" class="form-control" id="password" [(ngModel)]="credentials.password" name="password" required>
              </div>
              <button type="submit" class="btn btn-primary w-100">Login</button>
            </form>
            <div class="text-center mt-3">
              <p>Don't have an account? <a routerLink="/register">Register</a></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  credentials: LoginRequest = {
    username: '',
    password: ''
  };

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit(): void {
    this.authService.login(this.credentials).subscribe({
      next: () => {
        this.router.navigate(['/groups']);
      },
      error: (error) => {
        console.error('Login failed:', error);
      }
    });
  }
}
