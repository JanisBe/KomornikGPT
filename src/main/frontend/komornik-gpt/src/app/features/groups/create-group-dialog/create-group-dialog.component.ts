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
    <h2 mat-dialog-title>Utwórz nową grupę</h2>
    <mat-dialog-content>
      <app-group-form #groupFormRef (formSubmitted)="dialogRef.close($event)"></app-group-form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Anuluj</button>
      <button mat-raised-button color="primary" (click)="groupFormRef.onSubmit()">Utwórz</button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-actions {
      padding: 16px 24px;
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
