import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';

import { AuthGuard } from './guards/auth.guard';
import { NotAuthGuard } from './guards/not-auth.guard';

import { HomeComponent } from './components/home/home.component';
import { GroupComponent } from './components/groups/group.component';
import { LoginComponent } from './components/login/login.component';
import { LoggingInComponent } from './components/logging-in/logging-in.component';
import { GetStartedComponent } from './components/get-started/get-started.component';

const appRoutes = [
  { path: '', component: HomeComponent },
  { path: 'group/:id', component: GroupComponent },
  { path: 'login', component: LoginComponent, canActivate: [NotAuthGuard] },
  { path: 'logging-in', component: LoggingInComponent, canActivate: [NotAuthGuard] },
  { path: 'get-started', component: GetStartedComponent, canActivate: [AuthGuard] },
  { path: '**', component: HomeComponent }
]

@NgModule({
  declarations: [],
  imports: [RouterModule.forRoot(appRoutes)],
  providers: [],
  bootstrap: [],
  exports: [RouterModule]
})

export class AppRoutingModule { }