import {Component, Inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MAT_DIALOG_DATA, MatDialog, MatDialogModule} from '@angular/material/dialog';
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
import {DEFAULT_CATEGORY, enumValueToCategory} from '../../../core/models/expense-category.model';
import {CopyUrlButtonComponent} from '../copy-url-button';
import {BreakpointObserver, Breakpoints} from '@angular/cdk/layout';
import {map} from 'rxjs/operators';
import {Observable} from 'rxjs';

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
    MatSnackBarModule,
    CopyUrlButtonComponent
  ],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <copy-url-button [groupId]="data.group.id" [viewToken]="data.group.viewToken" [groupName]="data.group.name"></copy-url-button>
        <h2 mat-dialog-title>Wydatki dla {{ data.group.name }}</h2>
        <div class="row" (click)="settleExpenses(data.group)"> Rozlicz wydatki
          <button mat-icon-button color="primary"
                matTooltip="Rozlicz wydatki">
          <mat-icon>payments</mat-icon>
        </button>
        </div>
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
                  <th>Kategoria</th>
                  <th>Kwota</th>
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
                          <mat-icon matTooltip="Uregulowane" class="paid-icon green-icon">check_circle</mat-icon>
                        } @else {
                          <mat-icon matTooltip="Nieuregulowane" color="warn" class="paid-icon">cancel</mat-icon>
                        }
                      </td>
                      <td>
                        <div class="category-cell">
                          <mat-icon
                            [matTooltip]="(expense.category?.mainCategory || 'Bez Kategorii') + ' - ' + (expense.category?.subCategory || 'Ogólne')">
                            {{ expense.category?.icon || 'category' }}
                          </mat-icon>
                          <span class="category-name">{{ expense.category?.subCategory || 'Ogólne' }}</span>
                        </div>
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
      max-height: 80vh;
      box-sizing: border-box;
    }

    .row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
    }
    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
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

    .green-icon {
      color: green;
    }

    .category-cell {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .category-name {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 80px;
      font-size: 0.9em;
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
  isMobile$: Observable<boolean>;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { group: Group },
    private expenseService: ExpenseService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private breakpointObserver: BreakpointObserver
  ) {
    this.isMobile$ = this.breakpointObserver.observe(Breakpoints.Handset)
      .pipe(map(result => result.matches));
  }

  ngOnInit() {
    this.loadExpenses();
  }

  loadExpenses() {
    this.expenseService.getExpensesByGroup(this.data.group.id).subscribe({
      next: (expenses) => {
        this.expenses = expenses.map(expense => {
          // Convert backend category enum to frontend category object if it's a string
          const category = typeof expense.category === 'string'
            ? enumValueToCategory(expense.category as string)
            : expense.category || DEFAULT_CATEGORY;

          return {
            ...expense,
            category: category
          };
        });
        this.groupedExpenses = this.groupExpensesByDay(this.expenses);
      },
      error: (error) => {
        console.error(error);
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
            console.error(error);
            this.snackBar.open('Error deleting expense', 'Close', {
              duration: 3000
            });
          }
        });
      }
    });
  }

  editExpense(expense: Expense) {
    this.isMobile$.subscribe(isMobile => {
      const dialogConfig = {
        data: {
          group: this.data.group,
          expense,
          isEdit: true
        },
        width: isMobile ? '100vw' : '800px',
        maxWidth: isMobile ? '100vw' : '90vw',
        height: isMobile ? '100vh' : undefined,
        maxHeight: isMobile ? '100vh' : '90vh',
        panelClass: isMobile ? 'mobile-dialog-container' : undefined
      };

      const dialogRef = this.dialog.open(AddExpenseDialogComponent, dialogConfig);

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
              console.error(error);
              this.snackBar.open('Error updating expense', 'Close', {
                duration: 3000
              });
            }
          });
        }
      });
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

