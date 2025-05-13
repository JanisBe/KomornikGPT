import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import {GroupService} from '../../core/services/group.service';
import {Group} from '../../core/models/group.model';
import {MatCardModule} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatListModule} from '@angular/material/list';
import {AuthService} from '../../core/services/auth.service';
import {MatProgressSpinner} from '@angular/material/progress-spinner';

@Component({
  selector: 'app-group-details',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatIconModule, MatButtonModule, MatListModule, MatProgressSpinner],
  template: `
    <div class="container mt-4" *ngIf="group">
      <mat-card>
        <mat-card-header>
          <mat-card-title routerLink="/group/{{ group.id }}">{{ group.name }}</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p *ngIf="group.description">{{ group.description }}</p>
          <p><strong>Members:</strong></p>
          <mat-list>
            <mat-list-item *ngFor="let member of group.members">
              <mat-icon matListIcon>person</mat-icon>
              {{ member.name }} ({{ member.email }})
            </mat-list-item>
          </mat-list>
          <div *ngIf="!group.isPublic && !isAuthenticated">
            <p class="text-danger">This group is private. Please log in to see more details.</p>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
    <div *ngIf="loading" class="text-center mt-4">
      <mat-spinner></mat-spinner>
    </div>
    <div *ngIf="error" class="text-center mt-4 text-danger">
      <p>{{ error }}</p>
    </div>
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

  constructor(
    private route: ActivatedRoute,
    private groupService: GroupService,
    private authService: AuthService,
    private router: Router
  ) {
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'No group id provided.';
      this.loading = false;
      return;
    }
    this.isAuthenticated = this.authService.isAuthenticated();
    this.groupService.getGroup(+id).subscribe({
      next: (group) => {
        this.group = group;
        this.loading = false;
        if (!group.isPublic && !this.isAuthenticated) {
          this.error = 'This group is private. Please log in to see more details.';
        }
      },
      error: () => {
        this.error = 'Group not found or you do not have access.';
        this.loading = false;
      }
    });
  }
}
