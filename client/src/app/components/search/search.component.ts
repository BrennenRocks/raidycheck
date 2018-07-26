import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Data, Params } from '@angular/router';
import { ToastrService } from '../../../../node_modules/ngx-toastr';
import { GroupsService } from '../../services/groups.service';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit {

  isLoading: boolean = true;

  groups: any;

  constructor(
    private route: ActivatedRoute,
    private toastr: ToastrService,
    private groupsService: GroupsService
  ) { }

  ngOnInit() {
    this.route.queryParams.subscribe((params: Params) => {
      this.groupsService.searchGroups(params.query).subscribe((data: any) => {
        if (!data.success) {
          this.toastr.error(data.message, 'Error');
          this.isLoading = false;
          return;
        } else {
          this.groups = data.groups;
          this.isLoading = false;
        }
      })
    });
  }

}
