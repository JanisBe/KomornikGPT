import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {Group} from '../../core/models/group.model';
import {Expense, GroupedExpenses} from '../../core/models/expense.model';
import {ExpenseService} from '../../core/services/expense.service';
import {CopyUrlButtonComponent} from './copy-url-button';
import {ActivatedRoute, Router} from '@angular/router';
import {GroupService} from '../../core/services/group.service';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {AddExpenseDialogComponent} from './add-expense-dialog/add-expense-dialog.component';
import {AuthService} from '../../core/services/auth.service';
import {User} from '../../core/models/user.model';
import {ExcelExportService} from '../../core/services/excel-export.service';
import {NotificationService} from '../../core/services/notification.service';
import {Currency, CurrencyDetails} from '../../core/models/currency.model';


@Component({
  selector: 'app-view-expenses',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatDialogModule,
    CopyUrlButtonComponent,
    MatProgressSpinner
  ],
  template: `
    <div class="container">
      @if (group) {
        <div class="header">
          <copy-url-button [groupId]="group.id" [viewToken]="group.viewToken"
                           [groupName]="group.name"></copy-url-button>
          <h2>Wydatki dla {{ group.name }}</h2>
          <div class="export-buttons">
            <button mat-raised-button color="accent" (click)="exportToExcel()"
                    [disabled]="loading() || expenses.length === 0"
                    matTooltip="Eksportuj do Excel (.xlsx)">
              <mat-icon>table_view</mat-icon>
              Eksportuj do Excela
            </button>
          </div>
        </div>
      }
      <div class="expenses-content">
        @if (loading()) {
          <div class="text-center mt-4">
            <mat-spinner></mat-spinner>
          </div>
        } @else {
          <div class="table-wrapper">
            <table class="expenses-table">
              <thead>
              <tr>
                <th>Opis</th>
                <th>Kategoria</th>
                <th>Kwota</th>
                <th>Płacił</th>
                <th>Kto</th>
                @if (currentUser?.authenticated) {
                  <th>Akcje</th>
                }
              </tr>
              </thead>
              <tbody>
              @for (group of groupedExpenses; track group.date) {
                <tr class="date-header-row">
                  <td [attr.colspan]="currentUser?.authenticated ? 6 : 5">
                    {{ group.date | date:'shortDate':'':'pl' }}
                  </td>
                </tr>
                @for (expense of group.expenses; track expense.id) {
                  <tr class="expense-row">
                    <td data-label="Opis">
                    <span [class.expense-description]="currentUser"
                          [class.expense-description-readonly]="!currentUser"
                          (click)="currentUser?.authenticated ? editExpense(expense) : null"
                          [matTooltip]="expense.date | date:'medium':'':'pl'"
                          matTooltipPosition="above">
                      {{ expense.description | slice:0:30 }}
                    </span>
                      @if (expense.isPaid) {
                        <mat-icon matTooltip="Uregulowane" class="paid-icon green-icon">check_circle</mat-icon>
                      } @else {
                        <mat-icon matTooltip="Nieuregulowane" color="warn" class="paid-icon">cancel</mat-icon>
                      }
                    </td>
                    <td data-label="Kategoria">
                      <div class="category-cell">
                        <mat-icon
                          [matTooltip]="(expense.category?.mainCategory || 'Bez Kategorii') + ' - ' + (expense.category?.subCategory || 'Ogólne')">
                          {{ expense.category?.icon || 'category' }}
                        </mat-icon>
                        <span class="category-name">{{ expense.category?.subCategory || 'Ogólne' }}</span>
                      </div>
                    </td>
                    <td data-label="Kwota">{{ expense.amount | number:'1.2-2' }} {{ getCurrencySymbol(expense.currency) }}</td>
                    <td data-label="Płacił"><span
                      matTooltip="{{expense.payer.email}}">{{ expense.payer.name }}</span>
                    </td>
                    <td data-label="Kto">
                      <div class="splits-container">
                        @for (split of expense.splits; track split.id) {
                          <div class="split-item" [class.paid]="split.isPaid"
                               [class.owner]="split.user.id === expense.payer.id">
                          <span
                            matTooltip="{{split.user.email}}">{{ split.user.name }}</span>:
                            <span>{{ split.amountOwed | number:'1.2-2' }}</span>
                          </div>
                        }
                      </div>
                    </td>
                    @if (currentUser?.authenticated) {
                      <td data-label="Akcje" class="actions-cell">
                        <button mat-icon-button
                                class="delete-button"
                                (click)="deleteExpense(expense)"
                                matTooltip="Usuń wydatek"
                                color="warn">
                          <mat-icon>delete</mat-icon>
                        </button>
                      </td>
                    }
                  </tr>
                }
              }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .container {
      padding: 24px;
      height: 85vh;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
    }

    .header {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      margin-bottom: 24px;
      background: var(--mat-sys-surface);
      flex-shrink: 0;
      gap: 16px;
      color: var(--mat-sys-on-surface);
    }

    .export-buttons {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .export-buttons button {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .expenses-content {
      overflow-y: auto;
      flex-grow: 1;
    }

    h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 500;
    }

    .table-wrapper {
      position: relative;
      margin: 0;
      padding: 0;
    }

    .expenses-table {
      width: 100%;
      border-collapse: separate; /* Required for sticky headers in some browsers */
      border-spacing: 0;
      margin-bottom: 24px;
      table-layout: fixed;
    }

    .expenses-table thead {
      position: sticky;
      top: 0;
      z-index: 3;
    }

    .expenses-table th {
      background: var(--mat-sys-surface-container-low);
      padding: 12px 8px;
      text-align: left;
      font-weight: 500;
      color: var(--mat-sys-on-surface);
      border-bottom: 2px solid var(--mat-sys-outline, rgba(128,128,128,0.8));
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      height: 48px;
      box-sizing: border-box;
    }

    /* Column widths for desktop */
    .expenses-table th:nth-child(1), .expenses-table td:nth-child(1) { width: 30%; } /* Opis */
    .expenses-table th:nth-child(2), .expenses-table td:nth-child(2) { width: 15%; } /* Kategoria */
    .expenses-table th:nth-child(3), .expenses-table td:nth-child(3) { width: 15%; } /* Kwota */
    .expenses-table th:nth-child(4), .expenses-table td:nth-child(4) { width: 15%; } /* Płacił */
    .expenses-table th:nth-child(5), .expenses-table td:nth-child(5) { width: 20%; } /* Kto */
    .expenses-table th:nth-child(6), .expenses-table td:nth-child(6) { width: 5%; }  /* Akcje */

    .expenses-table td {
      padding: 12px 8px;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
      color: var(--mat-sys-on-surface);
      vertical-align: middle;
      word-wrap: break-word;
    }

    .date-group {
      margin-bottom: 32px;
    }

    .date-header-row td {
      background: var(--mat-sys-surface-container-high);
      color: var(--mat-sys-on-surface);
      padding: 12px 16px;
      font-size: 16px;
      font-weight: 500;
      position: sticky !important;
      top: 47px; /* Slight overlap to prevent gaps */
      z-index: 10;
      height: 48px;
      border-bottom: 2px solid var(--mat-sys-outline, rgba(128,128,128,0.5)) !important;
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
      font-size: 0.85em;
      color: var(--mat-sys-on-surface-variant);
      line-height: 1.2;
    }

    .split-item.paid {
      color: var(--mat-sys-secondary, #4caf50);
    }

    .split-item.owner {
      font-weight: bold;
    }

    .paid-icon {
      font-size: 18px;
      height: 18px;
      width: 18px;
      vertical-align: middle;
      margin-left: 4px;
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
      font-size: 0.9em;
    }

    .expenses-table td {
      padding: 12px 8px;
      border-bottom: 1px solid var(--mat-sys-outline-variant, rgba(128,128,128,0.3)) !important;
      color: var(--mat-sys-on-surface);
      vertical-align: middle;
      word-wrap: break-word;
    }

    .expenses-table tr:hover {
      background: var(--mat-sys-surface-container-low);
    }

    .actions-cell {
      width: 60px;
      text-align: center;
    }

    .delete-button {
      /* Removed opacity 0 to ensure icons are always visible and easier to find */
      transition: transform 0.2s ease-in-out;
    }

    .expense-row:hover .delete-button {
      transform: scale(1.1);
    }

    .expense-description {
      cursor: pointer;
      color: var(--mat-sys-primary);
      text-decoration: underline;
    }

    .expense-description:hover {
      opacity: 0.8;
    }

    .expense-description-readonly {
      cursor: default;
      color: inherit;
      text-decoration: none;
    }

    @media (max-width: 768px) {
      .container {
        padding: 0;
      }

      .header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
        padding: 16px;
      }

      .export-buttons {
        width: 100%;
        justify-content: center;
      }

      .expenses-table, .expenses-table thead, .expenses-table tbody, .expenses-table th, .expenses-table td, .expenses-table tr {
        display: block;
      }

      .expenses-table thead {
        display: none;
      }

      .expenses-table tr {
        margin-bottom: 16px;
        border: 1px solid var(--mat-sys-outline-variant);
        border-radius: 8px;
        background: var(--mat-sys-surface-container-lowest);
      }

      .expenses-table td {
        border: none;
        border-bottom: 1px solid var(--mat-sys-outline-variant);
        position: relative;
        padding-left: 120px;
        text-align: right;
        color: var(--mat-sys-on-surface);
      }

      .expenses-table td:last-child {
        border-bottom: 0;
      }

      .expenses-table td:before {
        position: absolute;
        left: 12px;
        width: 100px;
        content: attr(data-label);
        font-weight: 500;
        text-align: left;
        color: var(--mat-sys-on-surface-variant);
      }

      .category-cell {
        justify-content: flex-end;
      }

      .category-cell mat-icon {
        margin-right: 8px;
      }

      .splits-container {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 8px;
        overflow-x: auto;
        white-space: nowrap;
        width: 100%;
        padding-top: 5px;
      }

      .split-item {
        white-space: nowrap;
        flex-shrink: 0;
      }

      td[data-label="Kto"] {
        text-align: left;
        padding-left: 8px !important;
      }

      td[data-label="Akcje"] {
        text-align: right;
        padding-left: 8px !important;
        padding-right: 16px !important;
        display: flex;
        justify-content: flex-end;
        align-items: center;
      }

      td[data-label="Akcje"]:before {
        display: none; /* Hide the "Akcje" label on mobile */
      }

      .delete-button {
        opacity: 1 !important; /* Always visible on mobile */
        margin-left: auto;
      }
    }
  `]
})
export class ViewExpensesComponent implements OnInit {
  expenses: Expense[] = [];
  groupedExpenses: GroupedExpenses[] = [];
  group: Group | null = null;
  loading = signal(true);
  currentUser: User | null = null;
  viewToken: string | null = null;

