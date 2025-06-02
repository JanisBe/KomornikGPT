import {Component, OnInit} from '@angular/core';

import {ActivatedRoute, RouterModule} from '@angular/router';
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
  imports: [RouterModule, MatCardModule, MatIconModule, MatButtonModule, MatListModule, MatProgressSpinner],
  template: `
    @if (group; as g) {
      <div class="container mt-4">
        <mat-card>
          <mat-card-header>
            <mat-card-title routerLink="/group/{{ g.id }}">{{ g.name }}</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            @if (g.description) {
              <p>{{ g.description }}</p>
            }

            <p><strong>Członkowie:</strong></p>
            <mat-list>
              @for (member of g.members; track member.id) {
                <mat-list-item>
                  <mat-icon matListIcon>person</mat-icon>
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

  constructor(
    private route: ActivatedRoute,
    private groupService: GroupService,
    private authService: AuthService
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
