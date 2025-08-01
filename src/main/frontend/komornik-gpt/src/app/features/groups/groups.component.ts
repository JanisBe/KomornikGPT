import {Component, OnInit} from '@angular/core';

import {MatCardModule} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {Router, RouterModule} from '@angular/router';
import {Group} from '../../core/models/group.model';
import {MatTooltipModule} from '@angular/material/tooltip';
import {GroupService} from '../../core/services/group.service';
import {DeleteGroupDialogComponent} from './delete-group-dialog/delete-group-dialog.component';
import {EditGroupDialogComponent} from './edit-group-dialog/edit-group-dialog.component';
import {CreateGroupDialogComponent} from './create-group-dialog/create-group-dialog.component';
import {AuthService} from '../../core/services/auth.service';
import {MatSnackBar, MatSnackBarModule} from '@angular/material/snack-bar';
import {User} from '../../core/models/user.model';
import {forkJoin, Observable} from 'rxjs';
import {AddExpenseDialogComponent} from '../expenses/add-expense-dialog/add-expense-dialog.component';
import {ExpenseService} from '../../core/services/expense.service';
import {HttpErrorResponse} from '@angular/common/http';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatNativeDateModule} from '@angular/material/core';
import {DATE_PROVIDERS} from '../../core/config/date.config';
import {SettleExpensesDialogComponent} from '../expenses/settle-expenses-dialog';
import {CopyUrlButtonComponent} from '../expenses/copy-url-button';
import {BreakpointObserver, Breakpoints} from '@angular/cdk/layout';
import {map} from 'rxjs/operators';

@Component({
  selector: 'app-groups',
  standalone: true,
  imports: [
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatTooltipModule,
    MatSnackBarModule,
    RouterModule,
    MatDatepickerModule,
    MatNativeDateModule,
    CopyUrlButtonComponent
  ],
  providers: [
    MatDatepickerModule,
    MatNativeDateModule,
    ...DATE_PROVIDERS
  ],
  template: `
    <div class="container mt-4">
      <div class="row">
        <div class="col-12 mb-4">
          <button mat-raised-button color="primary" (click)="openCreateGroupDialog()">
            <mat-icon>add</mat-icon>
            Stwórz nową grupę
          </button>
        </div>
      </div>
      <div class="row">
        @for (group of groups; track group.id) {
          <div class="col-md-6 mb-4">
            <mat-card class="group-card">
              <mat-card-header>
                <mat-card-title>
                  <copy-url-button [groupId]="group.id" [viewToken]="group.viewToken" [groupName]="group.name"/>
                  <a [routerLink]="'/groups/' + group.id" class="hand">
                    {{ group.name }}
                    <span matTooltip="{{ group.isPublic ? 'Publiczna' : 'Prywatna' }}">
                      <mat-icon>{{ group.isPublic ? 'public' : 'lock' }}</mat-icon>
                    </span>
                  </a>
                </mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <p class="mb-0">Członkowie:</p>
                @for (member of group.members; let isLast = $last; track member) {
                  <span matTooltip="{{member.email}}">{{ member.name }}{{
                      isLast ? '' : ', '
                    }}</span>
                }
              </mat-card-content>
              <mat-card-actions align="end">
                <button mat-icon-button color="primary" (click)="addExpense(group)"
                        matTooltip="Dodaj wydatek">
                  <mat-icon>add_shopping_cart</mat-icon>
                </button>
                <button mat-icon-button color="primary" (click)="editGroup(group)"
                        [disabled]="!canEditGroup(group)"
                        [matTooltip]="canEditGroup(group) ? 'Edytuj grupę' : 'Możesz edytkować tylko grupy, które stworzyłeś'">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button color="warn" (click)="deleteGroup(group)"
                        [disabled]="!canDeleteGroup(group)"
                        [matTooltip]="canDeleteGroup(group) ? 'Skasuj grupę' : 'Możesz skasować tylko grupy, które stworzyłeś'">
                  <mat-icon>delete</mat-icon>
                </button>
                <button mat-icon-button color="accent" (click)="viewExpenses(group)"
                        matTooltip="Zobacz wydatki">
                  <mat-icon>receipt</mat-icon>
                </button>
                <button mat-icon-button color="primary" (click)="settleExpenses(group)"
                        matTooltip="Rozlicz wydatki">
                  <mat-icon>payments</mat-icon>
                </button>
              </mat-card-actions>
            </mat-card>
          </div>
        } @empty {
          <div class="col-12">
            <mat-card>
              <mat-card-content>
                <p class="text-center">Nie masz zarejestrowanych grup, <span
                  (click)="openCreateGroupDialog()" class="link-primary cursor">stwórz je</span></p>
              </mat-card-content>
            </mat-card>
          </div>
        }
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

    mat-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    mat-card-title copy-url-button {
      display: flex;
      align-items: center;
      margin-top: -20px;
    }

    mat-card-title a {
      display: inline-flex;
      align-items: center;
    }

    mat-card-title mat-icon {
      font-size: 18px;
      margin-left: 8px;
      vertical-align: middle;
    }

    mat-card-actions {
      padding: 16px;
      margin-top: auto;
      display: flex;
      gap: 8px;
      justify-content: flex-end;
      flex-wrap: wrap;
    }

    .hand {
      text-decoration: none;
      color: inherit;
      display: flex;
      align-items: center;
    }

    cursor {
      cursor: pointer;
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
  `]
})
export class GroupsComponent implements OnInit {
  groups: Group[] = [];
  currentUser: User | null = null;
  windowOrigin: string = window.location.origin;
  isMobile$: Observable<boolean>;

