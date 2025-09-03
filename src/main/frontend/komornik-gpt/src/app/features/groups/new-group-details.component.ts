import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import {GroupService} from '../../core/services/group.service';
import {Group} from '../../core/models/group.model';
import {MatCardModule} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatListModule} from '@angular/material/list';
import {AuthService} from '../../core/services/auth.service';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatDialog} from '@angular/material/dialog';
import {MatMenuModule} from '@angular/material/menu';
import {SettleExpensesDialogComponent} from '../expenses/settle-expenses-dialog';
import {AddExpenseDialogComponent} from '../expenses/add-expense-dialog/add-expense-dialog.component';
import {HttpErrorResponse} from '@angular/common/http';
import {ExpenseService} from '../../core/services/expense.service';
import {User} from '../../core/models/user.model';
import {MatSnackBar} from '@angular/material/snack-bar';
import {EditGroupDialogComponent} from './edit-group-dialog/edit-group-dialog.component';
import {DeleteGroupDialogComponent} from './delete-group-dialog/delete-group-dialog.component';
import {BreakpointObserver, Breakpoints} from '@angular/cdk/layout';
import {map} from 'rxjs/operators';
import {Observable} from 'rxjs';
import {Expense} from '../../core/models/expense.model';
import {DEFAULT_CATEGORY, enumValueToCategory} from '../../core/models/expense-category.model';
import {MatTabsModule} from '@angular/material/tabs';
import {CommonModule} from '@angular/common';
import {CopyUrlButtonComponent} from '../expenses/copy-url-button';
import * as XLSX from 'xlsx';

interface GroupedExpenses {
  date: Date;
  expenses: Expense[];
}

