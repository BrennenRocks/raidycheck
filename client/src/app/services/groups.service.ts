import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { DOMAIN } from '../constants/constants';
import { Observable } from 'rxjs';
import { ServerResponse } from '../interfaces/server-response';

@Injectable({
  providedIn: 'root'
})
export class GroupsService {

  constructor(
    private http: HttpClient
  ) { }

  private getAuthHeader(): HttpHeaders {
    return new HttpHeaders().set('Authorization', 'Bearer ' + localStorage.getItem('rc_token'));
  }

  public addNewGroup(group): Observable<ServerResponse> {
    return this.http.post<ServerResponse>(DOMAIN + '/api/groups/new', group);
  }

  public getGroups(): Observable<ServerResponse> {
    return this.http.get<ServerResponse>(DOMAIN + '/api/groups', { headers: this.getAuthHeader() });
  }

  public getSingleGroup(groupId): Observable<ServerResponse> {
    return this.http.get<ServerResponse>(DOMAIN + '/api/groups/' + groupId);
  }

  // update group

  // delete group

  public favoriteGroup(groupId): Observable<ServerResponse> {
    return this.http.put<ServerResponse>(DOMAIN + '/api/groups/favorite/' + groupId, { headers: this.getAuthHeader });
  }

  public addCharactersToGroup(groupId, region, characters): Observable<ServerResponse> {
    return this.http.post<ServerResponse>(DOMAIN + '/api/groups/' + groupId + '/characters/add', { region, characters } );
  }

  updateCharacter(groupdId, charId): void {
    // update character

  }

  // remove character from group
  
}
