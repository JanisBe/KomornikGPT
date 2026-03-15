import {Component, inject, OnInit, signal} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {PasswordService} from '../../core/services/password.service';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {finalize} from "rxjs";

@Component({
  selector: 'app-confirm-email',
  standalone: true,
  imports: [MatProgressSpinnerModule],
  template: `
    <div class="container">
      @if (isLoading()) {
        <mat-spinner diameter="40"></mat-spinner>
      }
      <p>{{ message() }}</p>
    </div>
  `,
  styles: [`
    .container {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 100vh;
      font-size: 24px;
      gap: 20px;
    }
  `]
})
export class ConfirmEmailComponent implements OnInit {
  message = signal('Weryfikowanie adresu e-mail...');
  isLoading = signal(true);

  private route = inject(ActivatedRoute);
  private passwordService = inject(PasswordService);
  private router = inject(Router);

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (token) {
      this.passwordService.confirmEmail(token)
        .pipe(finalize(() => this.isLoading.set(false)))
        .subscribe({
          next: () => {
            this.message.set('Adres e-mail został pomyślnie zweryfikowany. Zostaniesz przekierowany na stronę główną.');
            setTimeout(() => {
              this.router.navigate(['/groups']);
            }, 3000);
          },
          error: (error) => {
            console.error(error);
            this.message.set('Wystąpił błąd podczas weryfikacji adresu e-mail. Spróbuj ponownie.');
          }
        });
    } else {
      this.isLoading.set(false);
      this.message.set('Brak tokenu weryfikacyjnego.');
    }
  }
}
