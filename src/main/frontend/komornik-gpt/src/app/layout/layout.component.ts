import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {AuthService} from '../core/services/auth.service';
import {User} from '../core/models/user.model';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
      <div class="container">
        <a class="navbar-brand" routerLink="/">KomornikGPT</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav me-auto">
            <li class="nav-item">
              <a class="nav-link" routerLink="/groups" routerLinkActive="active">Groups</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/expenses" routerLinkActive="active">Expenses</a>
            </li>
          </ul>
          <ul class="navbar-nav">
            @if (authService.isAuthenticated()) {
              <li class="nav-item">
                <a class="nav-link" routerLink="/profile" routerLinkActive="active">Profile ({{userName}})</a>
              </li>
              <li class="nav-item">
                <a class="nav-link" (click)="logout()" style="cursor: pointer">Logout</a>
              </li>
            } @else {
              <li class="nav-item">
                <a class="nav-link" routerLink="/login" routerLinkActive="active">Login</a>
              </li>
              <li class="nav-item">
                <a class="nav-link" routerLink="/register" routerLinkActive="active">Register</a>
              </li>
            }
          </ul>
        </div>
      </div>
    </nav>
    <div class="container mt-4">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    .navbar {
      margin-bottom: 2rem;
    }
  `]
})
export class LayoutComponent implements OnInit {
  userName = '';

  constructor(public authService: AuthService) {
  }

  ngOnInit(): void {
    this.authService.getCurrentUser().subscribe({
      next: (user: User) => {
        this.userName = user.name;
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
