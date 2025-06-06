import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatDividerModule} from '@angular/material/divider';
import {MatIconModule} from '@angular/material/icon';
import {MatAutocompleteModule, MatAutocompleteSelectedEvent} from '@angular/material/autocomplete';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {User} from '../../../core/models/user.model';
import {CreateUserRequest, UserService} from '../../../core/services/user.service';
import {firstValueFrom, map, Observable, startWith} from 'rxjs';
import {HttpErrorResponse} from '@angular/common/http';
import {MatSelectModule} from '@angular/material/select';
import {Currency} from '../../../core/models/currency.model';

interface PendingUser extends CreateUserRequest {
  tempId: string;
}

interface MemberInput {
  userName: string;
  email: string;
  userId?: string | number;
}

interface CreatedUserResponse {
  tempId: string;
  createdUser: User;
}

@Component({
  selector: 'app-create-group-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatExpansionModule,
    MatDividerModule,
    MatIconModule,
    MatAutocompleteModule,
    MatCheckboxModule,
    MatSelectModule,
  ],
  template: `
    <div class="dialog-container">
      <h2 mat-dialog-title>Create New Group</h2>
      <form [formGroup]="groupForm" (ngSubmit)="onSubmit()">
        <mat-dialog-content>
          <div class="form-field">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Group Name</mat-label>
              <input matInput formControlName="name" required>
              @if (groupForm.get('name')?.errors?.['required']) {
                <mat-error>Name is required</mat-error>
              }
              @if (groupForm.get('name')?.errors?.['minlength']) {
                <mat-error>Name must be at least 3 characters long</mat-error>
              }
            </mat-form-field>
          </div>

          <div class="form-field">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Description</mat-label>
              <textarea matInput formControlName="description" rows="3"
                        placeholder="Enter group description"></textarea>
            </mat-form-field>
          </div>
          <div class="form-row">
            <mat-checkbox formControlName="isPublic" class="mb-2">Public group (visible to everyone)</mat-checkbox>
            <div class="form-field currency-field">
              <mat-form-field appearance="outline">
                <mat-label>Currency</mat-label>
                <mat-select formControlName="currency" required>
                  @for (currency of currencies; track currency) {
                    <mat-option [value]="currency">{{ currency }}</mat-option>
                  }
                </mat-select>
                <mat-icon matSuffix>currency_exchange</mat-icon>
                @if (groupForm.get('currency')?.errors?.['required']) {
                  <mat-error>Currency is required</mat-error>
                }
              </mat-form-field>
            </div>
          </div>
          <div formArrayName="members" class="members-container">
            <h3>Members</h3>
            @for (member of members.controls; track $index) {
              <div [formGroupName]="$index" class="member-row">
                <div class="member-inputs">
                  <mat-form-field appearance="outline">
                    <mat-label>Username</mat-label>
                    <input matInput
                           formControlName="userName"
                           [matAutocomplete]="auto"
                           (input)="onUserNameInput($index)">
                    @if (member.get('userName')?.errors?.['required']) {
                      <mat-error>Username is required</mat-error>
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

                  <mat-form-field appearance="outline">
                    <mat-label>Email</mat-label>
                    <input matInput formControlName="email" type="email" required>
                    @if (member.get('email')?.errors?.['required']) {
                      <mat-error>Email is required</mat-error>
                    }
                    @if (member.get('email')?.errors?.['email']) {
                      <mat-error>Please enter a valid email address</mat-error>
                    }
                  </mat-form-field>
                </div>

                <button mat-icon-button color="warn" type="button"
                        (click)="removeMember($index)"
                        [disabled]="members.length <= 1">
                  <mat-icon>close</mat-icon>
                </button>
              </div>
            }

            <div class="add-member-link">
              <a mat-button color="primary" (click)="addMember()">
                <mat-icon>add</mat-icon>
                Add a person
              </a>
            </div>
          </div>

          <mat-divider></mat-divider>

          <mat-expansion-panel class="mt-3">
            <mat-expansion-panel-header>
              <mat-panel-title>
                Add New Member
              </mat-panel-title>
              <mat-panel-description>
                Create a new user without password
              </mat-panel-description>
            </mat-expansion-panel-header>

            <form [formGroup]="newUserForm" class="mt-3">
              <div class="form-field">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Name</mat-label>
                  <input matInput formControlName="name" placeholder="Enter name" required>
                  @if (newUserForm.get('name')?.errors?.['required']) {
                    <mat-error>Name is required</mat-error>
                  }
                </mat-form-field>
              </div>

              <div class="form-field">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Surname</mat-label>
                  <input matInput formControlName="surname" placeholder="Enter surname" required>
                  @if (newUserForm.get('surname')?.errors?.['required']) {
                    <mat-error>Surname is required</mat-error>
                  }
                </mat-form-field>
              </div>

              <div class="form-field">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Username</mat-label>
                  <input matInput formControlName="username" placeholder="Enter username" required>
                  @if (newUserForm.get('username')?.errors?.['required']) {
                    <mat-error>Username is required</mat-error>
                  }
                </mat-form-field>
              </div>

              <div class="form-field">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Email</mat-label>
                  <input matInput formControlName="email" placeholder="Enter email" type="email" required>
                  @if (newUserForm.get('email')?.errors?.['required']) {
                    <mat-error>Email is required</mat-error>
                  }
                  @if (newUserForm.get('email')?.errors?.['email']) {
                    <mat-error>Please enter a valid email address</mat-error>
                  }
                </mat-form-field>
              </div>

              <div class="form-actions">
                <button mat-raised-button color="primary"
                        type="button"
                        [disabled]="!newUserForm.valid"
                        (click)="addNewUser()">
                  Add to Group
                </button>
              </div>
            </form>
          </mat-expansion-panel>
        </mat-dialog-content>

        <mat-dialog-actions align="end">
          <button mat-button mat-dialog-close>Cancel</button>
          <button mat-raised-button color="primary" type="submit" [disabled]="!groupForm.valid">
            Create Group
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
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
    }
    .form-row {
      display: flex;
      align-items: baseline;
      gap: 16px;
      margin-bottom: 16px;
    }

    .member-inputs {
      display: flex;
      gap: 16px;
      flex: 1;
    }

    .member-inputs mat-form-field {
      flex: 1;
    }

    .add-member-link {
      margin-top: 8px;
    }

    h3 {
      margin: 0 0 16px 0;
      font-weight: 500;
    }
  `]
})
export class CreateGroupDialogComponent implements OnInit {
  groupForm: FormGroup;
  newUserForm: FormGroup;
  availableUsers: User[] = [];
  pendingUsers: PendingUser[] = [];
  filteredUsers: Observable<User[]>[] = [];
  private tempIdCounter = 0;
  currencies = Object.values(Currency);
  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    public dialogRef: MatDialogRef<CreateGroupDialogComponent>
  ) {
    this.groupForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      members: this.fb.array([]),
      isPublic: [false],
      currency: [Currency.PLN, Validators.required]
    });

    this.newUserForm = this.fb.group({
      name: ['', Validators.required],
      surname: ['', Validators.required],
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]]
    });

    // Add initial member row
    this.addMember();
  }

  get members(): FormArray {
    return this.groupForm.get('members') as FormArray;
  }

  ngOnInit(): void {
    // Load all available users
    this.userService.getUsers().subscribe({
      next: (users: User[]) => {
        this.availableUsers = users;
      },
      error: (error: unknown) => {
        console.error(error);
      }
    });
  }

  createMemberFormGroup(): FormGroup {
    return this.fb.group({
      userName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      userId: ['']
    });
  }

  addMember(): void {
    const memberGroup = this.createMemberFormGroup();
    this.members.push(memberGroup);

    // Add new autocomplete filter for this member
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

  addNewUser(): void {
    if (this.newUserForm.valid) {
      const formValue = this.newUserForm.value;
      const tempId = `temp_${this.tempIdCounter++}`;

      // Create a temporary user object
      const newUser: PendingUser = {
        ...formValue,
        tempId
      };

      // Add to pending users
      this.pendingUsers = [...this.pendingUsers, newUser];

      // Add as a new member row
      const memberGroup = this.createMemberFormGroup();
      memberGroup.patchValue({
        userName: formValue.name,
        email: formValue.email,
        userId: tempId
      });
      this.members.push(memberGroup);
      this.setupAutoComplete(this.members.length - 1);

      // Reset the form
      this.newUserForm.reset();
    }
  }

  async onSubmit(): Promise<void> {
    if (this.groupForm.valid) {
      const formValue = this.groupForm.value;

      try {
        // First, create all pending users
        const createdUsers = await Promise.all(
          this.pendingUsers.map(async (pendingUser): Promise<CreatedUserResponse> => {
            const {tempId, ...userData} = pendingUser;
            const createdUser = await firstValueFrom<User>(
              this.userService.createUser(userData)
            );
            return {tempId, createdUser};
          })
        );

        // Process members to get final member data
        const memberData = formValue.members.map((member: MemberInput) => {
          if (member.userId) {
            // If it's a temp ID, replace with real ID
            const createdUser = createdUsers.find(u => u.tempId === member.userId);
            if (createdUser) {
              return {
                userId: createdUser.createdUser.id,
                userName: member.userName,
                email: member.email
              };
            }
            // If not a temp ID, it's an existing user ID
            return {
              userId: parseInt(member.userId.toString()),
              userName: member.userName,
              email: member.email
            };
          }
          // If no userId, this is a new user to be created
          return {
            userName: member.userName,
            email: member.email
          };
        });

        // Close dialog with final data
        this.dialogRef.close({
          name: formValue.name,
          description: formValue.description,
          members: memberData,
          isPublic: formValue.isPublic,
          currency: formValue.currency
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
