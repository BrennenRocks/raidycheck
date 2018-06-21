import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-logging-in',
  templateUrl: './logging-in.component.html',
  styleUrls: ['./logging-in.component.scss']
})
export class LoggingInComponent implements OnInit {

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit() {
      this.authService.storeToken(this.route.snapshot.queryParams.rc_token);
      this.route.snapshot.queryParams.new === 'true' ? this.router.navigate(['/get-started']) : this.router.navigate(['/groups']);
  }

}
