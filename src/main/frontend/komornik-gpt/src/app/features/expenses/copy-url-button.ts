import {Component, Input, OnInit} from '@angular/core';
import {Clipboard, ClipboardModule} from '@angular/cdk/clipboard';
import {MatSnackBar, MatSnackBarModule} from '@angular/material/snack-bar';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';

import {MatTooltipModule} from '@angular/material/tooltip';

@Component({
  selector: 'copy-url-button',
  standalone: true,
  imports: [
    ClipboardModule,
    MatIconModule,
    MatButtonModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  template: `
    <div class="copy-url-button">
    <button matTooltip="Skopiuj link do tego rozliczenia" mat-icon-button (click)="copyUrl()" aria-label="Kopiuj link">
      <mat-icon class="copy-icon">content_copy</mat-icon>
    </button>
      <button matTooltip="Wyślij link do tego rozliczenia" mat-icon-button (click)="share()" aria-label="Kopiuj link">
        <mat-icon class="copy-icon">share</mat-icon>
      </button>
    </div>
  `,
  styles: [`
    .copy-url-button {
      display: flex;
      align-items: center;
      gap: 2px;
    }

    button.mat-mdc-icon-button {
      width: 32px;
      height: 32px;
      line-height: 32px;
    }

    .copy-icon {
      width: 18px;
      height: 18px;
      font-size: 18px;
    }
  `]
})
export class CopyUrlButtonComponent implements OnInit {
  constructor(
    private clipboard: Clipboard,
    private snackBar: MatSnackBar
  ) {
  }

  @Input() groupId!: number;

  @Input() viewToken?: string = '';
  @Input() groupName!: string;
  private url = '';

  ngOnInit(): void {
    this.url = window.location.origin + '/groups/' + this.groupId + '/expenses';
    if (!!this.viewToken) {
      this.url += '?token=' + this.viewToken;
    }
  }

  copyUrl(): void {
    this.clipboard.copy(this.url);
    this.snackBar.open('Skopiowano URL rozliczenia do schowka!', 'Zamknij', {
      duration: 3000
    });
  }

  share() {
    if (navigator.share) {
      navigator.share({
        title: 'Rozliczenia grupy ' + this.groupName,
        text: 'To jest naprawdę mocna rzecz...',
        url: this.url
      }).catch(() => {
      });
    } else {
      alert('Twoja przeglądarka nie obsługuje Web Share API.');
    }
  }
}
