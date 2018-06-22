import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { DOMAIN } from '../constants/constants';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GroupsService {

  constructor(
    private http: HttpClient
  ) { }

  registerGroup(group) {
    return this.http.post(DOMAIN + '/api/groups/new', group);
  }

  getGroups() {
    return this.http.get(DOMAIN + '/api/groups');
  }

  getSingleGroup(groupId) {
    return this.http.get(DOMAIN + '/api/groups/' + groupId);
  }

  // update group

  // delete group

  addCharactersToGroup(groupId, region, characters) {
    return this.http.post(DOMAIN + '/api/groups/' + groupId + '/characters/add', { region, characters } );
  }

  updateCharacter(groupdId, charId): void {
    // update character

  }

  // remove character from group
}
