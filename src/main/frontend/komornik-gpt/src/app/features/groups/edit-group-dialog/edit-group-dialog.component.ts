import {Component, Inject, ViewChild} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';
import {GroupFormComponent} from '../group-form/group-form.component';
import {Group} from '../../../core/models/group.model';
import {User} from '../../../core/models/user.model';

@Component({
  selector: 'app-edit-group-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    GroupFormComponent
  ],
  template: `
    <div class="dialog-container">
      <h2 mat-dialog-title>Edytuj grupę</h2>
      <app-group-form #groupFormRef [group]="data.group" (formSubmitted)="dialogRef.close($event)">
        <button mat-raised-button color="primary" type="submit" class="submit-button-text">
          Zapisz zmiany
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
export class EditGroupDialogComponent {
  @ViewChild('groupFormRef') groupFormRef!: GroupFormComponent;

  constructor(
    public dialogRef: MatDialogRef<EditGroupDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { group: Group; currentUser: User }
  ) {
  }


}
