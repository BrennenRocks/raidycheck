import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { DOMAIN } from '../constants/constants';
import { Observable } from 'rxjs';
import { ServerResponse } from '../interfaces/server-response';
import { Character } from '../interfaces/character';
import { Group } from '../interfaces/group';

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

  public addNewGroup(group: Object): Observable<ServerResponse> {
    return this.http.post<ServerResponse>(DOMAIN + '/api/groups/new', group);
  }

  public getGroups(): Observable<ServerResponse> {
    return this.http.get<ServerResponse>(DOMAIN + '/api/groups', { headers: this.getAuthHeader() });
  }

  public getSingleGroup(groupId: string): Observable<ServerResponse> {
    return this.http.get<ServerResponse>(DOMAIN + '/api/groups/' + groupId);
  }

  public updateGroup(groupId: string, group: Object): Observable<ServerResponse> {
    return this.http.put<ServerResponse>(DOMAIN + '/api/groups/update/' + groupId, group);
  }

  public deleteGroup(groupId: string): Observable<ServerResponse> {
    return this.http.delete<ServerResponse>(DOMAIN + '/api/groups/delete/' + groupId)
  }

  public favoriteGroup(groupId: string): Observable<ServerResponse> {
    return this.http.put<ServerResponse>(DOMAIN + '/api/groups/favorite/' + groupId, { headers: this.getAuthHeader() });
  }

  public searchGroups(query: string): Observable<ServerResponse> {
    return this.http.post<ServerResponse>(DOMAIN + '/api/groups/search', { query });
  }

  public addCharactersToGroup(groupId: string, region: string, characters: Array<Character>, gettingStarted: boolean): Observable<ServerResponse> {
    return this.http.post<ServerResponse>(DOMAIN + '/api/groups/' + groupId + '/characters/add', { region, characters, gettingStarted } );
  }

  public updateCharacter(groupId: string, charId: string): Observable<ServerResponse> {
    return this.http.put<ServerResponse>(DOMAIN + '/api/groups/' + groupId + '/characters/update/' + charId, { headers: this.getAuthHeader() });

  }

  public removeCharacterFromGroup(groupId: string, charId: string): Observable<ServerResponse> {
    return this.http.put<ServerResponse>(DOMAIN + '/api/groups/' + groupId + '/characters/remove/' + charId, { headers: this.getAuthHeader() });
  }
  
}
