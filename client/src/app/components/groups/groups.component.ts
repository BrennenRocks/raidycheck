import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

import { GroupsService } from '../../services/groups.service';
import { ServerResponse } from '../../interfaces/server-response';
import { User } from '../../interfaces/user';

@Component({
  selector: 'app-groups',
  templateUrl: './groups.component.html',
  styleUrls: ['./groups.component.scss']
})
export class GroupsComponent implements OnInit {

  isLoading: boolean = true;
  user: User;

  constructor(
    private groupsService: GroupsService,
    private toastr: ToastrService
  ) { }

  ngOnInit() {
    this.groupsService.getGroups().subscribe((data: ServerResponse) => {
      if (!data.success) {
        this.toastr.error(data.message, 'Error');
        this.isLoading = false;
      } else {
        this.user = data.user,
        this.isLoading = false;
      }
    });
  }

}
