import {inject, Injectable} from '@angular/core';
import {MatSnackBar, MatSnackBarConfig} from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private snackBar = inject(MatSnackBar);

  private readonly defaultConfig: MatSnackBarConfig = {
    duration: 5000,
    horizontalPosition: 'end',
    verticalPosition: 'bottom'
  };

  showSuccess(message: string): void {
    this.snackBar.open(message, 'Zamknij', {
      ...this.defaultConfig,
      panelClass: ['success-snackbar']
    });
  }

  showError(message: string): void {
    this.snackBar.open(message, 'Zamknij', {
      ...this.defaultConfig,
      panelClass: ['error-snackbar']
    });
  }

  showInfo(message: string): void {
    this.snackBar.open(message, 'Zamknij', {
      ...this.defaultConfig,
      panelClass: ['info-snackbar']
    });
  }
}
