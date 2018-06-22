import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

import { AuthService } from '../../services/auth.service';
import { ServerResponse } from '../../interfaces/server-response';
import { User } from '../../interfaces/user';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {

  isLoading: boolean = false;
  isLoggedIn: boolean = false;
  refreshUser: boolean = false;
  user: User;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) { }

  ngOnInit() {
    this.isLoading = true;
    this.authService.isLoggedInEmitter.subscribe((data: boolean) => {
      if (data !== null) {
        this.isLoggedIn = data;
      }

      if (this.isLoggedIn) {
        this.getUser();
      }
    });

    this.authService.refreshUserEmitter.subscribe((data: boolean) => {
      if (data !== null) {
        this.refreshUser = data;
      }

      if (this.isLoggedIn && this.refreshUser) {
        this.getUser();
        this.authService.updateUserFinish();
      }
    }); 
  }

  private getUser() {
    setTimeout(() => {
      this.authService.getLoggedInUser().subscribe((data: ServerResponse) => {
        if (!data.success) {
          this.toastr.error(data.message, "Error");
          this.isLoading = false;
        } else {
          this.user = data.user;
          this.isLoading = false;
        }
      });
    }, 1000);
  }

  public onLogoutClick(): void {
    this.authService.logout();
    this.router.navigate(['/']);
    this.toastr.success("You have been logged out", "Logged out");
  }

}
