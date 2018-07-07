import { AppRoutingModule } from './app-routing.module';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { JwtModule } from '@auth0/angular-jwt';
import { MDBBootstrapModule } from 'angular-bootstrap-md';
import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { ToastrModule } from 'ngx-toastr';
import { ScrollToModule } from '@nicky-lenaers/ngx-scroll-to';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { HomeComponent } from './components/home/home.component';
import { FooterComponent } from './components/footer/footer.component';
import { GroupComponent } from './components/groups/group.component';
import { LoginComponent } from './components/login/login.component';
import { LoggingInComponent } from './components/logging-in/logging-in.component';
import { GetStartedComponent } from './components/get-started/get-started.component';
import { SeparateArrayPipe } from './pipes/separate-array.pipe';

export function jwtTokenGetter() {
  return localStorage.getItem('rc_token');
}

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    HomeComponent,
    FooterComponent,
    GroupComponent,
    LoginComponent,
    LoggingInComponent,
    GetStartedComponent,
    SeparateArrayPipe
  ],
  imports: [
    AppRoutingModule,
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    HttpClientModule,
    JwtModule.forRoot({
      config: {
        tokenGetter: jwtTokenGetter,
        whitelistedDomains: ['localhost:8080']
      }
    }),
    MDBBootstrapModule.forRoot(),
    NgSelectModule,
    ReactiveFormsModule,
    ScrollToModule.forRoot(),
    ToastrModule.forRoot({
      closeButton: true,
      timeOut: 5000,
      preventDuplicates: true,
      easing: 'ease-in'
    })
  ],
  providers: [],
  bootstrap: [AppComponent],
  schemas: [ NO_ERRORS_SCHEMA ]
})
export class AppModule { }