@Component({
  selector: 'app-group-details',
  standalone: true,
  imports: [RouterModule, MatCardModule, MatIconModule, MatButtonModule, MatListModule, MatProgressSpinner, MatTooltipModule, MatMenuModule, MatTabsModule, CommonModule, CopyUrlButtonComponent],
  template: `
    @if (group; as g) {
      <div class="container">
        <!-- Header Card -->
        <mat-card class="header-card">
          <mat-card-header>
            <mat-card-title>
              <div class="header-content">
                <div class="title-section">
                  <div class="title-with-copy">
                    <h1>{{ g.name }}</h1>
                    <copy-url-button [groupId]="g.id" [viewToken]="g.viewToken" [groupName]="g.name"></copy-url-button>
                  </div>
                  @if (g.description) {
                    <p class="description">{{ g.description }}</p>
                  }
                </div>
                <div class="action-section">
                  <div class="action-buttons">
                    <button mat-raised-button color="primary" (click)="addExpense(group)" matTooltip="Dodaj wydatek">
                      <mat-icon>add</mat-icon>
                      Dodaj wydatek
                    </button>
                    <button mat-raised-button color="accent" (click)="settleExpenses(group)"
                            matTooltip="Rozlicz wydatki">
                      <mat-icon>payments</mat-icon>
                      Rozlicz
                    </button>
                    <button mat-raised-button (click)="exportToExcel()"
                            [disabled]="expensesLoading || expenses.length === 0"
                            matTooltip="Eksportuj wydatki do Excel (.xlsx)"
                            class="export-button">
                      <mat-icon>table_chart</mat-icon>
                      Excel
                    </button>
                  </div>
                  <div class="menu-section">
                    <button mat-icon-button [matMenuTriggerFor]="cardMenu" matTooltip="Więcej opcji">
                      <mat-icon>more_vert</mat-icon>
                    </button>
                    <mat-menu #cardMenu="matMenu" xPosition="before">
                      <button mat-menu-item (click)="editGroup(group)" [disabled]="!canEditGroup(group)">
                        <mat-icon>edit</mat-icon>
                        <span>Edytuj grupę</span>
                      </button>
                      <button mat-menu-item (click)="deleteGroup(group)" [disabled]="!canDeleteGroup(group)">
                        <mat-icon>delete</mat-icon>
                        <span>Usuń grupę</span>
                      </button>
                    </mat-menu>
                  </div>
                </div>
              </div>
            </mat-card-title>
          </mat-card-header>
        </mat-card>

        <!-- Content Tabs -->
        <mat-card class="content-card">
          <mat-tab-group [(selectedIndex)]="selectedTabIndex" class="group-tabs">
            <!-- Members Tab -->

            <!-- Expenses Tab -->
            <mat-tab label="Wydatki">
              <div class="tab-content expenses-tab">
                @if (expensesLoading) {
                  <div class="loading-container">
                    <mat-spinner></mat-spinner>
                    <p>Ładowanie wydatków...</p>
                  </div>
                } @else if (groupedExpenses.length === 0) {
                  <div class="empty-state">
                    <mat-icon>receipt_long</mat-icon>
                    <h3>Brak wydatków</h3>
                    <p>Dodaj pierwszy wydatek do tej grupy</p>
                    <button mat-raised-button color="primary" (click)="addExpense(group)">
                      <mat-icon>add</mat-icon>
                      Dodaj wydatek
                    </button>
                  </div>
                } @else {
                  <div class="expenses-content">
                    @for (expenseGroup of groupedExpenses; track expenseGroup.date) {
                      <div class="date-group">
                        <div class="date-header">
                          {{ expenseGroup.date | date:'shortDate':'':'pl' }}
                        </div>
                        <div class="expenses-list">
                          @for (expense of expenseGroup.expenses; track expense.id) {
                            <div class="expense-item" (click)="currentUser ? editExpense(expense) : null"
                                 [class.clickable]="currentUser">
                              <div class="expense-main">
                                <div class="expense-header">
                                  <div class="expense-category">
                                    <mat-icon
                                      [matTooltip]="(expense.category?.mainCategory || 'Bez Kategorii') + ' - ' + (expense.category?.subCategory || 'Ogólne')">
                                      {{ expense.category?.icon || 'category' }}
                                    </mat-icon>
                                    <span>{{ expense.category?.subCategory || 'Ogólne' }}</span>
                                  </div>
                                  <div class="expense-status">
                                    @if (expense.isPaid) {
                                      <mat-icon matTooltip="Uregulowane" class="status-icon paid">check_circle
                                      </mat-icon>
                                    } @else {
                                      <mat-icon matTooltip="Nieuregulowane" class="status-icon unpaid">cancel</mat-icon>
                                    }
                                  </div>
                                </div>
                                <div class="expense-description">{{ expense.description }}</div>
                                <div class="expense-details">
                                  <div
                                    class="expense-amount">{{ expense.amount | number:'1.2-2' }} {{ expense.currency }}
                                  </div>
                                  <div class="expense-payer">Płacił: {{ expense.payer.name }}</div>
                                </div>
                              </div>
                              <div class="expense-splits">
                                @for (split of expense.splits; track split.id) {
                                  <div class="split-item" [class.paid]="split.isPaid"
                                       [class.owner]="split.user.id === expense.payer.id">
                                    <span class="split-name">{{ split.user.name }}</span>
                                    <span class="split-amount">{{ split.amountOwed | number:'1.2-2' }}</span>
                                  </div>
                                }
                              </div>
                            </div>
                          }
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            </mat-tab>

            <mat-tab label="Członkowie">
              <div class="tab-content">
                <div class="members-grid">
                  @for (member of g.members; track member.id) {
                    <div class="member-card">
                      <mat-icon class="member-icon">person</mat-icon>
                      <div class="member-info">
                        <div class="member-name">{{ member.name }}</div>
                        <div class="member-email">{{ member.email }}</div>
                      </div>
                    </div>
                  }
                </div>
                @if (!g.isPublic && !isAuthenticated) {
                  <div class="warning-message">
                    <mat-icon>warning</mat-icon>
                    <p>Ta grupa jest prywatna. Zaloguj się, aby do niej wejść</p>
                  </div>
                }
              </div>
            </mat-tab>
          </mat-tab-group>
        </mat-card>
      </div>
    }

    @if (loading) {
      <div class="loading-container">
        <mat-spinner></mat-spinner>
        <p>Ładowanie grupy...</p>
      </div>
    }

    @if (error) {
      <div class="error-container">
        <mat-icon>error</mat-icon>
        <p>{{ error }}</p>
      </div>
    }
  `,
  styles: [`
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .header-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .header-card mat-card-title {
      color: white;
    }

    .header-content {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      width: 100%;
      gap: 20px;
    }

    .title-with-copy {
      display: flex;
      gap: 16px;
      margin-bottom: 8px;
      align-items: baseline;
    }

    .title-section h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 500;
    }

    .description {
      margin: 0;
      opacity: 0.9;
      font-size: 16px;
    }

    .action-section {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-shrink: 0;
    }

    .action-buttons {
      display: flex;
      gap: 12px;
    }

    .action-buttons button {
      min-width: 140px;
    }

    .export-button {
      background-color: #4caf50 !important;
      color: white !important;
    }

    .export-button:disabled {
      background-color: #e0e0e0 !important;
      color: #9e9e9e !important;
    }

    .content-card {
      flex: 1;
    }

    .group-tabs {
      min-height: 500px;
    }

    .tab-content {
      padding: 24px;
      min-height: 400px;
    }

    /* Members Tab Styles */
    .members-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .member-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      background: #fafafa;
      transition: all 0.2s ease;
    }

    .member-card:hover {
      background: #f5f5f5;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }

    .member-icon {
      color: #666;
      font-size: 24px;
    }

    .member-name {
      font-weight: 500;
      font-size: 16px;
    }

    .member-email {
      color: #666;
      font-size: 14px;
    }

    .warning-message {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: #fff3cd;
      border: 1px solid #ffeaa7;
      border-radius: 8px;
      color: #856404;
    }

    /* Expenses Tab Styles */
    .expenses-tab {
      padding: 0 !important;
    }

    .loading-container, .empty-state, .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      text-align: center;
    }

    .empty-state mat-icon {
      font-size: 64px;
      height: 64px;
      width: 64px;
      color: #ccc;
      margin-bottom: 16px;
    }

    .empty-state h3 {
      margin: 0 0 8px 0;
      color: #666;
    }

    .empty-state p {
      margin: 0 0 24px 0;
      color: #999;
    }

    .expenses-content {
      padding: 24px;
      max-height: 600px;
      overflow-y: auto;
    }

    .date-group {
      margin-bottom: 32px;
    }

    .menu-section {
      display: flex;
      position: absolute;
      top: 8px;
      right: 8px;
    }

    .date-header {
      background: #f5f5f5;
      padding: 12px 16px;
      font-size: 16px;
      font-weight: 500;
      border-radius: 8px 8px 0 0;
      border-bottom: 2px solid #e0e0e0;
      position: sticky;
      top: 0;
      z-index: 1;
    }

    .expenses-list {
      background: white;
      border-radius: 0 0 8px 8px;
      overflow: hidden;
    }

    .expense-item {
      padding: 16px;
      border-bottom: 1px solid #f0f0f0;
      transition: all 0.2s ease;
    }

    .expense-item:last-child {
      border-bottom: none;
    }

    .expense-item.clickable {
      cursor: pointer;
    }

    .expense-item.clickable:hover {
      background: #f8f9fa;
      transform: translateX(4px);
    }

    .expense-main {
      margin-bottom: 12px;
    }

    .expense-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .expense-category {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: #666;
    }

    .expense-category mat-icon {
      font-size: 18px;
      height: 18px;
      width: 18px;
    }

    .status-icon {
      font-size: 20px;
      height: 20px;
      width: 20px;
    }

    .status-icon.paid {
      color: #4caf50;
    }

    .status-icon.unpaid {
      color: #f44336;
    }

    .expense-description {
      font-size: 18px;
      font-weight: 500;
      margin-bottom: 8px;
      color: #333;
    }

    .expense-details {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 14px;
      color: #666;
    }

    .expense-amount {
      font-weight: 600;
      font-size: 16px;
      color: #333;
    }

    .expense-splits {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      padding-top: 12px;
      border-top: 1px solid #f0f0f0;
    }

    .split-item {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      background: #f8f9fa;
      border-radius: 12px;
      font-size: 12px;
      color: #666;
    }

    .split-item.paid {
      background: #e8f5e8;
      color: #2e7d32;
    }

    .split-item.owner {
      background: #e3f2fd;
      color: #1565c0;
      font-weight: 500;
    }

    .split-name {
      font-weight: 500;
    }

    .split-amount {
      font-weight: 600;
    }

    /* Mobile Responsive */
    @media (max-width: 768px) {
      .container {
        padding: 12px;
        gap: 12px;
      }

      .header-card {
        margin-bottom: 16px;
      }

      .header-card mat-card-header {
        padding-bottom: 24px;
      }

      .header-content {
        flex-direction: column;
        align-items: stretch;
        gap: 16px;
      }

      .action-section {
        flex-direction: column;
        gap: 12px;
        padding-top: 16px;
      }

      .action-buttons {
        justify-content: center;
      }

      .action-buttons button {
        min-width: 120px;
        font-size: 14px;
      }

      .action-buttons .export-button {
        min-width: 100px;
      }

      .title-section h1 {
        font-size: 24px;
      }

      .title-with-copy {
        display: flex;
        flex-direction: row;
        gap: 12px;
        align-items: baseline;
      }

      .members-grid {
        grid-template-columns: 1fr;
      }

      .expense-details {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
      }

      .expense-splits {
        justify-content: flex-start;
      }

      .expenses-content {
        padding: 16px;
        max-height: 500px;
      }
    }

    @media (max-width: 480px) {
      .container {
        padding: 0;
      }

      .header-card {
        margin-bottom: 12px;
      }

      .header-card mat-card-header {
        padding-bottom: 20px;
      }

      .action-section {
        padding-top: 0;
      }

      .action-buttons {
        flex-direction: column;
        width: 100%;
        gap: 8px;
      }

      .action-buttons button {
        width: 100%;
        min-width: unset;
      }
    }
  `]
})
export class NewGroupDetailsComponent implements OnInit {
  group: Group | null = null;
  loading = true;
  error: string | null = null;
  isAuthenticated = false;
  currentUser: User | null = null;
  isMobile$: Observable<boolean>;

