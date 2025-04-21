import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {Expense} from '../models/expense.model';

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

  constructor(private http: HttpClient) {
  }

  getExpensesByGroup(groupId: number): Observable<Expense[]> {
    return this.http.get<Expense[]>(`${this.apiUrl}/group/${groupId}`);
  }

  createExpense(expense: CreateExpenseDto): Observable<Expense> {
    return this.http.post<Expense>(this.apiUrl, expense);
  }

  updateExpense(id: number, expense: CreateExpenseDto): Observable<Expense> {
    return this.http.put<Expense>(`${this.apiUrl}/${id}`, expense);
  }

  deleteExpense(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
