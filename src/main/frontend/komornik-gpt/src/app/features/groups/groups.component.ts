import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatCardModule} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {RouterModule} from '@angular/router';
import {Group} from '../../core/models/group.model';
import {MatTooltipModule} from '@angular/material/tooltip';
import {GroupService} from '../../core/services/group.service';
import {DeleteGroupDialogComponent} from './delete-group-dialog/delete-group-dialog.component';
import {EditGroupDialogComponent} from './edit-group-dialog/edit-group-dialog.component';
import {CreateGroupDialogComponent} from './create-group-dialog/create-group-dialog.component';
import {AuthService} from '../../core/services/auth.service';
import {MatSnackBar, MatSnackBarModule} from '@angular/material/snack-bar';
import {User} from '../../core/models/user.model';
import {forkJoin} from 'rxjs';
import {UserService} from '../../core/services/user.service';
import {AddExpenseDialogComponent} from './add-expense-dialog/add-expense-dialog.component';
import {ExpenseService} from '../../core/services/expense.service';

@Component({
  selector: 'app-groups',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatTooltipModule,
    MatSnackBarModule,
    RouterModule
  ],
  template: `
    <div class="container mt-4">
      <div class="row">
        <div class="col-12 mb-4 d-flex justify-content-between align-items-center">
          <h1>Groups</h1>
          <button mat-raised-button color="primary" (click)="createGroup()">
            <mat-icon>add</mat-icon>
            Create Group
          </button>
        </div>
      </div>
      <div class="row">
        <div class="col-md-6 mb-4" *ngFor="let group of groups">
          <mat-card>
            <mat-card-header>
              <mat-card-title>{{ group.name }}</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <p class="mb-0">Members:</p>
              @for (user of group.users; let isLast = $last; track user) {
                <span matTooltip="{{user.email}}">{{ user.name }}{{ isLast ? '' : ', ' }}</span>
              }
            </mat-card-content>
            <mat-card-actions align="end">
              <button mat-icon-button color="primary" (click)="addExpense(group)"
                      matTooltip="Add expense">
                <mat-icon>add_shopping_cart</mat-icon>
              </button>
              <button mat-icon-button color="primary" (click)="editGroup(group)"
                      [disabled]="!canEditGroup(group)"
                      [matTooltip]="canEditGroup(group) ? 'Edit group' : 'You can only edit groups you created'">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button color="warn" (click)="deleteGroup(group)"
                      [disabled]="!canDeleteGroup(group)"
                      [matTooltip]="canDeleteGroup(group) ? 'Delete group' : 'You can only delete groups you created'">
                <mat-icon>delete</mat-icon>
              </button>
              <button mat-icon-button color="accent" (click)="viewExpenses(group)"
                      matTooltip="View expenses">
                <mat-icon>receipt</mat-icon>
              </button>
              <button mat-icon-button color="primary" (click)="settleExpenses(group)"
                      matTooltip="Settle expenses">
                <mat-icon>payments</mat-icon>
              </button>
            </mat-card-actions>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 20px;
    }

    .row {
      display: flex;
      flex-wrap: wrap;
      margin: -15px;
    }

    .col-md-6 {
      flex: 0 0 50%;
      max-width: 50%;
      padding: 15px;
      display: flex;
    }

    .mb-4 {
      margin-bottom: 1.5rem !important;
    }

    h1 {
      font-size: 2rem;
      font-weight: 500;
      margin-bottom: 0;
    }

    mat-card {
      width: 100%;
      display: flex;
      flex-direction: column;
    }

    mat-card-content {
      flex: 1;
      padding: 16px;
    }

    mat-card-actions {
      padding: 16px;
      margin-top: auto;
      display: flex;
      gap: 8px;
      justify-content: flex-end;
      flex-wrap: wrap;
    }

    @media (max-width: 768px) {
      .col-md-6 {
        flex: 0 0 100%;
        max-width: 100%;
      }

      mat-card-actions {
        justify-content: center;
      }

      .container {
        padding: 10px;
      }
    }

    @media (max-width: 480px) {
      mat-card-actions {
        padding: 8px;
        gap: 4px;
      }

      mat-card-content {
        padding: 8px;
      }
    }

    .d-flex {
      display: flex !important;
    }

    .justify-content-between {
      justify-content: space-between !important;
    }

    .align-items-center {
      align-items: center !important;
    }
  `]
})
export class GroupsComponent implements OnInit {
  groups: Group[] = [];
  currentUser: User | null = null;

