import {Component, Inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatDividerModule} from '@angular/material/divider';
import {MatIconModule} from '@angular/material/icon';
import {MatAutocompleteModule, MatAutocompleteSelectedEvent} from '@angular/material/autocomplete';
import {Group} from '../../../core/models/group.model';
import {User} from '../../../core/models/user.model';
import {CreateUserRequest, UserService} from '../../../core/services/user.service';
import {firstValueFrom, map, Observable, startWith} from 'rxjs';
import {HttpErrorResponse} from '@angular/common/http';

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
  selector: 'app-edit-group-dialog',
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
    MatAutocompleteModule
  ],
  template: `
    <div class="dialog-container">
      <h2 mat-dialog-title>Edit Group</h2>
      <form [formGroup]="groupForm" (ngSubmit)="onSubmit()">
        <mat-dialog-content>
          <div class="form-field">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Group Name</mat-label>
              <input matInput formControlName="name" required>
              <mat-error *ngIf="groupForm.get('name')?.hasError('required')">
                Group name is required
              </mat-error>
              <mat-error *ngIf="groupForm.get('name')?.hasError('minlength')">
                Group name must be at least 2 characters
              </mat-error>
            </mat-form-field>
          </div>

          <div class="form-field">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Description</mat-label>
              <textarea matInput formControlName="description" rows="3" placeholder="Enter group description"></textarea>
            </mat-form-field>
          </div>

          <div formArrayName="members" class="members-container">
            <h3>Members</h3>
            <div *ngFor="let member of members.controls; let i=index" [formGroupName]="i" class="member-row">
              <div class="member-inputs">
                <mat-form-field appearance="outline">
                  <mat-label>Username</mat-label>
                  <input matInput
                         formControlName="userName"
                         [matAutocomplete]="auto"
                         (input)="onUserNameInput(i)">
                  <mat-error *ngIf="member.get('userName')?.hasError('required')">
                    Username is required
                  </mat-error>
                  <mat-autocomplete #auto="matAutocomplete"
                                  (optionSelected)="onUserSelected($event, i)">
                    <mat-option *ngFor="let user of filteredUsers[i] | async" [value]="user.name">
                      {{ user.name }} ({{ user.email }})
                    </mat-option>
                  </mat-autocomplete>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Email</mat-label>
                  <input matInput formControlName="email" type="email">
                  <mat-error *ngIf="member.get('email')?.hasError('required')">
                    Email is required
                  </mat-error>
                  <mat-error *ngIf="member.get('email')?.hasError('email')">
                    Please enter a valid email address
                  </mat-error>
                </mat-form-field>
              </div>

              <button mat-icon-button color="warn" type="button"
                      (click)="removeMember(i)"
                      [disabled]="members.length <= 1">
                <mat-icon>close</mat-icon>
              </button>
            </div>

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
                  <input matInput formControlName="name" placeholder="Enter name">
                  <mat-error *ngIf="newUserForm.get('name')?.hasError('required')">
                    Name is required
                  </mat-error>
                </mat-form-field>
              </div>

              <div class="form-field">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Surname</mat-label>
                  <input matInput formControlName="surname" placeholder="Enter surname">
                  <mat-error *ngIf="newUserForm.get('surname')?.hasError('required')">
                    Surname is required
                  </mat-error>
                </mat-form-field>
              </div>

              <div class="form-field">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Username</mat-label>
                  <input matInput formControlName="username" placeholder="Enter username">
                  <mat-error *ngIf="newUserForm.get('username')?.hasError('required')">
                    Username is required
                  </mat-error>
                </mat-form-field>
              </div>

              <div class="form-field">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Email</mat-label>
                  <input matInput formControlName="email" placeholder="Enter email" type="email">
                  <mat-error *ngIf="newUserForm.get('email')?.hasError('required')">
                    Email is required
                  </mat-error>
                  <mat-error *ngIf="newUserForm.get('email')?.hasError('email')">
                    Please enter a valid email address
                  </mat-error>
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
            Save Changes
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
export class EditGroupDialogComponent implements OnInit {
  groupForm: FormGroup;
  newUserForm: FormGroup;
  availableUsers: User[] = [];
  pendingUsers: PendingUser[] = [];
  filteredUsers: Observable<User[]>[] = [];
  private tempIdCounter = 0;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    public dialogRef: MatDialogRef<EditGroupDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { group: Group; currentUser: User }
  ) {
    this.groupForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      members: this.fb.array([])
    });

    this.newUserForm = this.fb.group({
      name: ['', Validators.required],
      surname: ['', Validators.required],
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]]
    });
  }

  get members(): FormArray {
    return this.groupForm.get('members') as FormArray;
  }

  ngOnInit(): void {
    // Load initial form values
    this.groupForm.patchValue({
      name: this.data.group.name,
      description: this.data.group.description
    });

    // Load available users
    this.userService.getUsers().subscribe({
      next: (users: User[]) => {
        this.availableUsers = users;
        // Initialize members form array with existing members
        this.data.group.members.forEach(member => {
          this.addMember(member);
        });
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error loading users:', error);
      }
    });
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
          members: memberData
        });
      } catch (error: unknown) {
        if (error instanceof HttpErrorResponse) {
          console.error('Error updating group:', error);
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
