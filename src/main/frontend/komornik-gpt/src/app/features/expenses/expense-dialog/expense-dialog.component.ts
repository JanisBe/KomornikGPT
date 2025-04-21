import {Component} from '@angular/core';
import {DATE_PROVIDERS} from '../../../core/config/date.config';

@Component({
  selector: 'app-expense-dialog',
  templateUrl: './expense-dialog.component.html',
  styleUrls: ['./expense-dialog.component.scss'],
  providers: [...DATE_PROVIDERS]
})
export class ExpenseDialogComponent {
  // ... existing code ...
}
