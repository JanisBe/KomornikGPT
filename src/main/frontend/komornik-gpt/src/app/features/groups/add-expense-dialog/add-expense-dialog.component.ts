import {Component, Inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatNativeDateModule} from '@angular/material/core';
import {Group} from '../../../core/models/group.model';
import {User} from '../../../core/models/user.model';

@Component({
  selector: 'app-add-expense-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  template: `
    <div class="dialog-container">
      <h2 mat-dialog-title>Add Expense</h2>
      <form [formGroup]="expenseForm" (ngSubmit)="onSubmit()">
        <mat-dialog-content>
          <div class="form-field">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Description</mat-label>
              <input matInput formControlName="description" required>
              <mat-error *ngIf="expenseForm.get('description')?.hasError('required')">
                Description is required
              </mat-error>
            </mat-form-field>
          </div>

          <div class="form-field">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Amount</mat-label>
              <input matInput type="number" formControlName="amount" required>
              <mat-error *ngIf="expenseForm.get('amount')?.hasError('required')">
                Amount is required
              </mat-error>
              <mat-error *ngIf="expenseForm.get('amount')?.hasError('min')">
                Amount must be greater than 0
              </mat-error>
            </mat-form-field>
          </div>

          <div class="form-field">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Date</mat-label>
              <input matInput [matDatepicker]="picker" formControlName="date" required>
              <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
              <mat-datepicker #picker></mat-datepicker>
              <mat-error *ngIf="expenseForm.get('date')?.hasError('required')">
                Date is required
              </mat-error>
            </mat-form-field>
          </div>

          <div class="form-field">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Paid by</mat-label>
              <mat-select formControlName="payerId" required>
                <mat-option *ngFor="let user of data.group.users" [value]="user.id">
                  {{ user.name }}
                </mat-option>
              </mat-select>
              <mat-error *ngIf="expenseForm.get('payerId')?.hasError('required')">
                Payer is required
              </mat-error>
            </mat-form-field>
          </div>

          <div class="form-field">
            <h3>Split between</h3>
            <div formArrayName="splits">
              @for (user of data.group.users; track user) {
                <mat-form-field appearance="outline" class="full-width mb-2">
                  <mat-label>{{ user.name }}'s share</mat-label>
                  <input matInput type="number" [formControlName]="user.id.toString()" required>
                  <mat-error *ngIf="getSplitControl(user.id.toString())?.hasError('required')">
                    Share amount is required
                  </mat-error>
                  <mat-error *ngIf="getSplitControl(user.id.toString())?.hasError('min')">
                    Share amount must be greater than or equal to 0
                  </mat-error>
                </mat-form-field>
              }
            </div>
          </div>
        </mat-dialog-content>

        <mat-dialog-actions align="end">
          <button mat-button mat-dialog-close>Cancel</button>
          <button mat-raised-button color="primary" type="submit" [disabled]="!expenseForm.valid">
            Add Expense
          </button>
        </mat-dialog-actions>
      </form>
    </div>
  `,
  styles: [`
    .dialog-container {
      padding: 24px;
    }

    .form-field {
      margin-bottom: 16px;
    }

    .full-width {
      width: 100%;
    }

    mat-dialog-content {
      min-width: 400px;
    }

    mat-dialog-actions {
      padding: 16px 0 0 0;
      margin-bottom: 0;
    }

    mat-dialog-actions button {
      margin-left: 8px;
    }

    h3 {
      margin: 16px 0;
      font-weight: 500;
    }

    .mb-2 {
      margin-bottom: 8px;
    }
  `]
})
export class AddExpenseDialogComponent {
  expenseForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<AddExpenseDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { group: Group; currentUser: User }
  ) {
    this.expenseForm = this.fb.group({
      description: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      date: [new Date(), Validators.required],
      payerId: [data.currentUser.id, Validators.required],
      splits: this.fb.group(
        Object.fromEntries(
          data.group.users.map(user => [
            user.id.toString(),
            [0, [Validators.required, Validators.min(0)]]
          ])
        )
      )
    });
  }

  getSplitControl(userId: string) {
    return this.expenseForm.get('splits')?.get(userId);
  }

  onSubmit(): void {
    if (this.expenseForm.valid) {
      const formValue = this.expenseForm.value;
      const splits = Object.entries(formValue.splits).map(([userId, amountOwed]) => ({
        userId: parseInt(userId),
        amountOwed: parseFloat(amountOwed as string)
      }));

      this.dialogRef.close({
        description: formValue.description,
        amount: parseFloat(formValue.amount),
        date: formValue.date.toISOString(),
        payerId: formValue.payerId,
        groupId: this.data.group.id,
        splits
      });
    }
  }
}
