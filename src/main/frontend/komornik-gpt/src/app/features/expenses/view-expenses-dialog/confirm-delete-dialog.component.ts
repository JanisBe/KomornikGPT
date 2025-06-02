import {Component, Inject} from '@angular/core';

import {MAT_DIALOG_DATA, MatDialogModule} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';

@Component({
  selector: 'app-confirm-delete-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule
  ],
  template: `
    <div class="dialog-container">
      <h2 mat-dialog-title>Kasowanie wydatku</h2>
      <mat-dialog-content>
        Czy na pewno chcesz usunąć ten wydatek?
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button mat-dialog-close>Anuluj</button>
        <button mat-raised-button color="warn" [mat-dialog-close]="true">Skasuj</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .dialog-container {
      padding: 24px;
      min-width: 400px;
    }

    h2 {
      font-size: 20px;
      font-weight: 500;
      margin: 0 0 16px;
    }

    mat-dialog-content {
      margin-bottom: 24px;
    }

    mat-dialog-actions {
      padding: 0;
      margin: 0;
      gap: 8px;
    }
  `]
})
export class ConfirmDeleteDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
  }
}