  private expenseService = inject(ExpenseService);
  private notificationService = inject(NotificationService);
  private route = inject(ActivatedRoute);
  private groupService = inject(GroupService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private authService = inject(AuthService);
  private excelExportService = inject(ExcelExportService);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.viewToken = this.route.snapshot.queryParamMap.get('token');
    if (!id) {
      this.router.navigate(['/groups']);
      return;
    }
    this.authService.getCurrentUserOrNull().subscribe(user => {
      this.currentUser = user;
    });

    this.groupService.getGroup(+id, this.viewToken).subscribe({
        next: (group) => {
          this.group = group;
          this.loadExpenses();
        },
        error: (error) => {
          console.error(error);
          this.notificationService.showError('Error loading group');
          this.router.navigate(['/groups']);
        }
      }
    )
  }

  loadExpenses() {
    if (!this.group) {
      this.loading.set(false);
      return;
    }
    this.expenseService.getExpensesByGroup(this.group.id, this.viewToken).subscribe({
      next: (expenses) => {
        this.expenses = this.expenseService.normalizeExpenseCategories(expenses);
        this.groupedExpenses = this.expenseService.groupExpensesByDay(this.expenses);
        this.loading.set(false);
      },
      error: (error) => {
        console.error(error);
        this.notificationService.showError('Error loading expenses');
        this.loading.set(false);
      }
    });
  }

