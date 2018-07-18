import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  redirectUrl: String;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) { }

  canActivate(
    router: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ) {
    if (this.authService.loggedIn()) {
      return true;
    } else {
      this.redirectUrl = state.url;
      this.toastr.error('You must be logged in to view that page', 'Authentication Error');
      this.router.navigate(['/']);
      return false;
    }
  }
}
