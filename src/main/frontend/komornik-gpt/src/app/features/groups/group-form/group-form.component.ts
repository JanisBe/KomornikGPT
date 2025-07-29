import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {MatDialogModule} from '@angular/material/dialog';
import {CommonModule} from '@angular/common';
import {
  AbstractControl,
  AsyncValidatorFn,
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatDividerModule} from '@angular/material/divider';
import {MatIconModule} from '@angular/material/icon';
import {MatAutocompleteModule, MatAutocompleteSelectedEvent} from '@angular/material/autocomplete';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {CreatedUserResponse, MemberInput, PendingUser, User} from '../../../core/models/user.model';
import {UserService} from '../../../core/services/user.service';
import {firstValueFrom, Observable, of} from 'rxjs';
import {map, startWith} from 'rxjs/operators';
import {HttpErrorResponse} from '@angular/common/http';
import {MatSelectModule} from '@angular/material/select';
import {Currency} from '../../../core/models/currency.model';
import {Group} from '../../../core/models/group.model';
import {AuthService} from '../../../core/services/auth.service';

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
    MatDialogModule,
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
      <div class="form-row">
        <div class="checkbox-column">
          <mat-checkbox formControlName="isPublic" class="mb-2">Grupa publiczna</mat-checkbox>
            <mat-checkbox formControlName="sendInvitationEmail" class="mb-2">
              Wyślij e-mail z zaproszeniem do nowych członków
            </mat-checkbox>
        </div>
        <div class="form-field currency-field">
          <mat-form-field appearance="outline">
            <mat-label>Domyślna waluta</mat-label>
            <mat-select formControlName="currency" required>
              @for (currency of currencies; track currency) {
                <mat-option [value]="currency">{{ currency }}</mat-option>
              }
            </mat-select>
            <mat-icon matSuffix>currency_exchange</mat-icon>
            @if (groupForm.get('currency')?.errors?.['required']) {
              <mat-error>Domyślna waluta jest wymagana</mat-error>
            }
          </mat-form-field>
        </div>
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
          <a mat-button color="primary" (click)="addMember()">
            <mat-icon>add</mat-icon>
            Dodaj kolejnego członka
          </a>
        </div>
      </div>

      <mat-divider></mat-divider>

      <mat-expansion-panel class="mt-3">
        <mat-expansion-panel-header>
          <mat-panel-title>
            Dodaj nowego użytkownika
          </mat-panel-title>
          <mat-panel-description>
            Dodaj nowego członka grupy, który nie ma konta
          </mat-panel-description>
        </mat-expansion-panel-header>

        <form [formGroup]="newUserForm" class="mt-3">
          <div class="form-field">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Imię</mat-label>
              <input matInput formControlName="name" placeholder="Podaj imie" required>
              @if (newUserForm.get('name')?.errors?.['required']) {
                <mat-error>Imie jest wymagane</mat-error>
              }
            </mat-form-field>
          </div>

          <div class="form-field">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Nazwisko</mat-label>
              <input matInput formControlName="surname" placeholder="Podaj nazwisko" required>
              @if (newUserForm.get('surname')?.errors?.['required']) {
                <mat-error>Nazwisko jest wymagane</mat-error>
              }
            </mat-form-field>
          </div>

          <div class="form-field">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Nazwa użytkownika</mat-label>
              <input matInput formControlName="username" placeholder="Podaj nazwę użytkownika" required
                     (blur)="newUserForm.get('username')?.updateValueAndValidity()">
              @if (newUserForm.get('username')?.errors?.['required']) {
                <mat-error>Nazwa użytkownika jest wymagana</mat-error>
              }
              @if (newUserForm.get('username')?.errors?.['usernameExists']) {
                <mat-error>Nazwa użytkownika jest już zajęta</mat-error>
              }
            </mat-form-field>
          </div>

          <div class="form-field">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput formControlName="email" placeholder="Podaj adres e-mail" type="email" required
                     (blur)="newUserForm.get('email')?.updateValueAndValidity()">
              @if (newUserForm.get('email')?.errors?.['required']) {
                <mat-error>Email jest wymagany</mat-error>
              }
              @if (newUserForm.get('email')?.errors?.['email']) {
                <mat-error>Wprowadź poprawny adres e-mail</mat-error>
              }
              @if (newUserForm.get('email')?.errors?.['emailExists']) {
                <mat-error>Email jest już zajęty</mat-error>
              }
            </mat-form-field>
          </div>

          <div class="form-actions">
            <button mat-raised-button color="primary"
                    type="button"
                    [disabled]="!newUserForm.valid"
                    (click)="addNewUser()">
              Dodaj do grupy
            </button>
          </div>
        </form>
      </mat-expansion-panel>
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

    .mt-3 {
      margin-top: 16px;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 16px;
    }

    .members-container {
      margin: 24px 0;
    }

    .member-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
    }

    .form-row {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-start;
      gap: 16px;
      margin-bottom: 16px;
    }

    .checkbox-column {
      display: flex;
      flex-direction: column;
      flex: 1;
    }

    .member-inputs {
      display: grid;
      grid-template-columns: 2fr 1fr auto;
      gap: 16px;
    }

    .remove-member-btn {
      grid-column: 3;
    }

    @media (max-width: 768px) {
      .member-inputs {
        grid-template-columns: 1fr auto;
        grid-template-areas:
          "username remove"
          "email email";
        gap: 8px 16px;
      }

      .username-field { grid-area: username; }
      .email-field { grid-area: email; }
      .remove-member-btn { grid-area: remove; }
    }

    .add-member-link {
      margin-top: 8px;
    }

    h3 {
      margin: 0 0 16px 0;
      font-weight: 500;
    }

    mat-expansion-panel-header {
      height: auto;
    }

    ::ng-deep .mat-expansion-panel-header-description {
      white-space: normal;
    }

    ::ng-deep .mat-mdc-form-field-subscript-wrapper {
      min-height: 1px;
    }
  `]
})
export class GroupFormComponent implements OnInit {
  [x: string]: any;
  @Input() group: Group | undefined;
  @Output() formSubmitted = new EventEmitter<any>();

  groupForm: FormGroup;
  newUserForm: FormGroup;
  availableUsers: User[] = [];
  pendingUsers: PendingUser[] = [];
  filteredUsers: Observable<User[]>[] = [];
  currencies = Object.values(Currency);
  private tempIdCounter = 0;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private authService: AuthService
  ) {
    this.groupForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      members: this.fb.array([]),
      isPublic: [false],
      currency: [Currency.PLN, Validators.required],
      sendInvitationEmail: [true]
    });

    this.newUserForm = this.fb.group({
      name: ['', Validators.required],
      surname: ['', Validators.required],
      username: ['', [Validators.required], this.usernameExistsAsyncValidator()],
      email: ['', [Validators.required, Validators.email], this.emailExistsAsyncValidator()]
    }, {updateOn: "blur"});
  }

  ngOnInit(): void {
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
              currency: this.group.defaultCurrency || Currency.PLN
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
  }

  usernameExistsAsyncValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<{ [key: string]: any } | null> => {
      if (!control.value) {
        return of(null);
      }
      return this.userService.checkUsernameExists(control.value).pipe(
        map(exists => (exists ? {usernameExists: true} : null))
      );
    };
  }

  emailExistsAsyncValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<{ [key: string]: any } | null> => {
      if (!control.value) {
        return of(null);
      }
      return this.userService.checkEmailExists(control.value).pipe(
        map(exists => (exists ? {emailExists: true} : null))
      );
    };
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

  removeMember(index: number): void {
    if (this.members.length > 1) {
      this.members.removeAt(index);
      this.filteredUsers.splice(index, 1);
    }
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
    console.log(selectedUser);
    if (selectedUser) {
      const memberGroup = this.members.at(index);
      memberGroup.patchValue({
        userName: selectedUser.name,
        email: selectedUser.email,
        userId: selectedUser.id
      });
    }
  }

  addNewUser(): void {
    if (this.newUserForm.valid) {
      const formValue = this.newUserForm.value;
      const tempId = `temp_${this.tempIdCounter++}`;

      const newUser: PendingUser = {
        ...formValue,
        tempId
      };

      this.pendingUsers = [...this.pendingUsers, newUser];

      const memberGroup = this.createMemberFormGroup();
      memberGroup.patchValue({
        userName: formValue.name,
        email: formValue.email,
        userId: tempId
      });
      this.members.push(memberGroup);
      this.setupAutoComplete(this.members.length - 1);
      this.newUserForm.reset();
    }
  }

  async onSubmit(): Promise<void> {
    if (this.groupForm.valid) {
      const formValue = this.groupForm.value;

      try {
        const createdUsers = await Promise.all(
          this.pendingUsers.map(async (pendingUser): Promise<CreatedUserResponse> => {
            const {tempId, ...userData} = pendingUser;
            const createdUser = await firstValueFrom<User>(
              this.userService.createUser(userData)
            );
            return {tempId, createdUser};
          })
        );

        const memberData = formValue.members.map((member: MemberInput) => {
          if (member.userId) {
            const createdUser = createdUsers.find(u => u.tempId === member.userId);
            if (createdUser) {
              return {
                userId: createdUser.createdUser.id,
                userName: member.userName,
                email: member.email
              };
            }
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
          defaultCurrency: formValue.currency,
          sendInvitationEmail: formValue.sendInvitationEmail
        });
      } catch (error: unknown) {
        if (error instanceof HttpErrorResponse) {
          console.error(error);
        }
      }
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
