import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Observable, BehaviorSubject } from 'rxjs';

import { DOMAIN } from '../constants/constants';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private isLoggedIn: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public isLoggedInEmitter: Observable<boolean> = this.isLoggedIn.asObservable();

  constructor(
    private http: HttpClient,
    private jwtHelper: JwtHelperService
  ) { }

  storeToken(token) {
    this.isLoggedIn.next(true);
    localStorage.setItem('rc_token', token);
  }

  logout() {
    localStorage.clear();
    this.isLoggedIn.next(false);
    return this.http.get(DOMAIN + '/api/auth/logout');
  }

  loggedIn() {
    return !this.jwtHelper.isTokenExpired();
  }

  getProfile(battletag) {
    return this.http.get(DOMAIN + '/api/users/' + battletag);
  }
  
  getLoggedInUser() {
    return this.http.get(DOMAIN + '/api/users/personal');
  }

  updateUser(userId: String, image: String) {
    return this.http.put(DOMAIN + '/api/users/update/' + userId, image);
  }

  // delete User
}
