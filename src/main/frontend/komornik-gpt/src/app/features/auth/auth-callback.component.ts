import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {AuthService} from '../../core/services/auth.service';
import {CommonModule} from "@angular/common";
import {MatProgressSpinnerModule} from "@angular/material/progress-spinner";

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="flex justify-content-center align-items-center min-h-screen">
      @if (loading) {
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
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {
  }

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
          this.loading = false;
        },
        error: () => {
          this.router.navigate(['/login']);
          this.loading = false;
        }
      });
    });
  }
}
