import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatTableModule} from '@angular/material/table';
import {MatButtonModule, MatIconButton} from '@angular/material/button';
import {ExpenseService} from '../../../core/services/expense.service';
import {AuthService} from '../../../core/services/auth.service';
import {Expense} from '../../../core/models/expense.model';
import {Group, GroupExpenses} from '../../../core/models/group.model';
import {RouterLink} from '@angular/router';
import {ConfirmDeleteDialogComponent} from '../view-expenses-dialog/confirm-delete-dialog.component';
import {AddExpenseDialogComponent} from '../add-expense-dialog/add-expense-dialog.component';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatDialog} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatDividerModule} from '@angular/material/divider';
import {DEFAULT_CATEGORY, enumValueToCategory} from '../../../core/models/expense-category.model';
import {BreakpointObserver, Breakpoints} from '@angular/cdk/layout';
import {map} from 'rxjs/operators';
import {Observable} from 'rxjs';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-my-expenses',
  standalone: true,
  imports: [CommonModule, MatTableModule, RouterLink, MatIconModule, MatIconButton, MatTooltipModule, MatDividerModule, MatButtonModule],
  styles: [`
    .export-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding: 16px 0;
    }

    .export-header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 500;
    }

    .export-header button {
      display: flex;
      align-items: center;
      gap: 8px;
    }

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

      .export-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
      }

      .export-header button {
        width: 100%;
        justify-content: center;
      }
    }`],
  template: `
    @if (expensesByGroupKeys().length > 0) {
      <div class="export-header">
        <h1>Moje wydatki</h1>
        <button mat-raised-button color="accent" (click)="exportToExcel()"
                [disabled]="expensesByGroupKeys().length === 0"
                matTooltip="Eksportuj wszystkie wydatki do Excel (.xlsx)">
          <mat-icon>table_chart</mat-icon>
          Eksportuj do Excela
        </button>
      </div>
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

  exportToExcel(): void {
    try {
      // Przygotuj dane w formacie dla SheetJS
      const worksheetData = this.prepareWorksheetData();

      // Utwórz workbook i worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

      // Ustaw szerokości kolumn
      const columnWidths = [
        {wch: 25}, // Grupa
        {wch: 12}, // Data
        {wch: 30}, // Opis
        {wch: 25}, // Kategoria
        {wch: 10}, // Kwota
        {wch: 8},  // Waluta
        {wch: 12}  // Uregulowane
      ];
      worksheet['!cols'] = columnWidths;

      // Dodaj formatowanie nagłówków
      const headerRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:G1');
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
      const dataRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:G1');
      for (let row = 1; row <= dataRange.e.r; row++) {
        const amountCell = XLSX.utils.encode_cell({r: row, c: 4}); // Kolumna kwoty
        if (worksheet[amountCell]) {
          worksheet[amountCell].t = 'n'; // number type
          worksheet[amountCell].z = '#,##0.00'; // format liczby
        }
      }

      // Dodaj worksheet do workbook
      const sheetName = 'Moje wydatki';
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

      // Generuj nazwę pliku
      const fileName = `moje_wydatki_${new Date().toISOString().split('T')[0]}.xlsx`;

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
    const headers = ['Grupa', 'Data', 'Opis', 'Kategoria', 'Kwota', 'Waluta', 'Uregulowane'];

    // Zbierz wszystkie wydatki z wszystkich grup
    const allExpenses: { group: Group, expense: Expense }[] = [];

    this.expensesByGroupKeys().forEach(group => {
      const expenses = this.expensesByGroup().get(group) || [];
      expenses.forEach(expense => {
        allExpenses.push({group, expense});
      });
    });

    // Sortuj chronologicznie (najnowsze pierwsze)
    allExpenses.sort((a, b) =>
      new Date(b.expense.date).getTime() - new Date(a.expense.date).getTime()
    );

    // Przygotuj wiersze danych
    const rows = allExpenses.map(({group, expense}) => [
      group.name,
      new Date(expense.date).toLocaleDateString('pl-PL'),
      expense.description,
      `${expense.category?.mainCategory || 'Bez Kategorii'} - ${expense.category?.subCategory || 'Ogólne'}`,
      expense.amount,
      expense.currency,
      expense.isPaid ? 'Tak' : 'Nie'
    ]);

    return [headers, ...rows];
  }
}

