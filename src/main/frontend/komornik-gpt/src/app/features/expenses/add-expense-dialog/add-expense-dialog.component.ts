import {Component, Inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {DateAdapter, MatNativeDateModule} from '@angular/material/core';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {Group} from '../../../core/models/group.model';
import {Currency} from '../../../core/models/currency.model';
import {Expense} from '../../../core/models/expense.model';
import {DATE_PROVIDERS} from '../../../core/config/date.config';

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
    MatNativeDateModule,
    MatIconModule,
    MatTooltipModule
  ],
  providers: [
    MatDatepickerModule,
    MatNativeDateModule,
    ...DATE_PROVIDERS
  ],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <h2 mat-dialog-title>Add Expense</h2>
        <button mat-icon-button mat-dialog-close class="close-button">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <form [formGroup]="expenseForm" (ngSubmit)="onSubmit()">
        <mat-dialog-content>
          <div class="form-field">
            <mat-form-field appearance="outline">
              <mat-label>Description</mat-label>
              <input matInput formControlName="description" required>
              @if (expenseForm.get('description')?.hasError('required')) {
                <mat-error>Description is required</mat-error>
              }
            </mat-form-field>
          </div>

          <div class="form-row">
            <div class="form-field amount-field">
              <mat-form-field appearance="outline">
                <mat-label>Amount</mat-label>
                <input matInput type="number" formControlName="amount" required min="0">
                @if (expenseForm.get('amount')?.hasError('required')) {
                  <mat-error>Amount is required</mat-error>
                }
                @if (expenseForm.get('amount')?.hasError('min')) {
                  <mat-error>Amount must be greater than 0</mat-error>
                }
              </mat-form-field>
            </div>

            <div class="form-field currency-field">
              <mat-form-field appearance="outline">
                <mat-label>Currency</mat-label>
                <mat-select formControlName="currency" required>
                  @for (currency of currencies; track currency) {
                    <mat-option [value]="currency">
                      {{ currency }}
                    </mat-option>
                  }
                </mat-select>
                @if (expenseForm.get('currency')?.hasError('required')) {
                  <mat-error>Currency is required</mat-error>
                }
              </mat-form-field>
            </div>
          </div>

          <div class="form-row">
            <div class="form-field flex-1">
              <mat-form-field appearance="outline">
                <mat-label>Date</mat-label>
                <input matInput [matDatepicker]="picker" formControlName="date" required>
                <mat-hint>DD/MM/YYYY</mat-hint>
                <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
                <mat-datepicker #picker></mat-datepicker>
                @if (expenseForm.get('date')?.hasError('required')) {
                  <mat-error>Date is required</mat-error>
                }
              </mat-form-field>
            </div>

            <div class="form-field flex-1">
              <mat-form-field appearance="outline">
                <mat-label>Paid By</mat-label>
                <mat-select formControlName="payerId" required>
                  @for (member of data.group.members; track member.id) {
                    <mat-option [value]="member.id">
                      {{ member.name }}
                    </mat-option>
                  }
                </mat-select>
                @if (expenseForm.get('payerId')?.hasError('required')) {
                  <mat-error>Payer is required</mat-error>
                }
              </mat-form-field>
            </div>
          </div>

          <div class="form-field splits-section">
            <div class="splits-header">
              <h3>Split between</h3>
              <button type="button"
                      mat-stroked-button
                      color="primary"
                      (click)="splitEqually()"
                      matTooltip="Split the amount equally between all members">
                <mat-icon>balance</mat-icon>
                Split Equally
              </button>
            </div>

            <div class="total-info" *ngIf="totalSplitAmount > 0">
              <span [class.error]="!isSplitValid">
                Total split: {{totalSplitAmount | number:'1.2-2'}}
                <span *ngIf="expenseForm.get('amount')?.value">
                  of {{expenseForm.get('amount')?.value | number:'1.2-2'}}
                  ({{getSplitPercentage() | number:'1.0-0'}}%)
                </span>
              </span>
            </div>

            <div formArrayName="splits" class="splits-container">
              @for (member of data.group.members; track member.id) {
                <mat-form-field appearance="outline" class="full-width mb-2">
                  <mat-label>{{ member.name }}'s share</mat-label>
                  <input matInput
                         type="number"
                         [formControlName]="member.id.toString()"
                         required
                         step="0.01"
                         min="0"
                         (input)="updateTotalSplit()">
                  <mat-icon matSuffix>person_outline</mat-icon>
                  <mat-error *ngIf="getSplitControl(member.id.toString())?.hasError('required')">
                    Share amount is required
                  </mat-error>
                  <mat-error *ngIf="getSplitControl(member.id.toString())?.hasError('min')">
                    Share amount must be greater than or equal to 0
                  </mat-error>
                </mat-form-field>
              }
            </div>
          </div>
        </mat-dialog-content>

        <mat-dialog-actions align="end">
          <button mat-button mat-dialog-close type="button">
            <mat-icon>close</mat-icon>
            Cancel
          </button>
          <button mat-raised-button
                  color="primary"
                  type="submit"
                  [disabled]="!expenseForm.valid || !isSplitValid">
            <mat-icon>add_circle</mat-icon>
            Add Expense
          </button>
        </mat-dialog-actions>
      </form>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    :host ::ng-deep .mat-mdc-dialog-container {
      max-height: 90vh;
    }

    .dialog-container {
      padding: 24px;
      max-height: 90vh;
      box-sizing: border-box;
    }

    form {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .form-field {
      margin-bottom: 16px;
    }

    .full-width {
      width: 100%;
    }

    mat-dialog-content {
      display: block;
      min-width: 400px;
      margin: 0;
      padding: 0;
      max-height: calc(90vh - 140px) !important;
      overflow-y: auto;
    }

    mat-dialog-actions {
      padding: 16px 0 0 0;
      margin: 0;
      min-height: 52px;
      border-top: 1px solid rgba(0, 0, 0, 0.12);
    }

    mat-dialog-actions button {
      margin-left: 8px;
    }

    .form-row {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
    }

    .amount-field {
      flex: 2;
    }

    .currency-field {
      flex: 1;
    }

    .flex-1 {
      flex: 1;
    }

    .splits-section {
      margin: 24px 0;
      background-color: rgba(0, 0, 0, 0.02);
      border-radius: 4px;
      padding: 24px;
    }

    .splits-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      flex-wrap: wrap;
      gap: 8px;
    }

    .splits-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }

    .total-info {
      margin: 16px 0;
      padding: 12px;
      background-color: rgba(0, 0, 0, 0.05);
      border-radius: 4px;
      font-size: 14px;
    }

    .total-info .error {
      color: #f44336;
    }

    h2 {
      margin: 0 0 24px 0;
      font-size: 20px;
      font-weight: 500;
    }

    h3 {
      margin: 0 0 16px 0;
      font-weight: 500;
    }

    .mb-2 {
      margin-bottom: 8px;
    }

    /* Custom scrollbar styles */
    mat-dialog-content::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }

    mat-dialog-content::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 4px;
    }

    mat-dialog-content::-webkit-scrollbar-thumb {
      background: #888;
      border-radius: 4px;
    }

    mat-dialog-content::-webkit-scrollbar-thumb:hover {
      background: #666;
    }

    @media (max-width: 600px) {
      .dialog-container {
        padding: 16px;
      }

      mat-dialog-content {
        min-width: unset;
        width: 100%;
        max-height: calc(90vh - 120px) !important;
      }

      .form-row {
        flex-direction: column;
        gap: 0;
      }

      .amount-field,
      .currency-field,
      .flex-1 {
        width: 100%;
      }

      .splits-section {
        margin: 16px 0;
        padding: 16px;
      }

      .splits-container {
        grid-template-columns: 1fr;
      }

      h2 {
        margin: 0 0 16px 0;
      }
    }

    /* Material field customizations */
    ::ng-deep {
      .mat-mdc-form-field-subscript-wrapper {
        height: 16px !important;
      }

      .mat-mdc-form-field {
        width: 100%;
      }

      .mat-mdc-dialog-content {
        overflow: hidden !important;
      }

      .mat-mdc-dialog-container {
        overflow: hidden;
      }

      .mat-mdc-dialog-surface {
        overflow: hidden;
      }
    }
  `]
})
export class AddExpenseDialogComponent {
  expenseForm!: FormGroup;
  currencies = Object.values(Currency);
  totalSplitAmount = 0;
  isSplitValid = false;
  isEditMode = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AddExpenseDialogComponent>,
    private dateAdapter: DateAdapter<Date>,
    @Inject(MAT_DIALOG_DATA) public data: {
      group: Group;
      expense?: Expense;
      isEdit?: boolean;
    }
  ) {
    this.isEditMode = !!data.isEdit;
    this.dateAdapter.setLocale('pl');
    this.initForm();

    if (this.isEditMode && data.expense) {
      this.populateForm(data.expense);
    }

    // Listen to amount changes to validate splits
    this.expenseForm.get('amount')?.valueChanges.subscribe(() => {
      this.updateTotalSplit();
    });
  }

  private initForm() {
    this.expenseForm = this.fb.group({
      description: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(0)]],
      currency: [Currency.PLN, Validators.required],
      date: [new Date(), Validators.required],
      payerId: ['', Validators.required],
      splits: this.fb.group({})
    });

    // Initialize split controls
    const splitsGroup = this.expenseForm.get('splits') as FormGroup;
    this.data.group.members.forEach(member => {
      splitsGroup.addControl(
        member.id.toString(),
        this.fb.control('', [Validators.required, Validators.min(0)])
      );
    });
  }

  private populateForm(expense: Expense) {
    this.expenseForm.patchValue({
      description: expense.description,
      amount: expense.amount,
      currency: expense.currency,
      date: new Date(expense.date),
      payerId: expense.payer.id
    });

    // Populate splits
    const splitsGroup = this.expenseForm.get('splits') as FormGroup;
    expense.splits.forEach(split => {
      splitsGroup.get(split.user.id.toString())?.setValue(split.amountOwed);
    });

    this.updateTotalSplit();
  }

  getSplitControl(memberId: string) {
    return (this.expenseForm.get('splits') as FormGroup).get(memberId);
  }

  updateTotalSplit() {
    const splits = this.expenseForm.get('splits')?.value;
    if (!splits) return;

    this.totalSplitAmount = Object.values(splits)
      .reduce((sum: number, value: any) => sum + (parseFloat(value) || 0), 0);

    const totalAmount = parseFloat(this.expenseForm.get('amount')?.value) || 0;
    this.isSplitValid = Math.abs(this.totalSplitAmount - totalAmount) < 0.01;
  }

  getSplitPercentage(): number {
    const totalAmount = parseFloat(this.expenseForm.get('amount')?.value) || 0;
    if (totalAmount === 0) return 0;
    return (this.totalSplitAmount / totalAmount) * 100;
  }

  splitEqually() {
    const totalAmount = parseFloat(this.expenseForm.get('amount')?.value);
    if (!totalAmount) {
      return;
    }

    const memberCount = this.data.group.members.length;
    const equalShare = +(totalAmount / memberCount).toFixed(2);
    const remainder = +(totalAmount - (equalShare * memberCount)).toFixed(2);

    const splitsGroup = this.expenseForm.get('splits') as FormGroup;
    this.data.group.members.forEach((member, index) => {
      // Add remainder to the first person's share
      const share = index === 0 ? equalShare + remainder : equalShare;
      splitsGroup.get(member.id.toString())?.setValue(share);
    });

    this.updateTotalSplit();
  }

  onSubmit() {
    if (this.expenseForm.valid && this.isSplitValid) {
      const formValue = this.expenseForm.value;
      const splits = Object.entries(formValue.splits).map(([userId, amountOwed]) => ({
        userId: parseInt(userId),
        amountOwed: parseFloat(amountOwed as string)
      }));

      const expenseData = {
        description: formValue.description,
        amount: parseFloat(formValue.amount),
        currency: formValue.currency,
        date: formValue.date.toISOString(),
        payerId: parseInt(formValue.payerId),
        groupId: this.data.group.id,
        splits
      };

      this.dialogRef.close(expenseData);
    }
  }
}
