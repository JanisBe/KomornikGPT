import {ApplicationConfig} from '@angular/core';
import {provideRouter} from '@angular/router';
import {routes} from './app.routes';
import {provideAnimations} from '@angular/platform-browser/animations';
import {provideHttpClient, withInterceptors} from '@angular/common/http';
import {authInterceptor} from './core/interceptors/auth.interceptor';
import {registerLocaleData} from '@angular/common';
import localePl from '@angular/common/locales/pl';
import {MAT_DATE_LOCALE} from '@angular/material/core';

// Register Polish locale
registerLocaleData(localePl);

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(
      withInterceptors([authInterceptor])
    ),
    {provide: MAT_DATE_LOCALE, useValue: 'pl-PL'}
  ]
};
