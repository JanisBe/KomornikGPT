import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-groups',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="row">
      <div class="col-12">
        <h1>Groups</h1>
        <p>Your groups will be displayed here.</p>
      </div>
    </div>
  `
})
export class GroupsComponent {} 