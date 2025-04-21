import {Routes} from '@angular/router';
import {LayoutComponent} from './layout/layout.component';
import {AuthService} from './core/services/auth.service';
import {inject} from '@angular/core';

const redirectToGroupsIfAuthenticated = () => {
  const authService = inject(AuthService);
  if (authService.isAuthenticated()) {
    return ['/groups'];
  }
  return true;
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
        path: 'register',
        loadComponent: () => import('./features/auth/register.component').then(m => m.RegisterComponent)
      },
      {
        path: 'groups',
        loadComponent: () => import('./features/groups/groups.component').then(m => m.GroupsComponent)
      },
      {
        path: 'expenses',
        loadComponent: () => import('./features/expenses/expenses.component').then(m => m.ExpensesComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent)
      }
    ]
  }
];
