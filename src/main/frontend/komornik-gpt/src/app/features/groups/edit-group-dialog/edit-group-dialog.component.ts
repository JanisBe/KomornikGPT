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
      <mat-dialog-actions>
        <button mat-button mat-dialog-close>Anuluj</button>
        <button mat-raised-button color="primary" type="submit" (click)="groupFormRef.onSubmit()">OK</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .dialog-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      padding: 24px;
      box-sizing: border-box;
    }

    mat-dialog-content {
      flex: 1;
      overflow-y: auto;
    }

    mat-dialog-actions {
      display: flex;
      justify-content: space-between;
      padding: 16px 0 0 0;
      border-top: 1px solid rgba(0, 0, 0, 0.12);
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
