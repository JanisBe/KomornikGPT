import {Component, ElementRef, Inject, ViewChild} from '@angular/core';
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
import {AuthService} from '../../../core/services/auth.service';
import {
  categoryToEnumValue,
  DEFAULT_CATEGORY,
  ENTERTAINMENT,
  EXPENSE_CATEGORIES,
  ExpenseCategory,
  FOOD_DRINKS,
  HOME,
  LIFE,
  NO_CATEGORY
} from '../../../core/models/expense-category.model';

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
        @if (this.isEditMode) {
          <h2 mat-dialog-title>Edytuj wydatek dla "{{ data.expense?.description }}"</h2>
        } @else {
          <h2 mat-dialog-title>Dodaj wydatek</h2>
        }
        <button mat-icon-button mat-dialog-close class="close-button">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <form [formGroup]="expenseForm" (ngSubmit)="onSubmit()">
        <mat-dialog-content>
          <div class="form-row">
            <div class="category-selector" #categorySelector>
              <div class="category-icon-container" (mouseenter)="openMainMenu()">
                <mat-icon class="category-main-icon">{{ selectedCategoryIcon }}</mat-icon>

                @if (showMainCategories) {
                  <div class="category-dropdown" (mouseleave)="closeMenus()">
                    <div class="category-list">
                      @for (mainCategory of getMainCategories(); track mainCategory) {
                        <div class="category-item"
                             (mouseenter)="showSubcategories(mainCategory)"
                             [class.active]="selectedCategory.mainCategory === mainCategory">
                          <mat-icon>{{ getMainCategoryIcon(mainCategory) }}</mat-icon>
                          <span>{{ mainCategory }}</span>
                        </div>
                      }
                    </div>
                    <!-- Subcategories dropdown -->
                    @if (activeMainCategory && showSubcategoriesMenu) {
                      <div class="subcategory-dropdown">
                        <div class="category-list">
                          @for (subcategory of getSubcategoriesFor(
                            activeMainCategory); track subcategory.subCategory) {
                            <div class="category-item"
                                 (click)="selectCategory(subcategory)"
                                 [class.active]="isSelectedCategory(subcategory)">
                              <mat-icon>{{ subcategory.icon }}</mat-icon>
                              <span>{{ subcategory.subCategory }}</span>
                            </div>
                          }
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
              <div class="selected-category-name">{{ selectedCategoryName }}</div>
            </div>
            <div class="form-field flex-1">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Nazwa wydatku</mat-label>
                <input matInput formControlName="description" required placeholder="Nazwa wydatku"/>
                <mat-icon matSuffix>description</mat-icon>
                @if (expenseForm.get('description')?.errors?.['required']) {
                  <mat-error>Nazwa wydatku jest wymagana</mat-error>
                }
              </mat-form-field>
            </div>
          </div>

          <div class="form-row">
            <div class="form-field amount-field">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Kwota</mat-label>
                <input
                  (input)="splitEqually()"
                  matInput
                  type="number"
                  formControlName="amount"
                  required
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
                <mat-icon matSuffix>payments</mat-icon>
                @if (expenseForm.get('amount')?.errors?.['required']) {
                  <mat-error>Kwota jest wymagana</mat-error>
                }
                @if (expenseForm.get('amount')?.errors?.['min']) {
                  <mat-error>Kwota musi być większa niż 0</mat-error>
                }
              </mat-form-field>
            </div>

            <div class="form-field currency-field">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Waluta</mat-label>
                <mat-select formControlName="currency" required>
                  @for (currency of currencies; track currency) {
                    <mat-option [value]="currency">{{ currency }}</mat-option>
                  }
                </mat-select>
                <mat-icon matSuffix>currency_exchange</mat-icon>
                @if (expenseForm.get('currency')?.errors?.['required']) {
                  <mat-error>Waluta jest wymagana</mat-error>
                }
              </mat-form-field>
            </div>
          </div>

          <div class="form-row">
            <div class="form-field flex-1">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Data</mat-label>
                <input matInput [matDatepicker]="picker" formControlName="date" required/>
                <mat-hint>DD/MM/YYYY</mat-hint>
                <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
                <mat-datepicker #picker></mat-datepicker>
                @if (expenseForm.get('date')?.errors?.['required']) {
                  <mat-error>Data jest wymagana</mat-error>
                }
              </mat-form-field>
            </div>

            <div class="form-field flex-1">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Kto zapłaci</mat-label>
                <mat-select formControlName="payerId" required>
                  @for (member of data.group.members; track member.id) {
                    <mat-option [value]="member.id">{{ member.username }}</mat-option>
                  }
                </mat-select>
                <mat-icon matSuffix>person</mat-icon>
                @if (expenseForm.get('payerId')?.errors?.['required']) {
                  <mat-error>Płatnik jest wymagany</mat-error>
                }
              </mat-form-field>
            </div>
          </div>
          <div class="form-field splits-section">
            <div class="splits-header">
              <h3>Rozdziel pomiędzy</h3>
              <button
                type="button"
                mat-stroked-button
                color="primary"
                (click)="splitEqually()"
                [disabled]="!expenseForm.get('amount')?.value || expenseForm.get('amount')?.invalid"
                matTooltip="Rozdziel po równo pomiędzy wszystkich"
              >
                <mat-icon>balance</mat-icon>
                Rozdziel po równo
              </button>
            </div>

            @if (totalSplitAmount > 0) {
              <div class="total-info">
                  <span [class.error]="!isSplitValid">
                    W sumie: {{ totalSplitAmount | number: '1.2-2' }}
                    @if (expenseForm.get('amount')?.value) {
                      z {{ expenseForm.get('amount')?.value | number: '1.2-2' }}
                      ({{ getSplitPercentage() | number: '1.0-0' }}%)
                    }
                  </span>
              </div>
            }

            <div formArrayName="splits" class="splits-container">
              @for (member of data.group.members; track member.id) {
                <mat-form-field appearance="outline" class="full-width mb-2">
                  <mat-label>{{ member.name }} - udział</mat-label>
                  <input
                    matInput
                    type="number"
                    [formControlName]="member.id.toString()"
                    required
                    step="0.01"
                    min="0"
                    (input)="updateTotalSplit()"
                  />
                  <mat-icon matSuffix>person_outline</mat-icon>
                  @if (getSplitControl(member.id.toString())?.errors?.['required']) {
                    <mat-error>Kwota wymagana</mat-error>
                  }
                  @if (getSplitControl(member.id.toString())?.errors?.['min']) {
                    <mat-error>Kwota musi być większa niż lub równa 0</mat-error>
                  }
                </mat-form-field>
              }
            </div>
          </div>
        </mat-dialog-content>

        <mat-dialog-actions align="end">
          <button mat-button mat-dialog-close type="button">
            <mat-icon>close</mat-icon>
            Anuluj
          </button>
          <button mat-raised-button
                  color="primary"
                  type="submit"
                  [disabled]="!expenseForm.valid || !isSplitValid">
            <mat-icon>add_circle</mat-icon>
            @if (this.isEditMode) {
              Zapisz wydatek
            } @else {
              Dodaj wydatek
            }
          </button>
        </mat-dialog-actions>
      </form>
    </div>
  `,
  styles: [`
    :host {
      display: block;
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

    .dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px;
    }

    .close-button {
      margin-left: auto;
    }

    /* Category selector styles */
    .category-selector {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 80px;
      position: relative;
    }

    .category-icon-container {
      position: relative;
      cursor: pointer;
    }

    .category-main-icon {
      font-size: 50px;
      width: 50px;
      height: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #1976d2;
    }

    .selected-category-name {
      font-size: 12px;
      text-align: center;
      margin-top: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 80px;
    }

    .category-dropdown {
      position: absolute;
      top: 60px;
      left: 0;
      width: 250px;
      background: white;
      border-radius: 4px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
      z-index: 1000;
      display: flex;
      padding: 8px 0;
    }

    .subcategory-dropdown {
      position: absolute;
      top: 0;
      left: 250px;
      width: 250px;
      background: white;
      border-radius: 4px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
      z-index: 1001;
    }

    .category-list {
      width: 100%;
      max-height: 300px;
      overflow-y: auto;
    }

    .category-item {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      cursor: pointer;
      height: 50px;
      box-sizing: border-box;
    }

    .category-item:hover {
      background-color: rgba(0, 0, 0, 0.04);
    }

    .category-item.active {
      background-color: rgba(25, 118, 210, 0.1);
    }

    .category-item mat-icon {
      margin-right: 12px;
      color: #1976d2;
    }

    .category-item span {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
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

  `]
})
export class AddExpenseDialogComponent {
  expenseForm!: FormGroup;
  currencies = Object.values(Currency);
  totalSplitAmount = 0;
  isSplitValid = false;
  isEditMode = false;
  group!: Group;
  expense?: Expense;
  isEdit?: boolean;
  selectedCategory: ExpenseCategory = DEFAULT_CATEGORY;
  showMainCategories = false;
  showSubcategoriesMenu = false;
  activeMainCategory: string | null = null;
  @ViewChild('categorySelector') categorySelector!: ElementRef;

  get selectedCategoryName(): string {
    return `${this.selectedCategory.mainCategory} - ${this.selectedCategory.subCategory}`;
  }

  get selectedCategoryIcon(): string {
    return this.selectedCategory.icon;
  }

  getMainCategories(): string[] {
    return [HOME, ENTERTAINMENT, LIFE, FOOD_DRINKS, NO_CATEGORY];
  }

  getMainCategoryIcon(mainCategory: string): string {
    const subcategories = this.getSubcategoriesFor(mainCategory);
    return subcategories.length > 0 ? subcategories[0].icon : 'category';
  }

  getSubcategoriesFor(mainCategory: string): ExpenseCategory[] {
    return EXPENSE_CATEGORIES.filter(cat => cat.mainCategory === mainCategory);
  }

  showSubcategories(mainCategory: string): void {
    this.activeMainCategory = mainCategory;
    this.showSubcategoriesMenu = true;
  }

  openMainMenu(): void {
    this.showMainCategories = true;
  }

  closeMenus(): void {
    setTimeout(() => {
      this.showMainCategories = false;
      this.showSubcategoriesMenu = false;
      this.activeMainCategory = null;
    }, 300);
  }

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AddExpenseDialogComponent>,
    private dateAdapter: DateAdapter<Date>,
    private authService: AuthService,
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
      this.populateForm(data.expense, data.group.defaultCurrency);
    }

    this.expenseForm.get('amount')?.valueChanges.subscribe(() => {
      this.updateTotalSplit();
    });
  }

  updateTotalSplit() {
    const splits = this.expenseForm.get('splits')?.value;
    if (!splits) return;

    this.totalSplitAmount = +Object.values(splits)
      .reduce((sum: number, value: any) => sum + (parseFloat(value) || 0), 0)
      .toFixed(2);

    const totalAmount = parseFloat(this.expenseForm.get('amount')?.value) || 0;
    this.isSplitValid = Math.abs(this.totalSplitAmount - totalAmount) < 0.01;
  }

  onSubmit() {
    if (this.expenseForm.valid && this.isSplitValid) {
      const formValue = this.expenseForm.value;
      const splits = Object.entries(formValue.splits).map(([userId, amountOwed]) => ({
        userId: parseInt(userId),
        amountOwed: parseFloat(amountOwed as string)
      }));

      const categoryEnumValue = categoryToEnumValue(this.selectedCategory);

      const expenseData = {
        description: formValue.description,
        amount: parseFloat(formValue.amount),
        currency: formValue.currency,
        date: formValue.date.toISOString(),
        payerId: parseInt(formValue.payerId),
        groupId: this.data.group.id,
        splits,
        category: categoryEnumValue
      };

      this.dialogRef.close(expenseData);
    }
  }

  getSplitControl(memberId: string) {
    return (this.expenseForm.get('splits') as FormGroup).get(memberId);
  }

  getSplitPercentage(): number {
    const totalAmount = parseFloat(this.expenseForm.get('amount')?.value) || 0;
    if (totalAmount === 0) return 0;
    return +((this.totalSplitAmount / totalAmount) * 100).toFixed(0);
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
      let share = equalShare;
      if (index === 0) {
        share = +(equalShare + remainder).toFixed(2);
      }
      splitsGroup.get(member.id.toString())?.setValue(share);
    });

    this.updateTotalSplit();
  }

  isSelectedCategory(category: ExpenseCategory): boolean {
    return this.selectedCategory.mainCategory === category.mainCategory &&
      this.selectedCategory.subCategory === category.subCategory;
  }

  selectCategory(category: ExpenseCategory): void {
    this.selectedCategory = category;
    this.closeMenus();
  }

  private populateForm(expense: Expense, defaultCurrency: Currency | undefined) {
    this.expenseForm.patchValue({
      description: expense.description,
      amount: expense.amount,
      currency: defaultCurrency,
      date: new Date(expense.date),
      payerId: expense.payer.id
    });

    const splitsGroup = this.expenseForm.get('splits') as FormGroup;
    expense.splits.forEach(split => {
      splitsGroup.get(split.user.id.toString())?.setValue(split.amountOwed);
    });

    if (expense.category) {
      this.selectedCategory = expense.category;
    }

    this.updateTotalSplit();
  }

  private initForm() {
    let currentUserId: number | null = null;
    const currentUser = this.authService['currentUserSubject']?.value;
    if (currentUser && this.data.group.members.some(m => m.id === currentUser.id)) {
      currentUserId = currentUser.id;
    }
    this.expenseForm = this.fb.group({
      description: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(0)]],
      currency: [this.data.group.defaultCurrency || Currency.PLN, Validators.required],
      date: [new Date(), Validators.required],
      payerId: [currentUserId !== null ? currentUserId : '', Validators.required],
      splits: this.fb.group({}),
      category: ['']
    });

    const splitsGroup = this.expenseForm.get('splits') as FormGroup;
    this.data.group.members.forEach(member => {
      splitsGroup.addControl(
        member.id.toString(),
        this.fb.control('', [Validators.required, Validators.min(0)])
      );
    });
  }

}
