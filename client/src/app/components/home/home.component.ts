import { Component, OnInit } from '@angular/core';
import { ScrollToService, ScrollToConfigOptions } from '@nicky-lenaers/ngx-scroll-to';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from '../../interfaces/user';
import { ServerResponse } from '../../interfaces/server-response';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  isLoading : boolean = true;
  isLoggedIn: boolean = false;
  user: User;

  constructor(
    private scrollToService: ScrollToService,
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService,
  ) { }

  ngOnInit() {
    this.authService.isLoggedInEmitter.subscribe((data: boolean) => {
      if (data !== null) {
        this.isLoggedIn = data;
      }

      if (this.isLoggedIn) {
        this.authService.getLoggedInUser().subscribe((data: ServerResponse) => {
          if (!data.success) {
            this.toastr.error(data.message, "Error");
            this.isLoading = false;
          } else {
            this.user = data.user;
            this.isLoading = false;
          }
        });
      }
    });
  }

  onMyGroupsClick(): void {
    this.router.navigate(['/group', this.user.groups.personal[0]._id]);
  }

  onScrollToAbout(): void {
    const config: ScrollToConfigOptions = {
      target: 'about',
      easing: 'easeOutElastic',
      duration: 5000,
      offset: 20
    };

    this.scrollToService.scrollTo(config);
  }

}
