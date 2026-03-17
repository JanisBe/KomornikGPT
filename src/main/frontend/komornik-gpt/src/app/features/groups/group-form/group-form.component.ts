import {Component, EventEmitter, inject, Input, OnInit, Output} from '@angular/core';
import {MatDialogModule} from '@angular/material/dialog';
import {CommonModule} from '@angular/common';
import {FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatDividerModule} from '@angular/material/divider';
import {MatIconModule} from '@angular/material/icon';
import {MatAutocompleteModule, MatAutocompleteSelectedEvent} from '@angular/material/autocomplete';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MemberInput, User} from '../../../core/models/user.model';
import {UserService} from '../../../core/services/user.service';
import {firstValueFrom, Observable} from 'rxjs';
import {map, startWith} from 'rxjs/operators';
import {MatSelectModule} from '@angular/material/select';
import {Currency} from '../../../core/models/currency.model';
import {Group} from '../../../core/models/group.model';
import {AuthService} from '../../../core/services/auth.service';
import {ExpenseService} from '../../../core/services/expense.service';
import {NotificationService} from '../../../core/services/notification.service';

@Component({
  selector: 'app-group-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatExpansionModule,
    MatDividerModule,
    MatIconModule,
    MatAutocompleteModule,
    MatCheckboxModule,
    MatSelectModule,
    MatDialogModule
  ],
  template: `
    <form [formGroup]="groupForm" (ngSubmit)="onSubmit()" class="group-form-content">
      <div class="form-field">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nazwa grupy</mat-label>
          <input matInput formControlName="name" required>
          @if (groupForm.get('name')?.errors?.['required']) {
            <mat-error>Nazwa jest wymagana</mat-error>
          }
          @if (groupForm.get('name')?.errors?.['minlength']) {
            <mat-error>Nazwa musi mieć co najmniej 3 znaki</mat-error>
          }
        </mat-form-field>
      </div>

      <div class="form-field">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Opis grupy</mat-label>
          <textarea matInput formControlName="description" rows="3"
                    placeholder="Opis grupy"></textarea>
        </mat-form-field>
      </div>
      <div class="checkbox-row">
        <mat-checkbox formControlName="isPublic">Grupa publiczna</mat-checkbox>
        <mat-checkbox formControlName="sendInvitationEmail">
          Wyślij e-mail z zaproszeniem do nowych członków
        </mat-checkbox>
      </div>

      <div class="currency-row">
        <div class="currency-select-container">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Dostępne waluty</mat-label>
            <mat-select formControlName="currencies" required multiple>
              @for (currency of currencies; track currency) {
                <mat-option [value]="currency">{{ currency }}</mat-option>
              }
            </mat-select>
            <mat-icon matSuffix>currency_exchange</mat-icon>
            @if (groupForm.get('currencies')?.errors?.['required']) {
              <mat-error>Wymagana przynajmniej jedna waluta</mat-error>
            }
          </mat-form-field>
        </div>

        @if (groupForm.get('currencies')?.value?.length > 1) {
          <div class="currency-select-container">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Domyślna waluta</mat-label>
              <mat-select formControlName="defaultCurrency" required>
                @for (currency of groupForm.get('currencies')?.value; track currency) {
                  <mat-option [value]="currency">{{ currency }}</mat-option>
                }
              </mat-select>
              <mat-icon matSuffix>star</mat-icon>
            </mat-form-field>
          </div>
        }
      </div>
      <div formArrayName="members" class="members-container">
        <h3>Członkowie</h3>
        @for (member of members.controls; track $index) {
          <div [formGroupName]="$index" class="member-row">
            <div class="member-inputs">
              <mat-form-field appearance="outline" class="username-field">
                <mat-label>Nazwa użytkownika</mat-label>
                <input matInput
                       formControlName="userName"
                       [matAutocomplete]="auto"
                       (input)="onUserNameInput($index)">
                @if (member.get('userName')?.errors?.['required']) {
                  <mat-error>Nazwa użytkownika jest wymagana</mat-error>
                }
                <mat-autocomplete #auto="matAutocomplete"
                                  (optionSelected)="onUserSelected($event, $index)">
                  @for (user of filteredUsers[$index] | async; track user.id) {
                    <mat-option [value]="user.name">
                      {{ user.name }}
                    </mat-option>
                  }
                </mat-autocomplete>
              </mat-form-field>

              @if (!member.get('userId')?.value || member.get('userId')?.value?.toString().startsWith('temp_')) {
                <mat-form-field appearance="outline" class="email-field">
                  <mat-label>Email</mat-label>
                  <input matInput formControlName="email" type="email" required>
                  @if (member.get('email')?.errors?.['required']) {
                    <mat-error>Email jest wymagany</mat-error>
                  }
                  @if (member.get('email')?.errors?.['email']) {
                    <mat-error>Dodaj poprawny adres email</mat-error>
                  }
                </mat-form-field>
              }

              <button mat-icon-button color="warn" type="button" class="remove-member-btn"
                      (click)="removeMember($index)"
                      [disabled]="members.length <= 1">
                <mat-icon>close</mat-icon>
              </button>
            </div>
          </div>
        }

        <div class="add-member-link">
          <button mat-button color="primary" (click)="addMember()"
                  (keyup.enter)="addMember()" (keydown.enter)="addMember()"
                  type="button" class="add-member-btn">
            <mat-icon>add</mat-icon>
            Dodaj kolejnego członka
          </button>
        </div>
      </div>
    </form>
  `,
  styles: [`
    .group-form-content {
      padding-top: 24px;
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

    .members-container {
      margin: 24px 0;
    }

    .member-row {
      display: flex;
      align-items: center;
      margin-bottom: 16px;
    }

    .member-inputs {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      align-items: flex-start;
      flex: 1;
    }

    .username-field, .email-field {
      flex: 1;
      min-width: 200px;
    }

    .remove-member-btn {
      margin-top: 4px;
    }

    @media (max-width: 768px) {
      .member-inputs {
        flex-direction: column;
        gap: 0;
      }

      .username-field, .email-field {
        width: 100%;
      }

      .member-row {
        position: relative;
        padding-top: 10px;
      }

      .remove-member-btn {
        position: absolute;
        top: -5px;
        right: -10px;
        z-index: 1;
      }
    }

    .add-member-link {
      margin-top: 8px;
    }

    .add-member-link a {
      color: var(--mat-sys-primary);
      font-weight: 500;
    }

    h3 {
      margin: 0 0 16px 0;
      font-weight: 500;
    }

    mat-expansion-panel-header {
      height: auto;
    }

    .checkbox-row {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 24px;
    }

    .currency-row {
      display: flex;
      gap: 16px;
      align-items: flex-start;
      margin-bottom: 16px;
    }

    .currency-select-container {
      flex: 1;
      min-width: 0; /* Prevents flex items from overflowing */
    }

    @media (max-width: 600px) {
      .currency-row {
        flex-direction: column;
        gap: 0;
      }
      .currency-select-container {
        width: 100%;
      }
    }
  `]
})
export class GroupFormComponent implements OnInit {

