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
import {DEFAULT_CATEGORY, enumValueToCategory} from '../../../core/models/expense-category.model';
import {BreakpointObserver, Breakpoints} from '@angular/cdk/layout';
import {map} from 'rxjs/operators';
import {Observable} from 'rxjs';

@Component({
  selector: 'app-my-expenses',
  standalone: true,
  imports: [CommonModule, MatTableModule, RouterLink, MatIconModule, MatIconButton, MatTooltipModule, MatDividerModule],
  styles: [`
    .green-icon {
      color: green;
    }

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

    .expense-table .mat-column-category {
      width: 120px;
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
      width: 128px;
      text-align: center;
    }

    @media (max-width: 600px) {

      ::ng-deep .mdc-data-table__cell {
        padding: 0 4px;
      }

      ::ng-deep .mdc-data-table__header-cell {
        padding: 0 4px;
      }

      .expense-table .mat-column-category {
        display: none;
      }

      .expense-table .mat-column-actions {
        width: 110px;
      }

      .expense-table .mat-column-date {
        width: 84px;
      }

      .expense-table .mat-column-amount {
        width: 84px;
      }
    }`],
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
                  <mat-icon matTooltip="Uregulowane" class="paid-icon green-icon">check_circle</mat-icon>
                } @else {
                  <mat-icon matTooltip="Nieuregulowane" color="warn" class="paid-icon">cancel</mat-icon>
                }
                </span>
            </td>
          </ng-container>
          <ng-container matColumnDef="category">
            <th mat-header-cell *matHeaderCellDef>Kategoria</th>
            <td mat-cell *matCellDef="let expense">
              @if (expense.category) {
                <span class="cell category-cell">
        <mat-icon [matTooltip]="expense.category.mainCategory + ' - ' + expense.category.subCategory">
          {{ expense.category.icon }}
        </mat-icon>
        <span class="category-name">{{ expense.category.subCategory }}</span>
      </span>
              } @else {
                <span class="cell category-cell">
        <mat-icon matTooltip="Bez kategorii">category</mat-icon>
        <span class="category-name">Ogólne</span>
      </span>
              }
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
      <p>{{ msg }}</p>
    }
  `
})
export class MyExpensesComponent implements OnInit {
  currentUserId = 0;
  expensesByGroup = signal<Map<Group, Expense[]>>(new Map());
  expensesByGroupKeys = signal<Group[]>([]);
  columns = ['description', 'category', 'amount', 'date', 'actions'];
  msg = 'Ładowanie wydatków...';
  private expenseService = inject(ExpenseService);
  private authService = inject(AuthService);
  isMobile$: Observable<boolean>;

  constructor(
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private breakpointObserver: BreakpointObserver
  ) {
    this.isMobile$ = this.breakpointObserver.observe(Breakpoints.Handset)
      .pipe(map(result => result.matches));
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
    this.isMobile$.subscribe(isMobile => {
      const dialogConfig = {
        data: {
          group: group,
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
              const processedExpenses = expenses.map(expense => {
                // Convert backend category enum to frontend category object if it's a string
                const category = typeof expense.category === 'string'
                  ? enumValueToCategory(expense.category as string)
                  : expense.category || DEFAULT_CATEGORY;

                return {
                  ...expense,
                  date: new Date(expense.date),
                  category: category
                };
              });

              newMap.set(group, processedExpenses);
              groupKeys.push(group);
            } else {
              this.msg = 'Nie ma żadnych wydatków 😥';
            }
          });
        } else {
          this.msg = 'Nie ma żadnych wydatków 😥';
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

