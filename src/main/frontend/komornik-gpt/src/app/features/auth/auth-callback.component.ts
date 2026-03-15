import {Component, inject, OnInit, signal} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {AuthService} from '../../core/services/auth.service';

import {MatProgressSpinnerModule} from "@angular/material/progress-spinner";

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [
    MatProgressSpinnerModule
  ],
  template: `
    <div class="flex justify-content-center align-items-center min-h-screen">
      @if (isLoading()) {
        <mat-spinner></mat-spinner>
      } @else {
        <div class="text-center">
          <p>Redirecting...</p>
        </div>
      }
    </div>
  `,
  styles: []
})
export class AuthCallbackComponent implements OnInit {
  isLoading = signal(true);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const requiresPassword = params['requiresPassword'] === 'true';
      this.authService.getCurrentUser().subscribe({
        next: (user) => {
          if (user.authenticated) {
            if (requiresPassword) {
              this.router.navigate(['/set-password']);
            } else {
              this.router.navigate(['/groups']);
            }
          } else {
            this.router.navigate(['/login']);
          }
          this.isLoading.set(false);
        },
        error: () => {
          this.router.navigate(['/login']);
          this.isLoading.set(false);
        }
      });
    });
  }
}
