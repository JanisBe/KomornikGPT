import {Router, Routes} from '@angular/router';
import {LayoutComponent} from './layout/layout.component';
import {AuthService} from './core/services/auth.service';
import {inject} from '@angular/core';
import {AuthGuard} from './core/guards/auth.guard';

const redirectToGroupsIfAuthenticated = () => {
  const authService = inject(AuthService);
  // Don't redirect if URL contains token
  if (window.location.href.includes('token=')) {
    return true;
  }
  if (authService.isAuthenticated()) {
    return ['/groups'];
  }
  return true;
};

const homeRedirectGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // If URL contains token, don't redirect
  if (window.location.href.includes('token=')) {
    return true;
  }

  // If authenticated, go to groups
  if (authService.isAuthenticated()) {
    return router.createUrlTree(['/groups']);
  }

  // If not authenticated, go to login
  return router.createUrlTree(['/login']);
};

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
      },
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent),
        canActivate: [redirectToGroupsIfAuthenticated]
      },
      {
        path: 'set-password',
        loadComponent: () => import('./features/auth/set-password.component').then(m => m.SetPasswordComponent)
      },
      {
        path: 'auth/callback',
        loadComponent: () => import('./features/auth/auth-callback.component').then(m => m.AuthCallbackComponent)
      },
      {
        path: 'register',
        loadComponent: () => import('./features/auth/register.component').then(m => m.RegisterComponent)
      },
      {
        path: 'forgot-password',
        loadComponent: () => import('./features/auth/forgot-password.component').then(m => m.ForgotPasswordComponent)
      },
      {
        path: 'reset-password',
        loadComponent: () => import('./features/auth/reset-password.component').then(m => m.ResetPasswordComponent)
      },
      {
        path: 'confirm-email',
        loadComponent: () => import('./features/auth/confirm-email.component').then(m => m.ConfirmEmailComponent)
      },
      {
        path: 'groups',
        loadComponent: () => import('./features/groups/groups.component').then(m => m.GroupsComponent),
        canActivate: [AuthGuard]
      },
      {
        path: 'groups/:id',
        loadComponent: () => import('./features/groups/group-details.component').then(m => m.GroupDetailsComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent),
        canActivate: [AuthGuard]
      },
      {
        path: 'expenses',
        loadComponent: () => import('./features/expenses/my-expenses/my-expenses.component').then(m => m.MyExpensesComponent),
        canActivate: [AuthGuard]
      },
      {
        path: 'groups/:id/expenses',
        loadComponent: () => import('./features/expenses/view-expenses.component').then(m => m.ViewExpensesComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'groups'
  }
];