  @Input() group: Group | undefined;
  @Output() formSubmitted = new EventEmitter<any>();

  groupForm!: FormGroup;
  availableUsers: User[] = [];
  filteredUsers: Observable<User[]>[] = [];
  currencies = Object.values(Currency);

  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private expenseService = inject(ExpenseService);
  private notificationService = inject(NotificationService);

  ngOnInit(): void {
    this.groupForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      members: this.fb.array([]),
      isPublic: [false],
      currencies: [[Currency.PLN], Validators.required],
      defaultCurrency: [Currency.PLN, Validators.required],
      sendInvitationEmail: [true]
    });

    this.authService.getCurrentUser().subscribe((user: User) => {
      this.userService.findUsersFriends(user.id!).subscribe({
        next: (users: User[]) => {
          this.availableUsers = users;
          if (this.group) {
            this.group.members.forEach(member => {
              this.addMember(member);
            });
            this.groupForm.patchValue({
              name: this.group.name,
              description: this.group.description,
              isPublic: this.group.isPublic ?? false,
              currencies: this.group.currencies && this.group.currencies.length > 0
                ? this.group.currencies
                : [this.group.defaultCurrency || Currency.PLN],
              defaultCurrency: this.group.defaultCurrency || Currency.PLN
            });
          } else {
            this.addMember();
          }
        },
        error: (error: unknown) => {
          console.error(error);
        }
      });
    });

    this.groupForm.get('currencies')?.valueChanges.subscribe((selectedCurrencies: Currency[]) => {
      const defaultCurrencyControl = this.groupForm.get('defaultCurrency');
      if (selectedCurrencies && selectedCurrencies.length > 0) {
        if (!selectedCurrencies.includes(defaultCurrencyControl?.value)) {
          defaultCurrencyControl?.setValue(selectedCurrencies[0]);
        }
      }
    });
  }

  get members(): FormArray {
    return this.groupForm.get('members') as FormArray;
  }

  createMemberFormGroup(member?: User): FormGroup {
    return this.fb.group({
      userName: [member?.name || '', Validators.required],
      email: [member?.email || '', [Validators.required, Validators.email]],
      userId: [member?.id || '']
    });
  }

  addMember(member?: User): void {
    const memberGroup = this.createMemberFormGroup(member);
    this.members.push(memberGroup);
    const index = this.members.length - 1;
    this.setupAutoComplete(index);
  }

  async removeMember(index: number): Promise<void> {
    if (this.members.length <= 1) {
      return;
    }

    const memberToRemove = this.members.at(index);
    const userId = memberToRemove.get('userId')?.value;

    if (this.group?.id && userId) {
      try {
        const canDelete = await firstValueFrom(this.expenseService.canUserBeDeletedFromGroup(this.group.id, userId));
        if (!canDelete) {
          this.notificationService.showError('Nie można usunąć użytkownika, ponieważ ma już wydatki w tej grupie.');
          return;
        }
      } catch (error) {
        console.error('Błąd podczas sprawdzania możliwości usunięcia użytkownika:', error);
        this.notificationService.showError('Wystąpił błąd podczas sprawdzania wydatków użytkownika.');
        return;
      }
    }

    this.members.removeAt(index);
    this.filteredUsers.splice(index, 1);
  }

  onUserNameInput(index: number): void {
    const memberGroup = this.members.at(index);
    const userNameControl = memberGroup.get('userName');
    const userName = userNameControl?.value;

    if (userNameControl) {
      this.filteredUsers[index] = userNameControl.valueChanges.pipe(
        startWith(userName),
        map(value => this._filter(value || ''))
      );
    }
  }

  onUserSelected(event: MatAutocompleteSelectedEvent, index: number): void {
    const selectedUserName = event.option.value;
    const selectedUser = this.availableUsers.find(user => user.name === selectedUserName);
    if (selectedUser) {
      const memberGroup = this.members.at(index);
      memberGroup.patchValue({
        userName: selectedUser.name,
        email: selectedUser.email,
        userId: selectedUser.id
      });
    }
  }

  async onSubmit(): Promise<void> {
    if (this.groupForm.valid) {
      const formValue = this.groupForm.value;

      const memberData = formValue.members.map((member: MemberInput) => {
        if (member.userId) {
          return {
            userId: parseInt(member.userId.toString()),
            userName: member.userName,
            email: member.email
          };
        }
        return {
          userName: member.userName,
          email: member.email
        };
      });

      this.formSubmitted.emit({
        name: formValue.name,
        description: formValue.description,
        members: memberData,
        isPublic: formValue.isPublic,
        defaultCurrency: formValue.currencies && formValue.currencies.length > 1 ? formValue.defaultCurrency : (formValue.currencies && formValue.currencies.length > 0 ? formValue.currencies[0] : Currency.PLN),
        currencies: formValue.currencies,
        sendInvitationEmail: formValue.sendInvitationEmail
      });
    }
  }

  private setupAutoComplete(index: number): void {
    const memberGroup = this.members.at(index);
    const userNameControl = memberGroup.get('userName');

    if (userNameControl) {
      this.filteredUsers[index] = userNameControl.valueChanges.pipe(
        startWith(''),
        map(value => this._filter(value || ''))
      );
    }
  }

  private _filter(value: string): User[] {
    const filterValue = value.toLowerCase();
    return this.availableUsers.filter(user =>
      user.name.toLowerCase().includes(filterValue) ||
      user.email.toLowerCase().includes(filterValue)
    );
  }
}
