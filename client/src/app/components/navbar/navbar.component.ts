import { Component, OnInit } from '@angular/core';
import { Router, NavigationStart } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {

  isLoading: Boolean = false;
  isLoggedIn: Boolean = false;
  user: any;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) { }

  ngOnInit() {
    this.authService.isLoggedInEmitter.subscribe(data => {
      this.isLoggedIn = data;
      if (this.isLoggedIn) {
        this.authService.getLoggedInUser().subscribe((data: any) => {
          
        });
      }
    });
   }

  onLogoutClick() {
    this.authService.logout();
    this.router.navigate(['/']);
    this.toastr.success("You have been logged out", "Logged out");
  }

}
