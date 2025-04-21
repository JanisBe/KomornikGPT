import {ApplicationConfig, importProvidersFrom} from '@angular/core';
import {provideRouter} from '@angular/router';
import {routes} from './app.routes';
import {provideHttpClient, withInterceptors} from '@angular/common/http';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {authInterceptor} from './core/interceptors/auth.interceptor';
import {provideAnimations} from '@angular/platform-browser/animations';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatListModule} from '@angular/material/list';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSnackBarModule} from '@angular/material/snack-bar';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    importProvidersFrom(NgbModule),
    provideAnimations(),
    importProvidersFrom(
      MatButtonModule,
      MatCardModule,
      MatIconModule,
      MatToolbarModule,
      MatSidenavModule,
      MatListModule,
      MatFormFieldModule,
      MatInputModule,
      MatSnackBarModule
    )
  ]
};
