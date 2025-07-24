import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {CreateExpenseDto, Expense, SettlementDto} from '../models/expense.model';
import {tap} from 'rxjs/operators';
import {MatSnackBar} from '@angular/material/snack-bar';
import {GroupExpenses} from '../models/group.model';

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  private readonly apiUrl = `${environment.apiUrl}/expenses`;

  constructor(private http: HttpClient, private snackBar: MatSnackBar) {
  }

  getExpensesByGroup(groupId: number): Observable<Expense[]> {
    return this.http.get<Expense[]>(`${this.apiUrl}/group/${groupId}`);
  }

  hasUnpaidExpenses(groupId: number): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/group/${groupId}/has-unpaid`);
  }

  createExpense(expense: CreateExpenseDto): Observable<Expense> {
    return this.http.post<Expense & { message: string }>(`${this.apiUrl}`, expense).pipe(
      tap((response) => {
        if (response.message) {
          this.snackBar.open(response.message, 'Zamknij', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
          });
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
        this.snackBar.open('Wydatek został zaktualizowany', 'Zamknij', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
        });
      })
    );
  }

  deleteExpense(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getExpenseForUser(userId: number): Observable<GroupExpenses[]> {
    return this.http.get<GroupExpenses[]>(`${this.apiUrl}/user/${userId}`);
  }
}
