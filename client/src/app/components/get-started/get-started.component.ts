import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { User} from '../../interfaces/user';
import { ServerResponse } from '../../interfaces/server-response';

import { AuthService } from '../../services/auth.service';
import { GroupsService } from '../../services/groups.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-get-started',
  templateUrl: './get-started.component.html',
  styleUrls: ['./get-started.component.scss']
})
export class GetStartedComponent implements OnInit {

  user: User;
  isLoading: boolean = true;

  constructor(
    private authService: AuthService,
    private groupsService: GroupsService,
    private router: Router,
    private toastr: ToastrService
  ) { }

  ngOnInit() {
    this.authService.getLoggedInUser().subscribe((data: ServerResponse) => {
      if (!data.success) {
        this.toastr.error(data.message, "Error");
        this.isLoading = false;
      } else {
        this.user = data.user;
        const avaiablePersonalChars = [];
        this.user.bnet.personalCharacters.map(char => {
          if (char.lastModified > 0) {
            avaiablePersonalChars.push(char);
          }
        });
        this.user.bnet.personalCharacters = avaiablePersonalChars;
        this.isLoading = false;
      }
    });
  }

  public onCharClick(char): void {
    console.log(char);
  }

}
