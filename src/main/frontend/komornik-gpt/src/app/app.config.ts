import {ApplicationConfig, importProvidersFrom, isDevMode} from '@angular/core';
import {provideRouter} from '@angular/router';
import {routes} from './app.routes';
import {provideAnimations} from '@angular/platform-browser/animations';
import {provideHttpClient, withInterceptors, withXsrfConfiguration} from '@angular/common/http';
import {authInterceptor} from './core/interceptors/auth.interceptor';
import {registerLocaleData} from '@angular/common';
import localePl from '@angular/common/locales/pl';
import {MAT_DATE_LOCALE} from '@angular/material/core';
import {ServiceWorkerModule} from '@angular/service-worker';

// Register Polish locale
registerLocaleData(localePl);

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(
      withInterceptors([authInterceptor]),
      withXsrfConfiguration({
        cookieName: 'XSRF-TOKEN',
        headerName: 'X-XSRF-TOKEN',
      })
    ),
    {provide: MAT_DATE_LOCALE, useValue: 'pl-PL'},
    importProvidersFrom(ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    }))
  ]
};
