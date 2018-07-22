import { Injectable } from "@angular/core";
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from "@angular/router";
import { Observable } from "rxjs";

import { ServerResponse } from "../interfaces/server-response";
import { GroupsService } from "./groups.service";

@Injectable()
export class SearchResolver implements Resolve<ServerResponse> {

  constructor(
    private groupsService: GroupsService
  ) {}

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<ServerResponse> | Promise<ServerResponse> | ServerResponse {
    return this.groupsService.searchGroups(route.queryParams.query);
  }
}