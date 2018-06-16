import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-groups',
  templateUrl: './groups.component.html',
  styleUrls: ['./groups.component.scss']
})
export class GroupsComponent implements OnInit {

  isNewUser: Boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.authService.storeToken(params.rc_token);
      this.isNewUser = this.route.snapshot.queryParams.new;
      console.log(this.isNewUser);
    });
  }

}
