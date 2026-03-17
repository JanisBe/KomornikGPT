import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {CreateExpenseDto, Expense, GroupedExpenses, SettlementDto} from '../models/expense.model';
import {tap} from 'rxjs/operators';
import {NotificationService} from './notification.service';
import {GroupExpenses} from '../models/group.model';
import {DEFAULT_CATEGORY, enumValueToCategory} from '../models/expense-category.model';

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  private readonly apiUrl = `${environment.apiUrl}/expenses`;
  private http = inject(HttpClient);
  private notificationService = inject(NotificationService);

  getExpensesByGroup(groupId: number, viewToken?: string | null): Observable<Expense[]> {
    let url = `${this.apiUrl}/group/${groupId}`;
    if (viewToken) {
      url += '?viewToken=' + viewToken;
    }
    return this.http.get<Expense[]>(url);
  }

  hasUnpaidExpenses(groupId: number): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/group/${groupId}/has-unpaid`);
  }

  createExpense(expense: CreateExpenseDto): Observable<Expense> {
    return this.http.post<Expense & { message: string }>(`${this.apiUrl}`, expense).pipe(
      tap((response) => {
        if (response.message) {
          this.notificationService.showInfo(response.message);
        }
      })
    );
  }

  recalculateExpense(groupId: number): Observable<SettlementDto[]> {
    return this.http.get<SettlementDto[]>(
      `${environment.apiUrl}/expenses/groups/${groupId}/settlement`,
      {
        params: {
          recalculate: true,
        }
      }
    )
  }

  calculateExpense(groupId: number): Observable<SettlementDto[]> {
    return this.http.get<SettlementDto[]>(
      `${environment.apiUrl}/expenses/groups/${groupId}/settlement`
    )
  }

  settleExpense(groupId: number): Observable<any> {
    return this.http.post(`${environment.apiUrl}/expenses/groups/${groupId}/settle`, {})
  }

  updateExpense(id: number, expense: CreateExpenseDto): Observable<Expense> {
    return this.http.put<Expense>(`${this.apiUrl}/${id}`, expense).pipe(
      tap(() => {
        this.notificationService.showInfo('Wydatek został zaktualizowany');
      })
    );
  }

  deleteExpense(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getExpenseForUser(userId: number): Observable<GroupExpenses[]> {
    return this.http.get<GroupExpenses[]>(`${this.apiUrl}/user/${userId}`);
  }

  canUserBeDeletedFromGroup(groupId: number, userId: number): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/groups/${groupId}/user/${userId}/can-be-deleted`);
  }

  groupExpensesByDay(expenses: Expense[]): GroupedExpenses[] {
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

  normalizeExpenseCategories(expenses: any[]): any[] {
    return expenses.map(expense => {
      const category = typeof expense.category === 'string'
        ? enumValueToCategory(expense.category as string)
        : expense.category || DEFAULT_CATEGORY;

      return {
        ...expense,
        category: category
      };
    });
  }
}
