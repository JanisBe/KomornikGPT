import {Component, ViewChild} from '@angular/core';
import {MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';
import {GroupFormComponent} from '../group-form/group-form.component';

@Component({
  selector: 'app-create-group-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    GroupFormComponent
  ],
  template: `
    <div class="dialog-container">
      <h2 mat-dialog-title>Utwórz nową grupę</h2>
      <app-group-form #groupFormRef (formSubmitted)="dialogRef.close($event)">
        <button mat-raised-button color="primary" type="submit" class="submit-button-text">
          Utwórz grupę
        </button>
      </app-group-form>
      <mat-dialog-actions align="end">
        <button mat-button mat-dialog-close>Anuluj</button>
        <button mat-raised-button color="primary" type="submit" (click)="groupFormRef.onSubmit()">OK</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .dialog-container {
      padding: 24px;
    }

    mat-dialog-actions {
      padding: 16px 0 0 0;
      margin-bottom: 0;
    }

    mat-dialog-actions button {
      margin-left: 8px;
    }
  `]
})
export class CreateGroupDialogComponent {
  @ViewChild('groupFormRef') groupFormRef!: GroupFormComponent;

  constructor(
    public dialogRef: MatDialogRef<CreateGroupDialogComponent>
  ) {
  }


}
