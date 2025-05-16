import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {HttpClient} from '@angular/common/http';
import {MatSnackBar} from '@angular/material/snack-bar';
import {environment} from '../../../../environments/environment';
import {MatTableModule} from '@angular/material/table';
import {MatButtonModule} from '@angular/material/button';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {DecimalPipe, NgTemplateOutlet} from '@angular/common';

export interface SettlementDto {
  from: string;
  to: string;
  amount: number;
  currency: string;
}

@Component({
  selector: 'app-settle-expenses-dialog',
  standalone: true,
  imports: [MatDialogModule, MatTableModule, MatButtonModule, MatProgressSpinnerModule, DecimalPipe, NgTemplateOutlet],
  template: `
    <h1 mat-dialog-title>Rozliczenie grupy</h1>
    @if (!loading) {
      <div mat-dialog-content>
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
  displayedColumns = ['from', 'to', 'amount'];
  loading = true;
  settling = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { group: any; },
    private dialogRef: MatDialogRef<SettleExpensesDialogComponent>,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
  }

  ngOnInit(): void {
    this.http.get<SettlementDto[]>(`${environment.apiUrl}/expenses/groups/${this.data.group.id}/settlement`).subscribe({
      next: settlements => {
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
        this.http.post(`${environment.apiUrl}/expenses/groups/${this.data.group.id}/settle`, {}).subscribe({
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
