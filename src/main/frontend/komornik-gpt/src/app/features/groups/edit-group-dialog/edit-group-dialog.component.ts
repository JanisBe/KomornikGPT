import {Component, Inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatDividerModule} from '@angular/material/divider';
import {Group} from '../../../core/models/group.model';
import {User} from '../../../core/models/user.model';
import {CreateUserRequest, UserService} from '../../../core/services/user.service';
import {firstValueFrom} from 'rxjs';

interface PendingUser extends CreateUserRequest {
  tempId: string;
  id: string; // Temporary ID for mat-select
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
    MatSelectModule,
    MatExpansionModule,
    MatDividerModule
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
              <mat-label>Members</mat-label>
              <mat-select formControlName="userIds" multiple>
                <mat-option *ngFor="let user of availableUsers" [value]="user.id">
                  {{ user.name }} ({{ user.email }})
                </mat-option>
                <mat-option *ngFor="let user of pendingUsers" [value]="user.tempId">
                  {{ user.name }} ({{ user.email }}) (New)
                </mat-option>
              </mat-select>
            </mat-form-field>
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
  `]
})
export class EditGroupDialogComponent implements OnInit {
  groupForm: FormGroup;
  newUserForm: FormGroup;
  availableUsers: User[] = [];
  pendingUsers: PendingUser[] = [];
  private tempIdCounter = 0;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    public dialogRef: MatDialogRef<EditGroupDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { group: Group; currentUser: User }
  ) {
    this.groupForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      userIds: [[]]
    });

    this.newUserForm = this.fb.group({
      name: ['', Validators.required],
      surname: ['', Validators.required],
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit(): void {
    // Load all available users
    this.userService.getUsers().subscribe({
      next: (users: User[]) => {
        this.availableUsers = users;
      },
      error: (error: unknown) => {
        console.error('Error loading users:', error);
      }
    });

    // Set initial form values
    this.groupForm.patchValue({
      name: this.data.group.name,
      userIds: this.data.group.users.map(user => user.id)
    });
  }

  addNewUser(): void {
    if (this.newUserForm.valid) {
      const formValue = this.newUserForm.value;
      const tempId = `temp-${++this.tempIdCounter}`;

      // Create a temporary user object
      const newUser: PendingUser = {
        ...formValue,
        tempId,
        id: tempId // This will be replaced with real ID after saving
      };

      // Add to pending users
      this.pendingUsers = [...this.pendingUsers, newUser];

      // Add to selected users
      const currentUserIds = this.groupForm.get('userIds')?.value || [];
      this.groupForm.patchValue({
        userIds: [...currentUserIds, tempId]
      });

      // Reset the form
      this.newUserForm.reset();
    }
  }

  async onSubmit(): Promise<void> {
    if (this.groupForm.valid) {
      const formValue = this.groupForm.value;

      // Make sure the creator stays in the group
      if (!formValue.userIds.includes(this.data.group.createdBy.id)) {
        formValue.userIds.push(this.data.group.createdBy.id);
      }

      try {
        // First, create all pending users
        const createdUsers = await Promise.all(
          this.pendingUsers.map(async (pendingUser): Promise<CreatedUserResponse> => {
            const {tempId, id, ...userData} = pendingUser;
            const createdUser = await firstValueFrom<User>(
              this.userService.createUser(userData)
            );
            return {tempId, createdUser};
          })
        );

        // Replace temporary IDs with real ones in the userIds array
        const finalUserIds = formValue.userIds.map((id: string | number) => {
          const createdUser = createdUsers.find(u => u.tempId === id);
          return createdUser ? createdUser.createdUser.id : id;
        });

        // Close dialog with final data
        this.dialogRef.close({
          name: formValue.name,
          userIds: finalUserIds
        });
      } catch (error: unknown) {
        console.error('Error creating users:', error);
        // You might want to show an error message here
      }
    }
  }
}
