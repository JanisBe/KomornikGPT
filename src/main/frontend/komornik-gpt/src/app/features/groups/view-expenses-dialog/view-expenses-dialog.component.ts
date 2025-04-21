import {Component, Inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatTableModule} from '@angular/material/table';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatSnackBar, MatSnackBarModule} from '@angular/material/snack-bar';
import {Group} from '../../../core/models/group.model';
import {Expense} from '../../../core/models/expense.model';
import {ExpenseService} from '../../../core/services/expense.service';
import {MatSortModule, Sort} from '@angular/material/sort';
import {AddExpenseDialogComponent} from '../add-expense-dialog/add-expense-dialog.component';

@Component({
  selector: 'app-view-expenses-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatSortModule
  ],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <h2 mat-dialog-title>Expenses for {{ data.group.name }}</h2>
        <button mat-icon-button mat-dialog-close class="close-button">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content>
        <table mat-table [dataSource]="expenses" matSort (matSortChange)="sortData($event)" class="full-width">
          <!-- Date Column -->
          <ng-container matColumnDef="date">
            <th mat-header-cell *matHeaderCellDef mat-sort-header> Date </th>
            <td mat-cell *matCellDef="let expense"> {{expense.date | date:'medium'}} </td>
          </ng-container>

          <!-- Description Column -->
          <ng-container matColumnDef="description">
            <th mat-header-cell *matHeaderCellDef mat-sort-header> Description </th>
            <td mat-cell *matCellDef="let expense"> {{expense.description}} </td>
          </ng-container>

          <!-- Amount Column -->
          <ng-container matColumnDef="amount">
            <th mat-header-cell *matHeaderCellDef mat-sort-header> Amount </th>
            <td mat-cell *matCellDef="let expense">
              {{expense.amount | number:'1.2-2'}} {{expense.currency}}
            </td>
          </ng-container>

          <!-- Payer Column -->
          <ng-container matColumnDef="payer">
            <th mat-header-cell *matHeaderCellDef mat-sort-header> Paid By </th>
            <td mat-cell *matCellDef="let expense"> {{expense.payer.name}} </td>
          </ng-container>

          <!-- Splits Column -->
          <ng-container matColumnDef="splits">
            <th mat-header-cell *matHeaderCellDef> Splits </th>
            <td mat-cell *matCellDef="let expense">
              <div class="splits-container">
                @for (split of expense.splits; track split) {
                  <div class="split-item" [class.paid]="split.isPaid">
                    {{split.user.name}}: {{split.amountOwed | number:'1.2-2'}}
                    <mat-icon *ngIf="split.isPaid" class="paid-icon">check_circle</mat-icon>
                  </div>
                }
              </div>
            </td>
          </ng-container>

          <!-- Actions Column -->
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef> Actions </th>
            <td mat-cell *matCellDef="let expense">
              <button mat-icon-button color="primary"
                      (click)="editExpense(expense)"
                      matTooltip="Edit expense">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button color="warn"
                      (click)="deleteExpense(expense)"
                      matTooltip="Delete expense">
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns; sticky: true"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>
      </mat-dialog-content>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .dialog-container {
      padding: 24px;
      max-height: 80vh;
      box-sizing: border-box;
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 500;
    }

    mat-dialog-content {
      max-height: calc(80vh - 120px) !important;
      overflow: auto;
    }

    .full-width {
      width: 100%;
    }

    table {
      width: 100%;
    }

    .mat-column-date {
      min-width: 160px;
    }

    .mat-column-description {
      min-width: 200px;
    }

    .mat-column-amount {
      min-width: 120px;
    }

    .mat-column-payer {
      min-width: 120px;
    }

    .mat-column-splits {
      min-width: 250px;
    }

    .mat-column-actions {
      min-width: 100px;
      text-align: right;
    }

    .splits-container {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .split-item {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.9em;
      color: rgba(0, 0, 0, 0.7);
    }

    .split-item.paid {
      color: #4caf50;
    }

    .paid-icon {
      font-size: 16px;
      height: 16px;
      width: 16px;
    }

    tr.mat-mdc-row:hover {
      background: rgba(0, 0, 0, 0.04);
    }

    th.mat-mdc-header-cell {
      font-weight: 500;
      color: rgba(0, 0, 0, 0.87);
    }
  `]
})
export class ViewExpensesDialogComponent implements OnInit {
  expenses: Expense[] = [];
  displayedColumns: string[] = ['date', 'description', 'amount', 'payer', 'splits', 'actions'];

  constructor(
    private dialogRef: MatDialogRef<ViewExpensesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { group: Group },
    private expenseService: ExpenseService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
  }

  ngOnInit() {
    this.loadExpenses();
  }

  loadExpenses() {
    this.expenseService.getExpensesByGroup(this.data.group.id).subscribe({
      next: (expenses) => {
        this.expenses = expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      },
      error: (error) => {
        console.error('Error loading expenses:', error);
        this.snackBar.open('Error loading expenses', 'Close', {
          duration: 3000
        });
      }
    });
  }

  sortData(sort: Sort) {
    const data = [...this.expenses];
    if (!sort.active || sort.direction === '') {
      this.expenses = data;
      return;
    }

    this.expenses = data.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        case 'date':
          return compare(new Date(a.date).getTime(), new Date(b.date).getTime(), isAsc);
        case 'description':
          return compare(a.description, b.description, isAsc);
        case 'amount':
          return compare(a.amount, b.amount, isAsc);
        case 'payer':
          return compare(a.payer.name, b.payer.name, isAsc);
        default:
          return 0;
      }
    });
  }

  editExpense(expense: Expense) {
    const dialogRef = this.dialog.open(AddExpenseDialogComponent, {
      width: '70%',
      data: {
        group: this.data.group,
        expense,
        isEdit: true
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.expenseService.updateExpense(expense.id, result).subscribe({
          next: () => {
            this.snackBar.open('Expense updated successfully', 'Close', {
              duration: 3000
            });
            this.loadExpenses();
          },
          error: (error) => {
            console.error('Error updating expense:', error);
            this.snackBar.open('Error updating expense', 'Close', {
              duration: 3000
            });
          }
        });
      }
    });
  }

  deleteExpense(expense: Expense) {
    if (confirm('Are you sure you want to delete this expense?')) {
      this.expenseService.deleteExpense(expense.id).subscribe({
        next: () => {
          this.expenses = this.expenses.filter(e => e.id !== expense.id);
          this.snackBar.open('Expense deleted successfully', 'Close', {
            duration: 3000
          });
        },
        error: (error) => {
          console.error('Error deleting expense:', error);
          this.snackBar.open('Error deleting expense', 'Close', {
            duration: 3000
          });
        }
      });
    }
  }
}

function compare(a: number | string, b: number | string, isAsc: boolean) {
  return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}
