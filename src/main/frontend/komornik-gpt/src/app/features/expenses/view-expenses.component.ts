import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatSnackBar, MatSnackBarModule} from '@angular/material/snack-bar';
import {Group} from '../../core/models/group.model';
import {Expense} from '../../core/models/expense.model';
import {ExpenseService} from '../../core/services/expense.service';
import {DEFAULT_CATEGORY, enumValueToCategory} from '../../core/models/expense-category.model';
import {CopyUrlButtonComponent} from './copy-url-button';
import {ActivatedRoute, Router} from '@angular/router';
import {GroupService} from '../../core/services/group.service';
import {MatProgressSpinner} from '@angular/material/progress-spinner';

interface GroupedExpenses {
  date: Date;
  expenses: Expense[];
}

@Component({
  selector: 'app-view-expenses',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSnackBarModule,
    CopyUrlButtonComponent,
    MatProgressSpinner
  ],
  template: `
    <div class="container">
      @if (group) {
        <div class="header">
          <copy-url-button [groupId]="group.id" [viewToken]="group.viewToken"></copy-url-button>
          <h2>Wydatki dla {{ group.name }}</h2>
        </div>
      }
      <div class="expenses-content">
        @if (loading) {
          <div class="text-center mt-4">
            <mat-spinner></mat-spinner>
          </div>
        } @else {
          @for (group of groupedExpenses; track group.date) {
            <div class="date-group">
              <div class="date-header">
                {{ group.date | date:'shortDate':'':'pl' }}
              </div>
              <div class="table-wrapper">
                <table class="expenses-table">
                  <thead>
                  <tr>
                    <th>Opis</th>
                    <th>Kategoria</th>
                    <th>Kwota</th>
                    <th>Płacił</th>
                    <th>Kto</th>
                  </tr>
                  </thead>
                  <tbody>
                  @for (expense of group.expenses; track expense.id) {
                    <tr class="expense-row">
                      <td data-label="Opis">
                        <span [matTooltip]="expense.date | date:'medium':'':'pl'" matTooltipPosition="above">
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
                      <td data-label="Kwota">{{ expense.amount | number:'1.2-2' }} {{ expense.currency }}</td>
                      <td data-label="Płacił"><span matTooltip="{{expense.payer.email}}">{{ expense.payer.name }}</span>
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
                    </tr>
                  }
                  </tbody>
                </table>
              </div>
            </div>
          }
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
      margin-bottom: 24px;
      background: white;
      flex-shrink: 0;
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
      border-collapse: collapse;
      margin-bottom: 24px;
    }

    .expenses-table thead {
      position: sticky;
      top: 48px; /* Height of date header */
      z-index: 2;
    }

    .expenses-table th {
      background: white;
      padding: 12px;
      text-align: left;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.87);
      border-bottom: 1px solid rgba(0, 0, 0, 0.12);
      white-space: nowrap;
    }

    .expenses-table td {
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
      height: 48px;
      box-sizing: border-box;
      display: flex;
      align-items: center;
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

    .split-item.owner {
      font-weight: bold;
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

    .expenses-table tr:hover {
      background: rgba(0, 0, 0, 0.04);
    }

    @media (max-width: 768px) {
      .expenses-table, .expenses-table thead, .expenses-table tbody, .expenses-table th, .expenses-table td, .expenses-table tr {
        display: block;
      }

      .expenses-table thead {
        display: none;
      }

      .expenses-table tr {
        margin-bottom: 15px;
        border: 1px solid #ddd;
        border-radius: 4px;
      }

      .expenses-table td {
        border: none;
        border-bottom: 1px solid #eee;
        position: relative;
        padding-left: 120px; /* Adjusted padding to accommodate label */
        text-align: right;
      }

      .expenses-table td:last-child {
        border-bottom: 0;
      }

      .expenses-table td:before {
        position: absolute;
        left: 6px;
        width: 110px; /* Fixed width for the label */
        content: attr(data-label);
        font-weight: bold;
        text-align: left;
        white-space: nowrap;
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
        padding-bottom: 5px;
      }

      .split-item {
        white-space: nowrap;
        flex-shrink: 0;
      }

      /* Specific style for the td containing splits */
      td[data-label="Kto"] {
        text-align: left;
        /* No flex properties here, .splits-container handles it */
      }
    }
  `]
})
export class ViewExpensesComponent implements OnInit {
  expenses: Expense[] = [];
  groupedExpenses: GroupedExpenses[] = [];
  group: Group | null = null;
  loading = true;

  constructor(
    private expenseService: ExpenseService,
    private snackBar: MatSnackBar,
    private route: ActivatedRoute,
    private groupService: GroupService,
    private router: Router,
  ) {
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    const viewToken = this.route.snapshot.queryParamMap.get('token');
    if (!id) {
      this.router.navigate(['/groups']);
      return;
    }
    this.groupService.getGroup(+id, viewToken).subscribe({
        next: (group) => {
          this.group = group;
          this.loadExpenses();
        },
        error: (error) => {
          console.error(error);
          this.snackBar.open('Error loading group', 'Close', {
            duration: 3000
          });
          this.router.navigate(['/groups']);
        }
      }
    )
  }

  loadExpenses() {
    if (!this.group) {
      return;
    }
    this.expenseService.getExpensesByGroup(this.group.id).subscribe({
      next: (expenses) => {
        this.expenses = expenses.map(expense => {
          const category = typeof expense.category === 'string'
            ? enumValueToCategory(expense.category as string)
            : expense.category || DEFAULT_CATEGORY;

          return {
            ...expense,
            category: category
          };
        });
        this.groupedExpenses = this.groupExpensesByDay(this.expenses);
        this.loading = false;
      },
      error: (error) => {
        console.error(error);
        this.snackBar.open('Error loading expenses', 'Close', {
          duration: 3000
        });
        this.loading = false;
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
}
