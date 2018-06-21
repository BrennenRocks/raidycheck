import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';

import { HomeComponent } from './components/home/home.component';
import { GroupsComponent } from './components/groups/groups.component';
import { LoginComponent } from './components/login/login.component';
import { LoggingInComponent } from './components/logging-in/logging-in.component';
import { GetStartedComponent } from './components/get-started/get-started.component';

const appRoutes = [
  { path: '', component: HomeComponent },
  { path: 'groups', component: GroupsComponent },
  { path: 'login', component: LoginComponent },
  { path: 'logging-in', component: LoggingInComponent },
  { path: 'get-started', component: GetStartedComponent },
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