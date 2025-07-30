import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
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
import {Observable} from 'rxjs';
import {map, startWith} from 'rxjs/operators';
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
      display: grid;
      grid-template-columns: 1fr 1fr auto;
      gap: 16px;
      align-items: center;
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

      .username-field {
        grid-area: username;
      }

      .email-field {
        grid-area: email;
      }

      .remove-member-btn {
        grid-area: remove;
      }
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

  `]
})
export class GroupFormComponent implements OnInit {
  [x: string]: any;
  @Input() group: Group | undefined;
  @Output() formSubmitted = new EventEmitter<any>();

  groupForm: FormGroup;
  availableUsers: User[] = [];
  filteredUsers: Observable<User[]>[] = [];
  currencies = Object.values(Currency);

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
        defaultCurrency: formValue.currency,
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
