import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree} from '@angular/router';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {AuthService} from '../services/auth.service';
import {GroupService} from '../services/group.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router, private groupService: GroupService) {
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> {
    // Allow public group details page for unauthenticated users
    if (route.routeConfig?.path === 'groups/:id') {
      const groupId = route.params['id'];
      return this.groupService.getGroup(groupId).pipe(
        map(group => {
          if (group && group.isPublic) {
            return true;
          }
          // If not public, require authentication
          return this.authService.isAuthenticated() ? true : this.router.createUrlTree(['/login']);
        })
      );
    }
    // Default: require authentication
    return this.authService.getCurrentUser().pipe(
      map(user => {
        if (user) {
          return true;
        }
        return this.router.createUrlTree(['/login']);
      })
    );
  }
}
