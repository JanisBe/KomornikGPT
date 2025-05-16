import {Component, Inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatSnackBar, MatSnackBarModule} from '@angular/material/snack-bar';
import {Group} from '../../../core/models/group.model';
import {Expense} from '../../../core/models/expense.model';
import {ExpenseService} from '../../../core/services/expense.service';
import {AddExpenseDialogComponent} from '../add-expense-dialog/add-expense-dialog.component';
import {ConfirmDeleteDialogComponent} from './confirm-delete-dialog.component';
import {SettleExpensesDialogComponent} from '../settle-expenses-dialog';

interface GroupedExpenses {
  date: Date;
  expenses: Expense[];
}

@Component({
  selector: 'app-view-expenses-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSnackBarModule
  ],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <h2 mat-dialog-title>Wydatki dla {{ data.group.name }}</h2>
        <button mat-icon-button color="primary" (click)="settleExpenses(data.group)"
                matTooltip="Rozlicz wydatki">
          <mat-icon>payments</mat-icon>
        </button>
        <button mat-icon-button mat-dialog-close class="close-button">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content>
        @for (group of groupedExpenses; track group.date) {
          <div class="date-group">
            <div class="date-header">
              {{ group.date | date:'shortDate':'':'pl' }}
            </div>
            <div class="table-wrapper">
              <table>
                <thead>
                <tr>
                  <th>Opis</th>
                  <th>Kwote</th>
                  <th>Płacił</th>
                  <th>Kto</th>
                  <th>Akcje</th>
                </tr>
                </thead>
                <tbody>
                  @for (expense of group.expenses; track expense.id) {
                    <tr>
                      <td>
                        <span [matTooltip]="expense.date | date:'medium':'':'pl'" matTooltipPosition="above">
                          {{ expense.description | slice:0:30 }}
                        </span>
                        @if (expense.isPaid) {
                          <mat-icon matTooltip="Uregulowane" class="paid-icon">check_circle</mat-icon>
                        }
                      </td>
                      <td>{{ expense.amount | number:'1.2-2' }} {{ expense.currency }}</td>
                      <td><span matTooltip="{{expense.payer.email}}">{{ expense.payer.name }}</span></td>
                      <td>
                        <div class="splits-container">
                          @for (split of expense.splits; track split.id) {
                            <div class="split-item" [class.paid]="split.isPaid">
                              <span
                                matTooltip="{{split.user.email}}">{{ split.user.name }}</span>: {{ split.amountOwed | number:'1.2-2' }}
                            </div>
                          }
                        </div>
                      </td>
                      <td class="actions">
                        <button mat-icon-button color="primary"
                                (click)="editExpense(expense)"
                                matTooltip="Edytuj wydatek">
                          <mat-icon>edit</mat-icon>
                        </button>
                        <button mat-icon-button color="warn"
                                (click)="deleteExpense(expense)"
                                matTooltip="Skasuj wydatek">
                          <mat-icon>delete</mat-icon>
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }
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
      background: white;
      position: sticky;
      top: 0;
      z-index: 3;
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

    .table-wrapper {
      position: relative;
      margin: 0;
      padding: 0;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }

    thead {
      position: sticky;
      top: 48px; /* Height of date header */
      z-index: 2;
    }

    th {
      background: white;
      padding: 12px;
      text-align: left;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.87);
      border-bottom: 1px solid rgba(0, 0, 0, 0.12);
      white-space: nowrap;
    }

    td {
      padding: 12px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.12);
      color: rgba(0, 0, 0, 0.87);
    }

    .date-group {
      margin-bottom: 32px;
    }

    .date-header {
      background: #f5f5f5;
      padding: 12px 16px;
      font-size: 16px;
      font-weight: 500;
      border-radius: 4px 4px 0 0;
      position: sticky;
      top: 0;
      z-index: 2;
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

    tr:hover {
      background: rgba(0, 0, 0, 0.04);
    }

    .actions {
      white-space: nowrap;
      text-align: right;
    }
  `]
})
export class ViewExpensesDialogComponent implements OnInit {
  expenses: Expense[] = [];
  groupedExpenses: GroupedExpenses[] = [];

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
        this.expenses = expenses;
        this.groupedExpenses = this.groupExpensesByDay(expenses);
      },
      error: (error) => {
        console.error('Error loading expenses:', error);
        this.snackBar.open('Error loading expenses', 'Close', {
          duration: 3000
        });
      }
    });
  }

  deleteExpense(expense: Expense) {
    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, {
      width: '400px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.expenseService.deleteExpense(expense.id).subscribe({
          next: () => {
            this.expenses = this.expenses.filter(e => e.id !== expense.id);
            this.groupedExpenses = this.groupExpensesByDay(this.expenses);
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

  private groupExpensesByDay(expenses: Expense[]): GroupedExpenses[] {
    const groups = new Map<string, Expense[]>();

    expenses.forEach(expense => {
      const date = new Date(expense.date);
      const dateKey = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();

      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }
      groups.get(dateKey)?.push(expense);
    });

    return Array.from(groups.entries())
      .map(([dateKey, expenses]) => ({
        date: new Date(dateKey),
        expenses: expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  settleExpenses(group: Group): void {
    const dialogRef = this.dialog.open(SettleExpensesDialogComponent, {
      width: '600px',
      data: {group}
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('Wydatki zostały rozliczone!', 'Zamknij', {duration: 3000});
      }
    });
  }
}
