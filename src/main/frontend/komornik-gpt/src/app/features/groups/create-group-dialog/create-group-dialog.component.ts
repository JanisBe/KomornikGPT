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
      <mat-dialog-content>
        <app-group-form #groupFormRef (formSubmitted)="dialogRef.close($event)"></app-group-form>
      </mat-dialog-content>
      <mat-dialog-actions>
        <button mat-button mat-dialog-close>Anuluj</button>
        <button mat-raised-button color="primary" (click)="groupFormRef.onSubmit()">Utwórz</button>
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
      padding: 16px 24px;
      border-top: 1px solid rgba(0, 0, 0, 0.12);
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
