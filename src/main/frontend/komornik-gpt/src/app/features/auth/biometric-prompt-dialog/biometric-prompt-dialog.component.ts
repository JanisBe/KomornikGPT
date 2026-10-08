import {ChangeDetectionStrategy, Component, inject, signal} from '@angular/core';
import {MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {WebAuthnService} from '../../../core/services/webauthn.service';
import {NotificationService} from '../../../core/services/notification.service';

@Component({
  selector: 'app-biometric-prompt-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule
  ],
  template: `
    <div class="dialog-container">
      @if (isLoading()) {
        <mat-progress-bar mode="indeterminate"></mat-progress-bar>
      }

      <div class="icon-header">
        <mat-icon class="fingerprint-icon">fingerprint</mat-icon>
      </div>

      <h2 mat-dialog-title class="dialog-title">Włącz logowanie odciskiem palca</h2>

      <mat-dialog-content class="dialog-content">
        <p>
          Czy chcesz włączyć logowanie biometryczne (odcisk palca / Face ID) na tym urządzeniu?
        </p>
        <p class="dialog-hint">
          Pozwoli Ci to na błyskawiczne i bezpieczne logowanie bez konieczności wpisywania hasła. Opcja ta jest również
          dostępna w Twoim profilu.
        </p>
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="dialog-actions">
        <button mat-button type="button" [disabled]="isLoading()" (click)="onDismiss()">
          Nie teraz
        </button>
        <button mat-raised-button color="primary" type="button" [disabled]="isLoading()" (click)="onEnable()">
          {{ isLoading() ? 'Rejestrowanie...' : 'Włącz teraz' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    .dialog-container {
      padding: 16px;
      max-width: 420px;
    }

    .icon-header {
      display: flex;
      justify-content: center;
      margin-top: 8px;
      margin-bottom: 8px;
    }

    .fingerprint-icon {
      font-size: 56px;
      width: 56px;
      height: 56px;
      color: var(--mat-sys-primary, #3f51b5);
    }

    .dialog-title {
      text-align: center;
      margin: 8px 0 16px;
      font-size: 1.3rem;
      font-weight: 600;
    }

    .dialog-content {
      font-size: 0.95rem;
      line-height: 1.5;
      text-align: center;
      color: rgba(0, 0, 0, 0.87);
    }

    .dialog-hint {
      margin-top: 8px;
      font-size: 0.85rem;
      color: rgba(0, 0, 0, 0.6);
    }

    .dialog-actions {
      margin-top: 16px;
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }
  `]
})
export class BiometricPromptDialogComponent {
  readonly dialogRef = inject(MatDialogRef<BiometricPromptDialogComponent>);
  readonly isLoading = signal(false);
  private readonly webAuthnService = inject(WebAuthnService);
  private readonly notificationService = inject(NotificationService);

  async onEnable(): Promise<void> {
    try {
      this.isLoading.set(true);
      await this.webAuthnService.registerCurrentDevice();
      this.notificationService.showSuccess('Logowanie biometryczne zostało pomyślnie włączone!');
      this.dialogRef.close(true);
    } catch (err: any) {
      this.isLoading.set(false);
      const message = err?.message || 'Nie udało się włączyć logowania biometrycznego.';
      this.notificationService.showError(message);
      this.dialogRef.close(false);
    }
  }

  onDismiss(): void {
    this.dialogRef.close(false);
  }
}
