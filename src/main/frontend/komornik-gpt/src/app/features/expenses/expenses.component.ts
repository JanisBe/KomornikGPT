import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="row">
      <div class="col-12">
        <h1>Expenses</h1>
        <p>Your expenses will be displayed here.</p>
      </div>
    </div>
  `
})
export class ExpensesComponent {} 