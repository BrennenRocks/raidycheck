import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Observable, BehaviorSubject } from 'rxjs';

import { DOMAIN } from '../constants/constants';
import { ServerResponse } from '../interfaces/server-response';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private isLoggedIn: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(this.loggedIn());
  public isLoggedInEmitter: Observable<boolean> = this.isLoggedIn.asObservable();

  public isNewUser: boolean;

  constructor(
    private http: HttpClient,
    private jwtHelper: JwtHelperService
  ) { }

  private getAuthHeader(): HttpHeaders {
    return new HttpHeaders().set('Authorization', 'Bearer ' + localStorage.getItem('rc_token'));
  }

  public storeToken(token): void {
    this.isLoggedIn.next(true);
    localStorage.setItem('rc_token', token);
  }

  public logout() {
    localStorage.clear();
    this.isLoggedIn.next(false);
    return this.http.get(DOMAIN + '/api/auth/logout');
  }

  public loggedIn(): boolean {
    return !this.jwtHelper.isTokenExpired();
  }

  public getProfile(battletag: string) {
    return this.http.get(DOMAIN + '/api/users/' + battletag);
  }
  
  public getLoggedInUser(): Observable<ServerResponse> {
    return this.http.get<ServerResponse>(DOMAIN + '/api/users/personal', { headers: this.getAuthHeader() });
  }

  public updateUser(userId: string, image: string): Observable<ServerResponse> {
    return this.http.put<ServerResponse>(DOMAIN + '/api/users/update/' + userId, image, { headers: this.getAuthHeader() });
  }

  // delete User
}
