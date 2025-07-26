import {Component, Input} from '@angular/core';
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
    <button matTooltip="Skopiuj link do tego rozliczenia" mat-icon-button (click)="copyUrl()" aria-label="Kopiuj link">
      <mat-icon class="copy-icon">content_copy</mat-icon>
    </button>
  `,
  styles: [`
    button {
      color: #3f51b5;
    }

    .copy-icon {
      width: 18px;
      height: 18px;
      font-size: 18px;
    }
  `]
})
export class CopyUrlButtonComponent {
  constructor(
    private clipboard: Clipboard,
    private snackBar: MatSnackBar
  ) {
  }

  @Input() url: string = '';

  copyUrl(): void {
    this.clipboard.copy(this.url);
    this.snackBar.open('Skopiowano URL rozliczenia do schowka!', 'Zamknij', {
      duration: 3000
    });
  }
}
