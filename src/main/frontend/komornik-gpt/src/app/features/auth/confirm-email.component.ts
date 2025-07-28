import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {PasswordService} from '../../core/services/password.service';

@Component({
  selector: 'app-confirm-email',
  template: `
    <div class="container">
      <p>{{ message }}</p>
    </div>
  `,
  styles: [`
    .container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      font-size: 24px;
    }
  `]
})
export class ConfirmEmailComponent implements OnInit {
  message: string = 'Weryfikowanie adresu e-mail...';

  constructor(
    private route: ActivatedRoute,
    private passwordService: PasswordService,
    private router: Router
  ) {
  }

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (token) {
      this.passwordService.confirmEmail(token).subscribe({
        next: (response: any) => {
          this.message = 'Adres e-mail został pomyślnie zweryfikowany. Zostaniesz przekierowany na stronę główną.';
          setTimeout(() => {
            this.router.navigate(['/groups']);
          }, 3000);
        },
        error: (error) => {
          console.error(error);
          this.message = 'Wystąpił błąd podczas weryfikacji adresu e-mail. Spróbuj ponownie.';
        }
      });
    } else {
      this.message = 'Brak tokenu weryfikacyjnego.';
    }
  }
}
