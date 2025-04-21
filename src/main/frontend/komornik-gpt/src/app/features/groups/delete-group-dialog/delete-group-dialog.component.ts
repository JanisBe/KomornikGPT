import {Component, Inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';
import {Group} from '../../../core/models/group.model';

@Component({
  selector: 'app-delete-group-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <div class="dialog-container">
      <h2 mat-dialog-title>Delete Group</h2>
      <mat-dialog-content>
        Are you sure you want to delete group "{{ data.name }}"?
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button mat-dialog-close>Cancel</button>
        <button mat-raised-button color="warn" [mat-dialog-close]="true">Delete</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .dialog-container {
      padding: 24px;
    }

    mat-dialog-content {
      margin: 20px 0;
      min-width: 300px;
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
export class DeleteGroupDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<DeleteGroupDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Group
  ) {
  }
}
