import {Component, inject, OnInit, signal} from '@angular/core';

import {MAT_DIALOG_DATA, MatDialogModule} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {Group} from '../../../core/models/group.model';
import {ExpenseService} from "../../../core/services/expense.service";
import {finalize} from "rxjs";

@Component({
  selector: 'app-delete-group-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <div class="dialog-container">
      <h2 mat-dialog-title>Skasuj grupę</h2>
      <mat-dialog-content>
        @if (isLoading()) {
          <div class="loading-spinner">
            <mat-spinner diameter="30"></mat-spinner>
            <p>Sprawdzanie wydatków...</p>
          </div>
        } @else {
          @if (hasUnpaidExpenses()) {
            <p class="text-danger">UWAGA! Grupa "{{ data.name }}" ma nieuregulowane wydatki.</p>
          }
          <p>Czy na pewno chcesz skasować grupę "{{ data.name }}"?</p>
        }
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button mat-dialog-close [disabled]="isLoading()">Anuluj</button>
        <button mat-raised-button color="warn" [mat-dialog-close]="true" [disabled]="isLoading()">Skasuj</button>
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

    .loading-spinner {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      padding: 10px;
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
  hasUnpaidExpenses = signal(false);
  isLoading = signal(true);

  data = inject<Group>(MAT_DIALOG_DATA);
  private expenseService = inject(ExpenseService);

  ngOnInit(): void {
    this.expenseService.hasUnpaidExpenses(this.data.id)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe(hasUnpaid => {
        this.hasUnpaidExpenses.set(hasUnpaid);
      });
  }
}

