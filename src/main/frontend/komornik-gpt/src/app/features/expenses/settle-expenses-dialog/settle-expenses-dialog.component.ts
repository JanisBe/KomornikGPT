import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatTableModule} from '@angular/material/table';
import {MatButtonModule} from '@angular/material/button';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {DecimalPipe, NgTemplateOutlet} from '@angular/common';
import {MatCheckbox, MatCheckboxChange} from '@angular/material/checkbox';
import {Group} from '../../../core/models/group.model';
import {SettlementDto} from '../../../core/models/expense.model';
import {ExpenseService} from '../../../core/services/expense.service';

@Component({
  selector: 'app-settle-expenses-dialog',
  standalone: true,
  imports: [MatDialogModule, MatTableModule, MatButtonModule, MatProgressSpinnerModule, DecimalPipe, NgTemplateOutlet, MatCheckbox],
  template: `
    <h1 mat-dialog-title>Rozliczenie grupy</h1>
    @if (!loading) {
      <div mat-dialog-content>
        @if (hasMoreCurrencies()) {
          <span>
            <mat-checkbox [checked]="this.checkboxState"
                          (change)="recalculate($event)">Przelicz wszystkie wydatki do {{ data.group.defaultCurrency }}
            </mat-checkbox>
          </span>
        }
        @if (settlements.length > 0) {
          <table mat-table [dataSource]="settlements" class="mat-elevation-z1" style="width:100%">
            <ng-container matColumnDef="from">
              <th mat-header-cell *matHeaderCellDef>Od</th>
              <td mat-cell *matCellDef="let s ">{{ s.from }}</td>
            </ng-container>

            <ng-container matColumnDef="to">
              <th mat-header-cell *matHeaderCellDef>Do</th>
              <td mat-cell *matCellDef="let s">{{ s.to }}</td>
            </ng-container>

            <ng-container matColumnDef="amount">
              <th mat-header-cell *matHeaderCellDef>Kwota</th>
              <td mat-cell *matCellDef="let s">
                {{ s.amount | number:'1.2-2' }} {{ s.currency }}
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
        } @else {
          <p>Brak rozliczeń do wykonania.</p>
        }
      </div>
    } @else {
      <ng-template [ngTemplateOutlet]="loadingTpl"></ng-template>
    }

    <ng-template #loadingTpl>
      <div class="d-flex justify-content-center p-4">
        <mat-spinner></mat-spinner>
      </div>
    </ng-template>
    <div mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Anuluj</button>
      <button mat-raised-button color="primary" (click)="onSettle()" [disabled]="settlements.length === 0 || settling">
        Rozlicz
      </button>
    </div>
  `,
  styles: [`
    table {
      margin-bottom: 16px;
    }

    th, td {
      padding: 8px;
    }
  `]
})
export class SettleExpensesDialogComponent implements OnInit {
  settlements: SettlementDto[] = [];
  originalSettlements: SettlementDto[] = [];
  recalculatedSettlements: SettlementDto[] = [];
  displayedColumns = ['from', 'to', 'amount'];
  loading = true;
  settling = false;
  checkboxState = false;
  recalculated = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { group: Group; },
    private dialogRef: MatDialogRef<SettleExpensesDialogComponent>,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private expenseService: ExpenseService
  ) {
  }

  ngOnInit(): void {
    this.expenseService.calculateExpense(this.data.group.id).subscribe({
      next: settlements => {
        this.originalSettlements = settlements;
        this.settlements = settlements;
        this.loading = false;
      },
      error: () => {
        this.snackBar.open('Błąd ładowania rozliczeń', 'Zamknij', {duration: 3000});
        this.loading = false;
      }
    });
  }

  onSettle(): void {
    const confirmRef = this.dialog.open(ConfirmSettleDialog);
    confirmRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.settling = true;
        this.expenseService.settleExpense(this.data.group.id).subscribe({
          next: () => {
            this.snackBar.open('Rozliczono wszystkie wydatki!', 'Zamknij', {duration: 3000});
            this.dialogRef.close(true);
          },
          error: () => {
            this.snackBar.open('Błąd podczas rozliczania', 'Zamknij', {duration: 3000});
            this.settling = false;
          }
        });
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  hasMoreCurrencies() {
    const currencies = new Set(this.originalSettlements.map(s => s.currency));
    return currencies.size > 1;
  }

  recalculate(event: MatCheckboxChange) {
    this.checkboxState = event.checked;
    if (event.checked) {

      this.loading = true;
      if (this.recalculated) {
        this.snackBar.open('Rozliczenia zostały już przeliczone', 'Zamknij', {duration: 3000});
        this.settlements = this.recalculatedSettlements;
        this.loading = false;
        return;
      }
      this.expenseService.recalculateExpense(this.data.group.id).subscribe({
        next: recalculatedSettlements => {
          this.settlements = recalculatedSettlements;
          this.recalculatedSettlements = recalculatedSettlements;
          this.loading = false;
          this.recalculated = true;
        },
        error: () => {
          this.snackBar.open('Błąd podczas przeliczania rozliczeń', 'Zamknij', {duration: 3000});
          this.loading = false;
          this.recalculated = false;
        }
      });
    } else {
      this.settlements = this.originalSettlements;
    }
  }
}

@Component({
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Potwierdź rozliczenie</h2>
    <mat-dialog-content>
      <p>Czy na pewno chcesz rozliczyć wszystkie wydatki w tej grupie? Tej operacji nie można cofnąć.</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close="false">Anuluj</button>
      <button mat-raised-button color="warn" [mat-dialog-close]="true">Rozlicz</button>
    </mat-dialog-actions>
  `
})
export class ConfirmSettleDialog {
}
