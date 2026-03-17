import {Component, inject, OnInit, signal} from '@angular/core';

import {MatCardModule} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {Router, RouterModule} from '@angular/router';
import {Group} from '../../core/models/group.model';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatMenuModule} from '@angular/material/menu';
import {GroupService} from '../../core/services/group.service';
import {DeleteGroupDialogComponent} from './delete-group-dialog/delete-group-dialog.component';
import {EditGroupDialogComponent} from './edit-group-dialog/edit-group-dialog.component';
import {CreateGroupDialogComponent} from './create-group-dialog/create-group-dialog.component';
import {AuthService} from '../../core/services/auth.service';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {User} from '../../core/models/user.model';
import {catchError, filter, Observable, of, switchMap} from 'rxjs';
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
import {NotificationService} from '../../core/services/notification.service';

@Component({
  selector: 'app-groups',
  standalone: true,
  imports: [
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatTooltipModule,
    RouterModule,
    MatDatepickerModule,
    MatNativeDateModule,
    CopyUrlButtonComponent,
    MatMenuModule,
    MatProgressSpinnerModule
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
      <div class="groups-grid">
        @if (isLoading()) {
          <div class="loading-state">
            <mat-spinner diameter="50" class="mx-auto"></mat-spinner>
            <p class="mt-3">Ładowanie grup...</p>
          </div>
        } @else {
          @for (group of groups(); track group.id) {
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
                <div class="card-menu">
                  <button mat-icon-button [matMenuTriggerFor]="cardMenu" matTooltip="Więcej opcji">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                  <mat-menu #cardMenu="matMenu" xPosition="before">
                    <button mat-menu-item (click)="editGroup(group)"
                            [disabled]="!canEditGroup(group)">
                      <mat-icon>edit</mat-icon>
                      <span>Edytuj grupę</span>
                    </button>
                    <button mat-menu-item (click)="deleteGroup(group)"
                            [disabled]="!canDeleteGroup(group)">
                      <mat-icon>delete</mat-icon>
                      <span>Usuń grupę</span>
                    </button>
                  </mat-menu>
                </div>
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
          } @empty {
            <mat-card class="empty-state">
              <mat-card-content>
                <p class="text-center">Nie masz zarejestrowanych grup,
                  <span (click)="openCreateGroupDialog()" class="link-primary cursor">stwórz je</span>
                </p>
              </mat-card-content>
            </mat-card>
          }
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

    .groups-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 24px;
      margin-bottom: 24px;
      margin-top: 24px;
    }

    .loading-state, .empty-state {
      grid-column: 1 / -1;
      width: 100%;
      text-align: center;
      padding: 48px 0;
    }

    .group-card {
      height: 100%;
      display: flex;
      flex-direction: column;
      transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
    }

    .group-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
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

    mat-card-header {
      position: relative;
    }

    mat-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      padding-right: 48px;
    }

    .card-menu {
      position: absolute;
      top: 8px;
      right: 8px;
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

    .mat-card-title mat-icon {
      font-size: 18px;
      margin-left: 8px;
      vertical-align: middle;
      color: var(--mat-sys-on-surface-variant);
    }

    .mx-auto {
      margin-left: auto;
      margin-right: auto;
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
      gap: 10px;
    }

    cursor {
      cursor: pointer;
    }

    @media (max-width: 768px) {
      .groups-grid {
        grid-template-columns: 1fr;
        gap: 16px;
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
  groups = signal<Group[]>([]);
  currentUser: User | null = null;
  isLoading = signal(true);
  windowOrigin: string = window.location.origin;
  isMobile$: Observable<boolean>;

  private groupService = inject(GroupService);
  private dialog = inject(MatDialog);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private expenseService = inject(ExpenseService);
  private router = inject(Router);
  private breakpointObserver = inject(BreakpointObserver);


  constructor() {
    this.isMobile$ = this.breakpointObserver.observe(Breakpoints.Handset)
      .pipe(map(result => result.matches));
  }

  ngOnInit(): void {
    this.authService.user$.pipe(
      filter(user => !!user),
      switchMap(user => {
        this.currentUser = user;
        this.isLoading.set(true);
        return this.groupService.getMyGroups().pipe(
          catchError(error => {
            console.error('GroupsComponent: Error fetching groups', error);
            this.notificationService.showError('Błąd podczas ładowania grup');
            return of([]);
          })
        );
      })
    ).subscribe({
      next: (groups) => {
        this.groups.set(groups);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('GroupsComponent: Global error in subscription', error);
        this.isLoading.set(false);
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
              this.groups.update(groups => [...groups, newGroup]);
              this.notificationService.showSuccess('Grupa została utworzona');
            },
            error: (error) => {
              console.error(error);
              this.notificationService.showError('Nie udało się utworzyć grupy');
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
      this.notificationService.showError('Możesz tylko edytować swoje grupy');
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
              this.groups.update(groups => {
                const index = groups.findIndex(g => g.id === updatedGroup.id);
                if (index !== -1) {
                  const newGroups = [...groups];
                  newGroups[index] = updatedGroup;
                  return newGroups;
                }
                return groups;
              });
              this.notificationService.showSuccess('Grupa została zaktualizowana');
            },
            error: (error) => {
              console.error(error);
              this.notificationService.showError('Bład podczas aktualizacji grupy');
            }
          });
        }
      });
    });
  }

  deleteGroup(group: Group): void {
    if (!this.canDeleteGroup(group)) {
      this.notificationService.showError('Możesz tylko usuwać swoje grupy');
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
            this.groups.update(groups => groups.filter(g => g.id !== group.id));
            this.notificationService.showSuccess('Grupa została usunieta');
          },
          error: (error: HttpErrorResponse) => {
            console.error(error);
            this.notificationService.showError('Bład podczas usuwania grupy');
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
        this.notificationService.showSuccess('Wydatki zostały rozliczone!');
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
              this.notificationService.showSuccess('Wydatek został dodany');
            },
            error: (error: HttpErrorResponse) => {
              console.error(error);
              this.notificationService.showError('Bład podczas dodawania wydatku');
            }
          });
        }
      });
    });
  }
}