  // New properties for expenses
  expenses: Expense[] = [];
  groupedExpenses: GroupedExpenses[] = [];
  expensesLoading = false;
  selectedTabIndex = 0;
  viewToken: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private groupService: GroupService,
    private authService: AuthService,
    private dialog: MatDialog,
    private expenseService: ExpenseService,
    private snackBar: MatSnackBar,
    private router: Router,
    private breakpointObserver: BreakpointObserver
  ) {
    this.isMobile$ = this.breakpointObserver.observe(Breakpoints.Handset)
      .pipe(map(result => result.matches));
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.viewToken = this.route.snapshot.queryParamMap.get('token');

    if (!id) {
      this.error = 'Nieprawidłowy identyfikator grupy';
      this.loading = false;
      return;
    }

    this.authService.getCurrentUserOrNull().subscribe(
      (user) => {
        this.currentUser = user;
        this.isAuthenticated = !!user;
      }
    );

    this.groupService.getGroup(+id, this.viewToken).subscribe({
      next: (group) => {
        this.group = group;
        this.loading = false;
        // Load expenses automatically
        this.loadExpenses();
      },
      error: () => {
        this.error = 'Nie znaleziono grupy lub nie masz dostępu do niej';
        this.loading = false;
      }
    });
  }

  loadExpenses(): void {
    if (!this.group) return;

    this.expensesLoading = true;
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
        this.expensesLoading = false;
      },
      error: (error) => {
        console.error(error);
        this.snackBar.open('Błąd podczas ładowania wydatków', 'Zamknij', {
          duration: 3000
        });
        this.expensesLoading = false;
      }
    });
  }

  editExpense(expense: Expense): void {
    if (!this.group || !this.currentUser) return;

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
          this.loadExpenses();
        } else {
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

  canEditGroup(group: Group): boolean {
    return this.canDeleteGroup(group);
  }

  canDeleteGroup(group: Group): boolean {
    if (!this.currentUser || !group || !group.members) return false;

    const isGroupMember = group.members.some(member => member.id === this.currentUser?.id);
    if (!isGroupMember) return false;

    return group.createdBy?.id === this.currentUser.id;
  }

  settleExpenses(group: Group): void {
    const dialogRef = this.dialog.open(SettleExpensesDialogComponent, {
      width: '600px',
      data: {group}
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('Wydatki zostały rozliczone!', 'Zamknij', {duration: 3000});
        this.loadExpenses(); // Refresh expenses after settlement
      }
    });
  }

  addExpense(group: Group): void {
    this.isMobile$.subscribe(isMobile => {
      const dialogConfig = {
        data: {group, currentUser: this.currentUser},
        width: isMobile ? '100vw' : '800px',
        maxWidth: isMobile ? '100vw' : '90vw',
        height: isMobile ? '100vh' : undefined,
        maxHeight: isMobile ? '100vh' : '90vh',
        panelClass: isMobile ? 'mobile-dialog-container' : undefined
      };

      const dialogRef = this.dialog.open(AddExpenseDialogComponent, dialogConfig);

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.expenseService.createExpense(result).subscribe({
            next: () => {
              this.snackBar.open('Wydatek został dodany', 'Zamknij', {
                duration: 3000
              });
              this.loadExpenses(); // Refresh expenses after adding
            },
            error: (error: HttpErrorResponse) => {
              console.error(error);
              this.snackBar.open('Błąd podczas dodawania wydatku', 'Zamknij', {
                duration: 3000
              });
            }
          });
        }
      });
    });
  }

  editGroup(group: Group): void {
    if (!this.canEditGroup(group)) {
      this.snackBar.open('Możesz tylko edytować swoje grupy', 'Zamknij', {
        duration: 3000
      });
      return;
    }

    this.isMobile$.subscribe(isMobile => {
      const dialogConfig = {
        data: {group, currentUser: this.currentUser},
        width: isMobile ? '100vw' : '800px',
        maxWidth: isMobile ? '100vw' : '90vw',
        height: isMobile ? '100vh' : undefined,
        maxHeight: isMobile ? '100vh' : '90vh',
        panelClass: isMobile ? 'mobile-dialog-container' : undefined
      };

      const dialogRef = this.dialog.open(EditGroupDialogComponent, dialogConfig);

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.groupService.updateGroup(group.id, result).subscribe({
            next: (updatedGroup) => {
              this.group = updatedGroup;
              this.snackBar.open('Grupa została zaktualizowana', 'Zamknij', {
                duration: 3000
              });
            },
            error: (error) => {
              console.error(error);
              this.snackBar.open('Błąd podczas aktualizacji grupy', 'Zamknij', {
                duration: 3000
              });
            }
          });
        }
      });
    });
  }

  deleteGroup(group: Group): void {
    if (!this.canDeleteGroup(group)) {
      this.snackBar.open('Możesz tylko usuwać swoje grupy', 'Zamknij', {
        duration: 3000
      });
      return;
    }

    const dialogRef = this.dialog.open(DeleteGroupDialogComponent, {
      width: '400px',
      data: group
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.groupService.deleteGroup(group.id).subscribe({
          next: () => {
            this.router.navigate(['/groups']);
            this.snackBar.open('Grupa została usunięta', 'Zamknij', {
              duration: 3000
            });
          },
          error: (error: HttpErrorResponse) => {
            console.error(error);
            this.snackBar.open('Błąd podczas usuwania grupy', 'Zamknij', {
              duration: 3000
            });
          }
        });
      }
    });
  }

  exportToExcel(): void {
    if (!this.group || this.expenses.length === 0) {
      this.snackBar.open('Brak wydatków do eksportu', 'Zamknij', {
        duration: 3000
      });
      return;
    }

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
      const sheetName = `Wydatki ${this.group.name}`;
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

      // Generuj nazwę pliku
      const fileName = `wydatki_${this.group.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;

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
