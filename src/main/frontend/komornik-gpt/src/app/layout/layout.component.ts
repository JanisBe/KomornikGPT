import {Component, HostListener, OnInit, ViewChild} from '@angular/core';
import {RouterModule} from '@angular/router';
import {AuthService} from '../core/services/auth.service';
import {User} from '../core/models/user.model';
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {MatToolbarModule} from "@angular/material/toolbar";
import {MatSidenav, MatSidenavModule} from "@angular/material/sidenav";
import {MatListModule} from "@angular/material/list";
import {GroupService} from "../core/services/group.service";
import {Group} from "../core/models/group.model";
import {Observable, of} from "rxjs";
import {MatMenuModule} from "@angular/material/menu";
import {AsyncPipe} from "@angular/common";
import {MatExpansionModule} from "@angular/material/expansion";

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterModule, MatButtonModule, MatIconModule, MatToolbarModule, MatSidenavModule, MatListModule, MatMenuModule, AsyncPipe, MatExpansionModule],
  template: `
    <mat-toolbar color="primary">
      <button mat-icon-button class="menu-button" (click)="sidenav.toggle()">
        <mat-icon>menu</mat-icon>
      </button>
      <span class="app-name" routerLink="/">Komornik</span>

      <span class="spacer"></span>

      <div class="desktop-nav">
        @if (authService.isAuthenticated()) {
          <a mat-button [matMenuTriggerFor]="groupsMenu" routerLinkActive="active">Grupy</a>
          <mat-menu #groupsMenu="matMenu">
            <a mat-menu-item routerLink="/groups">Wszystkie grupy</a>
            @if ((myGroups$ | async)?.length) {
              <hr>
              @for (group of myGroups$ | async; track group.id) {
                <a mat-menu-item [routerLink]="['/groups', group.id]">{{ group.name }}</a>
              }
            }
          </mat-menu>
          <a mat-button routerLink="/expenses" routerLinkActive="active">Moje wydatki</a>
          <a mat-button routerLink="/profile" routerLinkActive="active">Profil ({{ userName }})</a>
          <a mat-button (click)="logout()">Logout</a>
        } @else {
          <a mat-button routerLink="/login" routerLinkActive="active">Zaloguj</a>
          <a mat-button routerLink="/register" routerLinkActive="active">Zarejestruj</a>
        }
        @if (showInstallButton) {
          <button mat-button (click)="installPWA()">
            <mat-icon>cloud_download</mat-icon>
            Zainstaluj
          </button>
        }
      </div>
    </mat-toolbar>

    <mat-sidenav-container class="sidenav-container">
      <mat-sidenav #sidenav mode="over" [fixedInViewport]="true" [fixedTopGap]="64">
        <mat-nav-list>
          @if (authService.isAuthenticated()) {
            <mat-accordion>
              <mat-expansion-panel class="mat-elevation-z0">
                <mat-expansion-panel-header>Grupy</mat-expansion-panel-header>
                <ng-template matExpansionPanelContent>
                  <mat-nav-list>
                    <a mat-list-item routerLink="/groups" routerLinkActive="active" (click)="sidenav.close()">Wszystkie
                      grupy</a>
                    @for (group of myGroups$ | async; track group.id) {
                      <a mat-list-item [routerLink]="['/groups', group.id]"
                         (click)="sidenav.close()">{{ group.name }}</a>
                    }
                  </mat-nav-list>
                </ng-template>
              </mat-expansion-panel>
            </mat-accordion>
            <a mat-list-item routerLink="/expenses" routerLinkActive="active" (click)="sidenav.close()">Moje wydatki</a>
            <a mat-list-item routerLink="/profile" routerLinkActive="active" (click)="sidenav.close()">Profil
              ({{ userName }})</a>
            <a mat-list-item (click)="logout(); sidenav.close()">Logout</a>
          } @else {
            <a mat-list-item routerLink="/login" routerLinkActive="active" (click)="sidenav.close()">Zaloguj</a>
            <a mat-list-item routerLink="/register" routerLinkActive="active" (click)="sidenav.close()">Zarejestruj</a>
          }
          @if (showInstallButton) {
            <a mat-list-item (click)="installPWA(); sidenav.close()">
              <mat-icon>cloud_download</mat-icon>
              Zainstaluj aplikację
            </a>
          }
        </mat-nav-list>
      </mat-sidenav>

      <mat-sidenav-content>
        <div class="content-container">
          <router-outlet></router-outlet>
        </div>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .spacer {
      flex: 1 1 auto;
    }

    .sidenav-container {
      height: calc(100vh - 64px);
    }

    .mat-toolbar {
      padding: 0 16px;
    }

    .app-name {
      font-size: 20px;
      font-weight: 500;
      cursor: pointer;
    }

    .desktop-nav {
      display: flex;
      gap: 8px;
    }

    .desktop-nav a {
      color: white;
      text-decoration: none;
    }

    .desktop-nav a.active {
      font-weight: bold;
    }

    .mat-sidenav-content {
      padding: 20px;
    }

    .menu-button {
      display: none;
    }

    .mat-expansion-panel-header {
      padding: 0 16px;
      font-family: var(--mdc-list-list-item-label-text-font),serif;
      font-size: var(--mdc-list-list-item-label-text-size);
      font-weight: var(--mdc-list-list-item-label-text-weight);
    }

    .mat-expansion-panel .mat-nav-list a[mat-list-item] {
      padding-left: 32px;
    }

    @media (max-width: 768px) {
      .desktop-nav {
        display: none;
      }

      .menu-button {
        display: block;
      }

      .mat-sidenav-content {
        padding: 10px;
      }
    }
  `]
})
export class LayoutComponent implements OnInit {
  userName = '';
  deferredPrompt: any;
  showInstallButton = false;
  myGroups$: Observable<Group[]> = of([]);

  @ViewChild('sidenav') sidenav!: MatSidenav;

  constructor(public authService: AuthService, private groupService: GroupService) {
  }

  ngOnInit(): void {
    this.authService.user$.subscribe({
      next: (user: User | null) => {
        this.userName = user?.name ?? '';
        if (user) {
          this.myGroups$ = this.groupService.getMyGroups();
        } else {
          this.myGroups$ = of([]);
        }
      }
    });
  }

  @HostListener('window:beforeinstallprompt', ['$event'])
  onbeforeinstallprompt(e: Event) {
    e.preventDefault();
    this.deferredPrompt = e;
    if (this.isMobileDevice()) {
      this.showInstallButton = true;
    }
  }

  installPWA() {
    this.deferredPrompt.prompt();
    this.deferredPrompt.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the A2HS prompt');
      } else {
        console.log('User dismissed the A2HS prompt');
      }
      this.deferredPrompt = null;
      this.showInstallButton = false;
    });
  }

  logout(): void {
    this.authService.logout();
  }

  private isMobileDevice(): boolean {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    return /android|ipad|iphone|ipod/i.test(userAgent);
  }
}

