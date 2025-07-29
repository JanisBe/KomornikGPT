import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import {GroupService} from '../../core/services/group.service';
import {Group} from '../../core/models/group.model';
import {MatCardModule} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatListModule} from '@angular/material/list';
import {AuthService} from '../../core/services/auth.service';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatDialog} from '@angular/material/dialog';
import {SettleExpensesDialogComponent} from '../expenses/settle-expenses-dialog';
import {AddExpenseDialogComponent} from '../expenses/add-expense-dialog/add-expense-dialog.component';
import {HttpErrorResponse} from '@angular/common/http';
import {ExpenseService} from '../../core/services/expense.service';
import {User} from '../../core/models/user.model';
import {MatSnackBar} from '@angular/material/snack-bar';
import {EditGroupDialogComponent} from './edit-group-dialog/edit-group-dialog.component';
import {DeleteGroupDialogComponent} from './delete-group-dialog/delete-group-dialog.component';
import {BreakpointObserver, Breakpoints} from '@angular/cdk/layout';
import {map} from 'rxjs/operators';
import {Observable} from 'rxjs';

@Component({
  selector: 'app-group-details',
  standalone: true,
  imports: [RouterModule, MatCardModule, MatIconModule, MatButtonModule, MatListModule, MatProgressSpinner, MatTooltipModule],
  template: `
    @if (group; as g) {
      <div class="container mt-4">
        <mat-card>
          <mat-card-header>
            <mat-card-title>
              <div style="display: flex; align-items: center;">
                <span>{{ g.name }}</span>
                <mat-icon style="margin-left: 13px;" (click)="viewExpenses(group)" matTooltip="Zobacz wydatki">receipt
                </mat-icon>
                <mat-icon style="margin-left: 13px;" (click)="settleExpenses(group)" matTooltip="Rozlicz wydatki">
                  payments
                </mat-icon>
                <mat-icon style="margin-left: 13px;" (click)="addExpense(group)" matTooltip="Dodaj wydatek">
                  add_shopping_cart
                </mat-icon>
                <mat-icon style="margin-left: 13px;" (click)="editGroup(group)" matTooltip="Edytuj grupę"
                          [hidden]="!canEditGroup(group)">edit
                </mat-icon>
                <mat-icon style="margin-left: 13px; color: red" (click)="deleteGroup(group)" matTooltip="Usuń grupę"
                          [hidden]="!canDeleteGroup(group)">delete
                </mat-icon>
              </div>
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            @if (g.description) {
              <p>{{ g.description }}</p>
            }

            <p><strong>Członkowie:</strong></p>
            <mat-list>
              @for (member of g.members; track member.id) {
                <mat-list-item>
                  <mat-icon>person</mat-icon>
                  {{ member.name }} ({{ member.email }})
                </mat-list-item>
              }
            </mat-list>

            @if (!g.isPublic && !isAuthenticated) {
              <div class="text-danger">
                <p>Ta grupa jest prywatna. Zaloguj się, aby do niej wejść</p>
              </div>
            }
          </mat-card-content>
        </mat-card>
      </div>
    }

    @if (loading) {
      <div class="text-center mt-4">
        <mat-spinner></mat-spinner>
      </div>
    }

    @if (error) {
      <div class="text-center mt-4 text-danger">
        <p>{{ error }}</p>
      </div>
    }
  `,
  styles: [`
    .container {
      max-width: 700px;
      margin: 0 auto;
      padding: 20px;
    }

    .text-danger {
      color: #f44336;
    }

    .text-center {
      text-align: center;
    }

    mat-card {
      margin-top: 24px;
    }
  `]
})
export class GroupDetailsComponent implements OnInit {
  group: Group | null = null;
  loading = true;
  error: string | null = null;
  isAuthenticated = false;
  currentUser: User | null = null;
  isMobile$: Observable<boolean>;

