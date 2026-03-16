import {HttpErrorResponse, HttpHandlerFn, HttpInterceptorFn, HttpRequest} from '@angular/common/http';
import {inject} from '@angular/core';
import {BehaviorSubject, Observable, throwError} from 'rxjs';
import {catchError, filter, switchMap, take} from 'rxjs/operators';
import {Router} from '@angular/router';
import {AuthService} from '../services/auth.service';
import {NotificationService} from '../services/notification.service';

const PUBLIC_PATHS = ['/api/auth/login', '/api/users/register', '/api/auth/refresh'];

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<any>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const notificationService = inject(NotificationService);

  req = req.clone({
    withCredentials: true
  });

  if (PUBLIC_PATHS.some(path => req.url.includes(path))) {
    return next(req);
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Allow unauthenticated access to public group details and expenses with token
        if (req.method === 'GET' && (/\/groups\/[0-9]+$/.test(req.url) || /\/expenses\/group\/[0-9]+$/.test(req.url))) {
          return throwError(() => error);
        }

        const currentUrl = router.url || window.location.href;
        if (currentUrl.includes('token=')) {
          return throwError(() => error);
        }

        // Handle refresh logic
        return handle401Error(req, next, authService, router, notificationService);
      } else if (error.status === 403) {
        authService.clearAuthState();
        if (!req.url.includes('/api/auth/user')) {
          notificationService.showError('Brak uprawnień lub sesja wygasła.');
          router.navigate(['/login']);
        }
        return throwError(() => error);
      }
      return throwError(() => error);
    })
  );
};

const handle401Error = (request: HttpRequest<any>, next: HttpHandlerFn, authService: AuthService, router: Router, notificationService: NotificationService): Observable<any> => {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    return authService.refreshToken().pipe(
      switchMap(() => {
        isRefreshing = false;
        refreshTokenSubject.next(true);
        return next(request);
      }),
      catchError((refreshError) => {
        isRefreshing = false;
        authService.clearAuthState();
        if (!request.url.includes('/api/auth/user')) {
          notificationService.showError('Twoja sesja wygasła. Zaloguj się ponownie.');
          router.navigate(['/login']);
        }
        return throwError(() => refreshError);
      })
    );
  } else {
    return refreshTokenSubject.pipe(
      filter(tokenResult => tokenResult != null),
      take(1),
      switchMap(() => {
        return next(request);
      })
    );
  }
};
