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
import {MatDialog} from '@angular/material/dialog';
import {AddExpenseDialogComponent} from './add-expense-dialog/add-expense-dialog.component';
import {AuthService} from '../../core/services/auth.service';
import {User} from '../../core/models/user.model';
import * as XLSX from 'xlsx';

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
          <copy-url-button [groupId]="group.id" [viewToken]="group.viewToken"
                           [groupName]="group.name"></copy-url-button>
          <h2>Wydatki dla {{ group.name }}</h2>
          <div class="export-buttons">
            <button mat-raised-button color="accent" (click)="exportToExcel()"
                    [disabled]="loading || expenses.length === 0"
                    matTooltip="Eksportuj do Excel (.xlsx)">
              <mat-icon>table_view</mat-icon>
              Eksportuj do Excela
            </button>
          </div>
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
                        <td data-label="Kwota">{{ expense.amount | number:'1.2-2' }} {{ expense.currency }}</td>
                        <td data-label="Płacił"><span
                          matTooltip="{{expense.payer.email}}">{{ expense.payer.name }}</span>
                        </td>
                        <td data-label="Kto"><br>
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
      justify-content: space-between;
      margin-bottom: 24px;
      background: white;
      flex-shrink: 0;
      gap: 16px;
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

    .expense-description {
      cursor: pointer;
      color: #1976d2;
      text-decoration: underline;
    }

    .expense-description:hover {
      color: #1565c0;
    }

    .expense-description-readonly {
      cursor: default;
      color: inherit;
      text-decoration: none;
    }

    @media (max-width: 768px) {
      .container{
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
    }
  `]
})
export class ViewExpensesComponent implements OnInit {
  expenses: Expense[] = [];
  groupedExpenses: GroupedExpenses[] = [];
  group: Group | null = null;
  loading = true;
  currentUser: User | null = null;
  viewToken: string | null = null;
  constructor(
    private expenseService: ExpenseService,
    private snackBar: MatSnackBar,
    private route: ActivatedRoute,
    private groupService: GroupService,
    private router: Router,
    private dialog: MatDialog,
    private authService: AuthService
  ) {
  }

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
    this.expenseService.getExpensesByGroup(this.group.id, this.viewToken).subscribe({
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
              this.snackBar.open('Wydatek został zaktualizowany', 'Zamknij', {
                duration: 3000
              });
              this.loadExpenses();
            },
            error: (error) => {
              console.error(error);
              this.snackBar.open('Błąd podczas aktualizacji wydatku', 'Zamknij', {
                duration: 3000
              });
            }
          });
        }
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

  exportToExcel(): void {
    try {
      // Przygotuj dane w formacie dla SheetJS
      const worksheetData = this.prepareWorksheetData();

      // Utwórz workbook i worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

      // Ustaw szerokości kolumn
      worksheet['!cols'] = [
        {wch: 12}, // Data
        {wch: 30}, // Opis
        {wch: 25}, // Kategoria
        {wch: 10}, // Kwota
        {wch: 8},  // Waluta
        {wch: 20}, // Płacił
        {wch: 40}, // Uczestnicy
        {wch: 12}  // Uregulowane
      ];

      // Dodaj formatowanie nagłówków
      const headerRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:H1');
      for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({r: 0, c: col});
        if (!worksheet[cellAddress]) continue;

        worksheet[cellAddress].s = {
          font: {bold: true, color: {rgb: "FFFFFF"}},
          fill: {fgColor: {rgb: "1976D2"}},
          alignment: {horizontal: "center", vertical: "center"}
        };
      }

      // Formatuj kolumnę z kwotami jako liczby
      const dataRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:H1');
      for (let row = 1; row <= dataRange.e.r; row++) {
        const amountCell = XLSX.utils.encode_cell({r: row, c: 3}); // Kolumna kwoty
        if (worksheet[amountCell]) {
          worksheet[amountCell].t = 'n'; // number type
          worksheet[amountCell].z = '#,##0.00'; // format liczby
        }
      }

      // Dodaj worksheet do workbook
      const sheetName = `Wydatki ${this.group?.name || 'Grupa'}`;
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

      // Generuj nazwę pliku
      const fileName = `wydatki_${this.group?.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'grupa'}_${new Date().toISOString().split('T')[0]}.xlsx`;

      // Zapisz plik
      XLSX.writeFile(workbook, fileName);

      this.snackBar.open('Plik Excel został pobrany', 'Zamknij', {
        duration: 3000
      });
    } catch (error) {
      console.error('Błąd podczas eksportu do Excel:', error);
      this.snackBar.open('Błąd podczas eksportu do Excel', 'Zamknij', {
        duration: 5000
      });
    }
  }

  private prepareWorksheetData(): any[][] {
    // Nagłówki
    const headers = ['Data', 'Opis', 'Kategoria', 'Kwota', 'Waluta', 'Płacił', 'Uczestnicy', 'Uregulowane'];

    // Dane - sortowane chronologicznie (najnowsze pierwsze)
    const sortedExpenses = [...this.expenses].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const rows = sortedExpenses.map(expense => [
      new Date(expense.date).toLocaleDateString('pl-PL'),
      expense.description,
      `${expense.category?.mainCategory || 'Bez Kategorii'} - ${expense.category?.subCategory || 'Ogólne'}`,
      expense.amount,
      expense.currency,
      expense.payer.name,
      expense.splits.map(split => `${split.user.name}: ${split.amountOwed.toFixed(2)} ${expense.currency}`).join('\n'),
      expense.isPaid ? 'Tak' : 'Nie'
    ]);

    return [headers, ...rows];
  }
}