  constructor(
    private groupService: GroupService,
    private dialog: MatDialog,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private expenseService: ExpenseService,
    private router: Router,
    private breakpointObserver: BreakpointObserver
  ) {
    this.isMobile$ = this.breakpointObserver.observe(Breakpoints.Handset)
      .pipe(map(result => result.matches));
  }

  ngOnInit(): void {
    forkJoin({
      user: this.authService.getCurrentUser(),
      groups: this.groupService.getMyGroups()
    }).subscribe({
      next: ({user, groups}) => {
        this.currentUser = user;
        this.groups = groups;
      },
      error: (error: HttpErrorResponse) => {
        console.error(error);
        this.snackBar.open('Błąd podczas ładowania danych', 'Zamknij', {
          duration: 3000
        });
      }
    });
  }

  openCreateGroupDialog(): void {
    this.createGroup();
  }

  getMembersList(group: Group): string {
    if (!group.members || group.members.length === 0) {
      return 'No members';
    }
    return group.members.map(member => member.name).join(', ');
  }

  createGroup(): void {
    this.isMobile$.subscribe(isMobile => {
      const dialogConfig = {
        width: isMobile ? '100vw' : '800px',
        maxWidth: isMobile ? '100vw' : '90vw',
        height: isMobile ? '100vh' : undefined,
        maxHeight: isMobile ? '100vh' : '90vh',
        panelClass: isMobile ? 'mobile-dialog-container' : undefined
      };

      const dialogRef = this.dialog.open(CreateGroupDialogComponent, dialogConfig);

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.groupService.createGroup(result).subscribe({
            next: (newGroup) => {
              this.groups = [...this.groups, newGroup];
              this.snackBar.open('Grupa została utworzona', 'Zamknij', {
                duration: 3000
              });
            },
            error: (error) => {
              console.error(error);
              this.snackBar.open('Nie udało się utworzyć grupy', 'Zamknij', {
                duration: 3000
              });
            }
          });
        }
      });
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

  editGroup(group: Group): void {
    if (!this.canEditGroup(group)) {
      this.snackBar.open('Możesz tylko edytować swoje grupy', 'Zamknij', {
        duration: 3000
      });
      return;
    }

    this.isMobile$.subscribe(isMobile => {
      const dialogConfig = {
        data: {group, currentUser: this.currentUser},
        width: isMobile ? '100vw' : '800px',
        maxWidth: isMobile ? '100vw' : '90vw',
        height: isMobile ? '100vh' : undefined,
        maxHeight: isMobile ? '100vh' : '90vh',
        panelClass: isMobile ? 'mobile-dialog-container' : undefined
      };

      const dialogRef = this.dialog.open(EditGroupDialogComponent, dialogConfig);

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.groupService.updateGroup(group.id, result).subscribe({
            next: (updatedGroup) => {
              const index = this.groups.findIndex(g => g.id === updatedGroup.id);
              if (index !== -1) {
                this.groups[index] = updatedGroup;
                this.groups = [...this.groups];
                console.log(this.groups)// Trigger change detection
              }
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
            this.groups = this.groups.filter(g => g.id !== group.id);
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
}
