import { Observable } from "rxjs/Observable";
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from "@angular/router";
import { Injectable } from "@angular/core";
import { DataStore } from '../providers/datastore';
import { AuthApi } from '../providers/auth.api.service';

@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(
    private _authApiService: AuthApi,
    public _router: Router,
    public dataStore: DataStore,
  ) {
  }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean>|Promise<boolean>|boolean {
    if (localStorage.getItem('br_token')) {
      return true;
    }

    const { user_id: userId } = route.queryParams;
    if (!userId) {
      this._router.navigate([ '/sign-in' ], { queryParams: { redirect_url: state.url } });
      return false;
    }

    // Check if the user is already registered user.
    this._authApiService.getUserById(userId).then((res: any) => {
      const { user_password: userPassword } = res;
      if (userPassword === 'existed') {
        this._router.navigate([ '/sign-in' ], { queryParams: { redirect_url: state.url } });
        return false;
      } else {
        this._router.navigate([ '/sign-up' ], { queryParams: { redirect_url: state.url } });
        return false;
      }
    }).catch (error => {
      this._router.navigate([ '/sign-in' ], { queryParams: { redirect_url: state.url } });
      return false;
    });
  }
}
