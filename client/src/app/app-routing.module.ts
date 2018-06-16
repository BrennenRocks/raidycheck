import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';

import { HomeComponent } from './components/home/home.component';
import { GroupsComponent } from './components/groups/groups.component';

const appRoutes = [
  { path: '', component: HomeComponent },
  { path: 'groups', component: GroupsComponent },
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