  constructor(
    private route: ActivatedRoute,
    private groupService: GroupService,
    private authService: AuthService,
    private dialog: MatDialog,
    private expenseService: ExpenseService,
    private snackBar: MatSnackBar,
    private router: Router,
    private breakpointObserver: BreakpointObserver
  ) {
    this.isMobile$ = this.breakpointObserver.observe(Breakpoints.Handset)
      .pipe(map(result => result.matches));
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    const viewToken = this.route.snapshot.queryParamMap.get('token');
    if (!id) {
      this.error = 'Nieprawidłowy identyfikator grupy';
      this.loading = false;
      return;
    }
    this.authService.getCurrentUser().subscribe(
      (user) => {
        this.currentUser = user;
        this.isAuthenticated = !!user;
      }
    );
    this.groupService.getGroup(+id, viewToken).subscribe({
      next: (group) => {
        this.group = group;
        this.loading = false;
      },
      error: () => {
        this.error = 'Nie znaleziono grupy lub nie masz dostępu do niej';
        this.loading = false;
      }
    });
  }

  canEditGroup(group: Group): boolean {
    return this.canDeleteGroup(group);
  }

  canDeleteGroup(group: Group): boolean {
    if (!this.currentUser || !group || !group.members) return false;

    // Check if the current user is part of the group
    const isGroupMember = group.members.some(member => member.id === this.currentUser?.id);
    if (!isGroupMember) return false;

    // Check if the current user is the creator of the group
    return group.createdBy?.id === this.currentUser.id;
  }

  viewExpenses(group: Group): void {
    this.router.navigate(['/groups', group.id, 'expenses']);
  }

  settleExpenses(group: Group): void {
    const dialogRef = this.dialog.open(SettleExpensesDialogComponent, {
      width: '600px',
      data: {group}
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('Wydatki zostały rozliczone!', 'Zamknij', {duration: 3000});
      }
    });
  }

  addExpense(group: Group): void {
    this.isMobile$.subscribe(isMobile => {
      const dialogConfig = {
        data: {group, currentUser: this.currentUser},
        width: isMobile ? '100vw' : '800px',
        maxWidth: isMobile ? '100vw' : '90vw',
        height: isMobile ? '100vh' : undefined,
        maxHeight: isMobile ? '100vh' : '90vh',
        panelClass: isMobile ? 'mobile-dialog-container' : undefined
      };

      const dialogRef = this.dialog.open(AddExpenseDialogComponent, dialogConfig);

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.expenseService.createExpense(result).subscribe({
            next: () => {
              this.snackBar.open('Wydatek został dodany', 'Zamknij', {
                duration: 3000
              });
            },
            error: (error: HttpErrorResponse) => {
              console.error(error);
              this.snackBar.open('Bład podczas dodawania wydatku', 'Zamknij', {
                duration: 3000
              });
            }
          });
        }
      });
    });
  }

  editGroup(group: Group): void {
    if (!this.canEditGroup(group)) {
      this.snackBar.open('Możesz tylko edytować swoje grupy', 'Zamknij', {
        duration: 3000
      });
      return;
    }

    const dialogRef = this.dialog.open(EditGroupDialogComponent, {
      width: '70%',
      data: {group, currentUser: this.currentUser}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.groupService.updateGroup(group.id, result).subscribe({
          next: (updatedGroup) => {
            this.group = updatedGroup;
            this.snackBar.open('Grupa została zaktualizowana', 'Zamknij', {
              duration: 3000
            });
          },
          error: (error) => {
            console.error(error);
            this.snackBar.open('Bład podczas aktualizacji grupy', 'Zamknij', {
              duration: 3000
            });
          }
        });
      }
    });
  }

  deleteGroup(group: Group): void {
    if (!this.canDeleteGroup(group)) {
      this.snackBar.open('Możesz tylko usuwać swoje grupy', 'Zamknij', {
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
            this.router.navigate(['/groups']);
            this.snackBar.open('Grupa została usunieta', 'Zamknij', {
              duration: 3000
            });
          },
          error: (error: HttpErrorResponse) => {
            console.error(error);
            this.snackBar.open('Bład podczas usuwania grupy', 'Zamknij', {
              duration: 3000
            });
          }
        });
      }
    });
  }
}
