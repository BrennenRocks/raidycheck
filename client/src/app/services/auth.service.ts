import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { JwtHelperService } from '@auth0/angular-jwt';

import { DOMAIN } from '../constants/constants';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(
    private http: HttpClient,
    private jwtHelper: JwtHelperService
  ) { }

  storeToken(token) {
    localStorage.setItem('rc_token', token);
  }

  logout() {
    localStorage.clear();
    return this.http.get(DOMAIN + '/api/auth/logout');
  }

  loggedIn() {
    return !this.jwtHelper.isTokenExpired();
  }

  getProfile(battletag) {
    return this.http.get(DOMAIN + '/api/users/' + battletag);
  }

  // update User

  // delete User
}
