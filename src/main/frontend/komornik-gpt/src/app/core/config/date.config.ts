import {DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, NativeDateAdapter} from '@angular/material/core';
import {Platform} from '@angular/cdk/platform';
import {formatDate} from '@angular/common';

export const APP_DATE_FORMATS = {
  parse: {
    dateInput: 'dd/MM/yyyy',
  },
  display: {
    dateInput: 'dd/MM/yyyy',
    monthYearLabel: 'MMM yyyy',
    dateA11yLabel: 'dd/MM/yyyy',
    monthYearA11yLabel: 'MMMM yyyy',
  },
};

export class AppDateAdapter extends NativeDateAdapter {
  constructor(
    matDateLocale: string,
    platform: Platform
  ) {
    super(matDateLocale, platform);
  }

  override getFirstDayOfWeek(): number {
    return 1; // Monday
  }

  override format(date: Date, displayFormat: Object): string {
    if (displayFormat === 'input') {
      const day = date.getDate();
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      return `${this.padNumber(day)}/${this.padNumber(month)}/${year}`;
    } else if (displayFormat === 'monthYearLabel') {
      return formatDate(date, 'MMM yyyy', this.locale, 'GMT');
    }
    return formatDate(date, displayFormat as string, this.locale, 'GMT');
  }

  override parse(value: string): Date | null {
    const parts = value.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
    return super.parse(value);
  }

  private padNumber(n: number): string {
    return n < 10 ? '0' + n : n.toString();
  }
}

export const DATE_PROVIDERS = [
  {
    provide: DateAdapter,
    useFactory: (locale: string, platform: Platform) => {
      return new AppDateAdapter(locale, platform);
    },
    deps: [MAT_DATE_LOCALE, Platform]
  },
  {provide: MAT_DATE_LOCALE, useValue: 'pl-PL'},
  {provide: MAT_DATE_FORMATS, useValue: APP_DATE_FORMATS}
];