  constructor(
    private groupService: GroupService,
    private dialog: MatDialog,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private userService: UserService,
    private expenseService: ExpenseService
  ) {
  }

  ngOnInit(): void {
    // Load both user and groups data in parallel
    forkJoin({
      user: this.authService.getCurrentUser(),
      groups: this.groupService.getGroups()
    }).subscribe({
      next: ({user, groups}) => {
        this.currentUser = user;
        this.groups = groups;
      },
      error: (error) => {
        console.error('Error loading data:', error);
        this.snackBar.open('Error loading data', 'Close', {
          duration: 3000
        });
      }
    });
  }

  createGroup(): void {
    const dialogRef = this.dialog.open(CreateGroupDialogComponent, {
      width: '70%'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.groupService.createGroup(result).subscribe({
          next: (newGroup) => {
            this.groups = [...this.groups, newGroup];
            this.snackBar.open('Group created successfully', 'Close', {
              duration: 3000
            });
          },
          error: (error) => {
            console.error('Error creating group:', error);
            this.snackBar.open('Error creating group', 'Close', {
              duration: 3000
            });
          }
        });
      }
    });
  }

  canEditGroup(group: Group): boolean {
    return this.canDeleteGroup(group);
  }

  canDeleteGroup(group: Group): boolean {
    if (!this.currentUser || !group) return false;

    // Check if the current user is part of the group
    const isGroupMember = group.users.some(user => user.id === this.currentUser?.id);
    if (!isGroupMember) return false;

    // Check if the current user is the creator of the group
    return group.createdBy?.id === this.currentUser.id;
  }

  editGroup(group: Group): void {
    if (!this.canEditGroup(group)) {
      this.snackBar.open('You can only edit groups you created', 'Close', {
        duration: 3000
      });
      return;
    }

    const dialogRef = this.dialog.open(EditGroupDialogComponent, {
      width: '500px',
      data: {group, currentUser: this.currentUser}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.groupService.updateGroup(group.id, result).subscribe({
          next: (updatedGroup) => {
            const index = this.groups.findIndex(g => g.id === updatedGroup.id);
            if (index !== -1) {
              this.groups[index] = updatedGroup;
              this.groups = [...this.groups]; // Trigger change detection
            }
            this.snackBar.open('Group updated successfully', 'Close', {
              duration: 3000
            });
          },
          error: (error) => {
            console.error('Error updating group:', error);
            this.snackBar.open('Error updating group', 'Close', {
              duration: 3000
            });
          }
        });
      }
    });
  }

  deleteGroup(group: Group): void {
    if (!this.canDeleteGroup(group)) {
      this.snackBar.open('You can only delete groups you created', 'Close', {
        duration: 3000
      });
      return;
    }

    const dialogRef = this.dialog.open(DeleteGroupDialogComponent, {
      width: '400px',
      data: group
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.groupService.deleteGroup(group.id).subscribe({
          next: () => {
            this.groups = this.groups.filter(g => g.id !== group.id);
            this.snackBar.open('Group deleted successfully', 'Close', {
              duration: 3000
            });
          },
          error: (error) => {
            console.error('Error deleting group:', error);
            this.snackBar.open('Error deleting group', 'Close', {
              duration: 3000
            });
          }
        });
      }
    });
  }

  viewExpenses(group: Group): void {
    // TODO: Implement expenses view
  }

  settleExpenses(group: Group): void {
    // TODO: Implement expenses settlement
  }

  addExpense(group: Group): void {
    const dialogRef = this.dialog.open(AddExpenseDialogComponent, {
      width: '500px',
      data: {group, currentUser: this.currentUser}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.expenseService.createExpense(result).subscribe({
          next: () => {
            this.snackBar.open('Expense added successfully', 'Close', {
              duration: 3000
            });
          },
          error: (error) => {
            console.error('Error adding expense:', error);
            this.snackBar.open('Error adding expense', 'Close', {
              duration: 3000
            });
          }
        });
      }
    });
  }
}
