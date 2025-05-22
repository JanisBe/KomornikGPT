import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatTableModule} from '@angular/material/table';
import {ExpenseService} from '../../../core/services/expense.service';
import {AuthService} from '../../../core/services/auth.service';
import {Expense} from '../../../core/models/expense.model';
import {Group, GroupExpenses} from '../../../core/models/group.model';
import {RouterLink} from '@angular/router';
import {ConfirmDeleteDialogComponent} from '../view-expenses-dialog/confirm-delete-dialog.component';
import {AddExpenseDialogComponent} from '../add-expense-dialog/add-expense-dialog.component';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatDialog} from '@angular/material/dialog';
import {MatIconButton} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatDividerModule} from '@angular/material/divider';

@Component({
  selector: 'app-my-expenses',
  standalone: true,
  imports: [CommonModule, MatTableModule, RouterLink, MatIconModule, MatIconButton, MatTooltipModule, MatDividerModule],
  styles: [`
    .paid-icon {
      font-size: 16px;
      height: 16px;
      width: 16px;
    }

    .expense-group-divider {
      margin-top: 20px;
      margin-bottom: 10px;
    }

    .cell {
      display: flex;
      align-items: center;
      flex-direction: row;
      gap: 5px;
    }

    .sticky-header {
      position: sticky;
      top: 0;
      background-color: white;
      z-index: 1;
      padding: 5px;
      font-size: 20px;
      font-weight: bold;
    }

    .group-link {
      text-decoration: none;
      color: inherit;
      display: block;
      width: 100%;
      padding: 16px;
    }

    .group-link:hover {
      color: #1976d2;
    }

    .expense-table {
      width: 100%;
      table-layout: fixed;
    }

    .expense-table .mat-column-description {
      flex: 1;
      min-width: 150px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .expense-table .mat-column-amount {
      width: 100px;
      text-align: right;
    }

    .expense-table .mat-column-date {
      width: 120px;
    }

    .expense-table .mat-column-paid {
      width: 80px;
      text-align: center;
    }

    .expense-table .mat-column-actions {
      width: 140px;
      text-align: center;
    }

  `],
  template: `
    @if (expensesByGroupKeys().length > 0) {
      @for (group of expensesByGroupKeys(); track group.id) {
        <h2 class="sticky-header"><a [routerLink]="['/groups', group.id]" class="group-link">
          {{ group.name }}
        </a></h2>
        <table mat-table [dataSource]="expensesByGroup().get(group) ?? []" class="mat-elevation-z2 expense-table">
          <ng-container matColumnDef="description">
            <th mat-header-cell *matHeaderCellDef> Opis</th>
            <td mat-cell *matCellDef="let expense">
              <span class="cell">
              {{ expense.description }}
                @if (expense.isPaid) {
                  <mat-icon matTooltip="Uregulowane" class="paid-icon">check_circle</mat-icon>
                } @else {
                  <mat-icon matTooltip="Nieuregulowane" class="paid-icon">cancel</mat-icon>
                }
                </span>
            </td>
          </ng-container>
          <ng-container matColumnDef="amount">
            <th mat-header-cell *matHeaderCellDef> Kwota</th>
            <td mat-cell *matCellDef="let expense"> {{ expense.amount }} {{ expense.currency }}</td>
          </ng-container>
          <ng-container matColumnDef="date">
            <th mat-header-cell *matHeaderCellDef> Data</th>
            <td mat-cell *matCellDef="let expense">
              <span matTooltip="{{ expense.date | date:'medium':'':'pl' }}">
              {{ expense.date | date:'shortDate':'':'pl' }}
              </span>
            </td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef> Akcje</th>
            <td mat-cell *matCellDef="let expense">
              <button mat-icon-button color="primary"
                      (click)="editExpense(expense, group)"
                      matTooltip="Edytuj wydatek">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button color="warn"
                      (click)="deleteExpense(expense)"
                      matTooltip="Skasuj wydatek">
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns;"></tr>
        </table>

        <mat-divider class="expense-group-divider"/>
      }
    } @else {
      <p>Ładowanie wydatków</p>
    }
  `
})
export class MyExpensesComponent implements OnInit {
  currentUserId: number = 0;
  expensesByGroup = signal<Map<Group, Expense[]>>(new Map());
  expensesByGroupKeys = signal<Group[]>([]);
  columns = ['description', 'amount', 'date', 'actions'];
  private expenseService = inject(ExpenseService);
  private authService = inject(AuthService);

  constructor(
    private snackBar: MatSnackBar,
    private dialog: MatDialog) {
  }

  ngOnInit(): void {
    this.currentUserId = this.authService.getLoggedUser()?.id!;
    if (this.currentUserId) {
      this.loadExpenses();
    } else {
      console.warn("ngOnInit: No current user ID found.");
    }
  }

  deleteExpense(expense: Expense) {
    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, {
      width: '400px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.expenseService.deleteExpense(expense.id).subscribe({
          next: () => {
            this.loadExpenses();
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

  editExpense(expense: Expense, group: Group) {
    const dialogRef = this.dialog.open(AddExpenseDialogComponent, {
      width: '70%',
      data: {
        group: group,
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
            console.error(error);
            this.snackBar.open('Error updating expense', 'Close', {
              duration: 3000
            });
          }
        });
      }
    });
  }

  private loadExpenses() {
    this.expenseService.getExpenseForUser(this.currentUserId).subscribe({
      next: (groupExpensesList: GroupExpenses[]) => {

        const newMap = new Map<Group, Expense[]>();
        const groupKeys: Group[] = [];

        if (groupExpensesList && groupExpensesList.length > 0) {
          groupExpensesList.forEach(item => {
            const group = item.group;
            const expenses = item.expenses;

            if (group && expenses) {
              const processedExpenses = expenses.map(expense => ({
                ...expense,
                date: new Date(expense.date)
              }));

              newMap.set(group, processedExpenses);
              groupKeys.push(group);
            } else {
              console.warn("Item in groupExpensesList is missing group or expenses property:", item);
            }
          });
        } else {
          console.warn("API returned empty or null groupExpensesList:", groupExpensesList);
        }

        this.expensesByGroup.set(newMap);
        this.expensesByGroupKeys.set(groupKeys);
      },
      error: (error: any) => { // <--- 'error' property
        console.error("Error fetching expenses:", error);
      },
    });
  }
}

