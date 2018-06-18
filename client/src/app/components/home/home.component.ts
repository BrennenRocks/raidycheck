import { Component, OnInit } from '@angular/core';
import { ScrollToService, ScrollToConfigOptions } from '@nicky-lenaers/ngx-scroll-to';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  constructor(
    private scrollToService: ScrollToService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit() {
  }

  onMyGroupsClick(): void {
    this.router.navigate['groups']
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
