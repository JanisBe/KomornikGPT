import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {Expense} from '../models/expense.model';
import {tap} from 'rxjs/operators';
import {MatSnackBar} from '@angular/material/snack-bar';
import {GroupExpenses} from '../models/group.model';

export interface ExpenseSplitDto {
  userId: number;
  amountOwed: number;
}

export interface CreateExpenseDto {
  description: string;
  amount: number;
  date: string;
  payerId: number;
  groupId: number;
  splits: ExpenseSplitDto[];
}

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

  createExpense(expense: CreateExpenseDto): Observable<Expense> {
    return this.http.post<Expense & { message: string }>(`${this.apiUrl}`, expense).pipe(
      tap((response) => {
        if (response.message) {
          this.snackBar.open(response.message, 'Close', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
          });
        }
      })
    );
  }

  updateExpense(id: number, expense: CreateExpenseDto): Observable<Expense> {
    return this.http.put<Expense>(`${this.apiUrl}/${id}`, expense).pipe(
      tap(() => {
        this.snackBar.open('Expense updated successfully', 'Close', {
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
