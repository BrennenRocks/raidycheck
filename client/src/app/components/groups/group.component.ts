import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { FormGroup, Validators, FormBuilder } from '@angular/forms';

import { GroupsService } from '../../services/groups.service';
import { ServerResponse } from '../../interfaces/server-response';
import { User } from '../../interfaces/user';
import { Group } from '../../interfaces/group';
import { ActivatedRoute, Params } from '@angular/router';
import { SLOTS, RAIDS, DIFFICULTIES } from '../../constants/constants';

@Component({
  selector: 'app-groups',
  templateUrl: './group.component.html',
  styleUrls: ['./group.component.scss']
})
export class GroupComponent implements OnInit {

  isLoading: boolean = true;
  isProcessing: boolean = false;
  isFavorited: boolean;
  isSidebarClosed: boolean = false;

  slots: string[] = SLOTS;
  raids: {id: number, name: string}[] = RAIDS;
  difficulties: string[] = DIFFICULTIES;
  user: User;
  currentGroup: Group;

  selectedRaid: {id: number, name: string} = this.raids[0];
  selectedDifficulty: string = this.difficulties[0];
  numberOfBosses: number;
  averageGroupIlvl: number = 0;
  iLvlRequirement: number = 0;
  
  constructor(
    private groupsService: GroupsService,
    private toastr: ToastrService,
    private router: ActivatedRoute,
    private fb: FormBuilder
  ) { }

  ngOnInit() {
    this.router.params.subscribe((params: Params) => {
      this.groupsService.getGroups().subscribe((data: ServerResponse) => {
        if (!data.success) {
          this.toastr.error(data.message, 'Error');
          this.isLoading = false;
        } else {
          this.user = data.user;
          this.groupsService.getSingleGroup(params.id).subscribe((data: ServerResponse) => {
            if (!data.success) {
              this.toastr.error(data.message, 'Error');
              this.isLoading = false;
            } else {
              this.currentGroup = data.group;
              this.setNumberOfBosses();
              if (this.currentGroup.favoritedBy.indexOf(this.user.bnet.battletag) == -1) {
                this.isFavorited = false;
              } else {
                this.isFavorited = true;
              }
              for (let i = 0; i < this.currentGroup.characters.length; i++) {
                this.averageGroupIlvl += this.currentGroup.characters[i].iLvl;
              }
              this.averageGroupIlvl /= this.currentGroup.characters.length;
              this.isLoading = false;
            }
          })
        }
      });

    });
  }

  public onFavoriteGroup(): void {
    if (!this.isProcessing) {
      this.isProcessing = true;
      this.groupsService.favoriteGroup(this.currentGroup._id).subscribe((data: ServerResponse) => {
        if (!data.success) {
          this.toastr.error(data.message, 'Error');
          this.isProcessing = false;
        } else {
          this.groupsService.getGroups().subscribe((data: ServerResponse) => {
            if (!data.success) {
              this.toastr.error(data.message, 'Error');
              this.isLoading = false;
            } else {
              this.user = data.user;
              this.isFavorited = !this.isFavorited;
            }
            this.isProcessing = false;
          });
        }
      });
    }
  }

  public setNumberOfBosses(): void {
    this.numberOfBosses = this.currentGroup.characters[0].raids[this.selectedRaid.id].bosses.length;
  }

  public setNumberOfBossesDefeated(index: number): number {
    let numOfBossesDefeated = 0;
    let currRaid = this.currentGroup.characters[index].raids[this.selectedRaid.id];
    currRaid.bosses.map(boss => {
      if (boss[this.selectedDifficulty + 'Kills'] > 0) {
        numOfBossesDefeated++;
      }
    })
    return numOfBossesDefeated;
  }

  public onSidebarOpenClose(): void {
    this.isSidebarClosed = !this.isSidebarClosed;
  }

  public onAddNewGroup(): void {
    // nothing yet
  }
}
