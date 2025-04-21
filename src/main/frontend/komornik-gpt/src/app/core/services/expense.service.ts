import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';

export interface ExpenseSplitDto {
  userId: number;
  amountOwed: number;
}

export interface ExpenseDto {
  id?: number;
  payerId: number;
  amount: number;
  description: string;
  date: string;
  groupId: number;
  splits: ExpenseSplitDto[];
}

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  private apiUrl = '/api/expenses';

  constructor(private http: HttpClient) {
  }

  getExpensesByGroup(groupId: number): Observable<ExpenseDto[]> {
    return this.http.get<ExpenseDto[]>(`${this.apiUrl}/group/${groupId}`);
  }

  createExpense(expense: ExpenseDto): Observable<ExpenseDto> {
    return this.http.post<ExpenseDto>(this.apiUrl, expense);
  }

  updateExpense(id: number, expense: ExpenseDto): Observable<ExpenseDto> {
    return this.http.put<ExpenseDto>(`${this.apiUrl}/${id}`, expense);
  }

  deleteExpense(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