  editExpense(expense: Expense): void {
    if (!this.group) return;

    const dialogRef = this.dialog.open(AddExpenseDialogComponent, {
      width: '800px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      data: {
        group: this.group,
        expense: expense,
        isEdit: true,
        currentUser: this.currentUser
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (result.deleted) {
          // Expense was deleted, just reload the list
          this.loadExpenses();
        } else {
          // Expense was updated
          this.expenseService.updateExpense(expense.id, result).subscribe({
            next: () => {
              this.notificationService.showSuccess('Wydatek został zaktualizowany');
              this.loadExpenses();
            },
            error: (error) => {
              console.error(error);
              this.notificationService.showError('Błąd podczas aktualizacji wydatku');
            }
          });
        }
      }
    });
  }

  deleteExpense(expense: Expense): void {
    const confirmed = confirm(`Czy na pewno chcesz usunąć wydatek "${expense.description}"?`);

    if (confirmed) {
      this.expenseService.deleteExpense(expense.id).subscribe({
        next: () => {
          this.notificationService.showSuccess('Wydatek został usunięty');
          this.loadExpenses();
        },
        error: (error) => {
          console.error(error);
          this.notificationService.showError('Błąd podczas usuwania wydatku');
        }
      });
    }
  }

  exportToExcel(): void {
    if (!this.group) return;
    this.excelExportService.exportExpensesToExcel(this.expenses, this.group.name);
  }

  getCurrencySymbol(code: Currency | undefined): string {
    if (!code) return '';
    return CurrencyDetails[code]?.symbol || code;
  }
}
