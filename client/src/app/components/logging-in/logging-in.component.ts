import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { GroupsService } from '../../services/groups.service';
import { ServerResponse } from '../../interfaces/server-response';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-logging-in',
  templateUrl: './logging-in.component.html',
  styleUrls: ['./logging-in.component.scss']
})
export class LoggingInComponent implements OnInit {

  constructor(
    private authService: AuthService,
    private groupsService: GroupsService,
    private toastr: ToastrService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit() {
    this.authService.storeToken(this.route.snapshot.queryParams.rc_token);
    this.groupsService.getGroups().subscribe((data: ServerResponse) => {
      if (!data.success) {
        this.router.navigate(['/']);
        this.toastr.error(data.message, 'Error');
      } else {
        this.route.snapshot.queryParams.new === 'true' ? this.router.navigate(['/get-started']) : this.router.navigate(['/group', data.user.groups.personal[0]._id]);
      }
    });   
  }

}
