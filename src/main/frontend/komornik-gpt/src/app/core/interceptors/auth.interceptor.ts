import {HttpErrorResponse, HttpInterceptorFn} from '@angular/common/http';
import {inject} from '@angular/core';
import {catchError} from 'rxjs/operators';
import {Router} from '@angular/router';
import {throwError} from 'rxjs';
import {AuthService} from '../services/auth.service';

const PUBLIC_PATHS = ['/api/auth/login', '/api/users/register'];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  req = req.clone({
    withCredentials: true
  });

  if (PUBLIC_PATHS.some(path => req.url.includes(path))) {
    return next(req);
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if ([401, 403].includes(error.status)) {
        // Allow unauthenticated access to public group details and expenses with token
        if (req.method === 'GET' && (/\/groups\/[0-9]+$/.test(req.url) || /\/expenses\/group\/[0-9]+$/.test(req.url))) {
          // Don't redirect, just propagate the error
          return throwError(() => error);
        }

        // Don't redirect if user is accessing a page with token
        const currentUrl = router.url || window.location.href;
        if (currentUrl.includes('token=')) {
          return throwError(() => error);
        }

        authService.clearAuthState();
        if (!req.url.includes('/api/auth/user')) {
          router.navigate(['/login']);
        }
      }
      return throwError(() => error);
    })
  );
};
