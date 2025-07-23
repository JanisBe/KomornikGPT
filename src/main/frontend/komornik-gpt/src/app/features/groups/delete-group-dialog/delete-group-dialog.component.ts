import {Component, Inject, OnInit} from '@angular/core';

import {MAT_DIALOG_DATA, MatDialogModule} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';
import {Group} from '../../../core/models/group.model';
import {ExpenseService} from "../../../core/services/expense.service";

@Component({
  selector: 'app-delete-group-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <div class="dialog-container">
      <h2 mat-dialog-title>Skasuj grupę</h2>
      <mat-dialog-content>
        @if (hasUnpaidExpenses) {
          <p class="text-danger">UWAGA! Grupa "{{ data.name }}" ma nieuregulowane wydatki.</p>
        }
        <p>Czy na pewno chcesz skasować grupę "{{ data.name }}"?</p>
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

    .text-danger {
      color: #f44336;
    }
  `]
})
export class DeleteGroupDialogComponent implements OnInit {
  hasUnpaidExpenses = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: Group,
    private expenseService: ExpenseService
  ) {
  }

  ngOnInit(): void {
    this.expenseService.hasUnpaidExpenses(this.data.id).subscribe(hasUnpaid => {
      this.hasUnpaidExpenses = hasUnpaid;
    });
  }
}

