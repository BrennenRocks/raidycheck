import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
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
        setTimeout(() => {
          this.authService.getLoggedInUser().subscribe((data: ServerResponse) => {
            if (!data.success) {
              this.toastr.error(data.message, "Error");
              this.isLoading = false;
            } else {
              let image = "https://render-us.worldofwarcraft.com/character/";
              for(let i = 0; i < data.user.bnet.personalCharacters.length; i++) {
                if (data.user.bnet.personalCharacters[i].lastModified > 0) {
                  image += data.user.bnet.personalCharacters[i].thumbnail;
                  break;
                }
              }

              this.authService.updateUser(data.user._id, image).subscribe((data: ServerResponse) => {
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
        }, 1000);
      }
    });
   }

  public onLogoutClick(): void {
    this.authService.logout();
    this.router.navigate(['/']);
    this.toastr.success("You have been logged out", "Logged out");
  }

}
