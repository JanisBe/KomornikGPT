import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="row justify-content-center">
      <div class="col-md-6">
        <div class="card">
          <div class="card-body">
            <h2 class="card-title text-center mb-4">Profile</h2>
            <div *ngIf="authService.currentUser$ | async as user">
              <div class="mb-3">
                <label class="form-label">Username</label>
                <p class="form-control-static">{{ user.username }}</p>
              </div>
              <div class="mb-3">
                <label class="form-label">Email</label>
                <p class="form-control-static">{{ user.email }}</p>
              </div>
              <div class="mb-3">
                <label class="form-label">Name</label>
                <p class="form-control-static">{{ user.name }}</p>
              </div>
              <div class="mb-3">
                <label class="form-label">Surname</label>
                <p class="form-control-static">{{ user.surname }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ProfileComponent {
  constructor(public authService: AuthService) {}
} 