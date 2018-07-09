import { Component, OnInit, ViewChild } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { FormGroup, FormControl, Validators, FormBuilder } from '@angular/forms';

import { AuthService } from '../../services/auth.service';
import { GroupsService } from '../../services/groups.service';
import { ServerResponse } from '../../interfaces/server-response';
import { User } from '../../interfaces/user';
import { Group } from '../../interfaces/group';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { SLOTS, RAIDS, DIFFICULTIES } from '../../constants/constants';
import { ModalDirective } from '../../../../node_modules/angular-bootstrap-md';
import { group } from '../../../../node_modules/@angular/animations';

@Component({
  selector: 'app-groups',
  templateUrl: './group.component.html',
  styleUrls: ['./group.component.scss']
})
export class GroupComponent implements OnInit {

  @ViewChild('modalNewGroup') public modalNewGroup: ModalDirective;
  @ViewChild('modalAddChars') public modalAddChars: ModalDirective;

  isLoading: boolean = true;
  isProcessing: boolean = false;
  isFavorited: boolean;
  isSidebarClosed: boolean = false;

  slots: string[] = SLOTS;
  raids: {id: number, name: string}[] = RAIDS;
  difficulties: string[] = DIFFICULTIES;
  user: User;
  shouldGetUser: boolean = true;
  currentGroup: Group;

  selectedRaid: {id: number, name: string} = this.raids[0];
  selectedDifficulty: string = this.difficulties[0];
  numberOfBosses: number;
  averageGroupIlvl: number = 0;
  iLvlRequirement: number = 0;

  newGroupForm: FormGroup;
  addCharacterForm: FormGroup;
  
  constructor(
    public authService: AuthService,
    private groupsService: GroupsService,
    private toastr: ToastrService,
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder
  ) { }

  ngOnInit() {
    this.route.params.subscribe((params: Params) => {
      if (this.shouldGetUser) {
        this.groupsService.getGroups().subscribe((data: ServerResponse) => {
          if (!data.success) {
            this.toastr.error(data.message, 'Error');
            this.isLoading = false;
          } else {
            this.user = data.user;
            this.shouldGetUser = false;
          }
        });
      }

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

          this.averageGroupIlvl = 0;
          if (this.currentGroup.characters[0]) {
            for (let i = 0; i < this.currentGroup.characters.length; i++) {
              this.averageGroupIlvl += this.currentGroup.characters[i].iLvl;
            }
            this.averageGroupIlvl /= this.currentGroup.characters.length;
          }

          this.createNewGroupForm();
          this.createAddCharacterForm();
          this.isLoading = false;
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
    if (!this.currentGroup.characters[0]) {
      this.numberOfBosses = 0;
    } else {
      this.numberOfBosses = this.currentGroup.characters[0].raids[this.selectedRaid.id].bosses.length;
    }
      
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

  public onSidemenuGroupClick() {
    this.shouldGetUser = false;
  }

  public onModalNewGroupOpen(): void {
    this.modalNewGroup.show();
  }

  public onModalNewGroupClose(): void {
    this.modalNewGroup.hide()
  }

  public onAddNewGroup(): void {
    this.isProcessing = true;
    this.disableNewGroupForm();

    const newGroup = {
      title: this.newGroupForm.get('name').value,
      public: this.newGroupForm.get('public').value,
      allowOthersToUpdateCharacters: this.newGroupForm.get('allowOthersToUpdateCharacters').value
    }

    this.groupsService.addNewGroup(newGroup).subscribe((data: ServerResponse) => {
      if (!data.success) {
        this.toastr.error(data.message, 'Error');
        this.enableNewGroupForm();
        this.isProcessing = false;
      } else {
        this.shouldGetUser = true;
        this.router.navigate(['/group', data.group._id]);
        this.modalNewGroup.hide();
        this.newGroupForm.reset();
        this.toastr.success('Add some characters', data.group.title + ' created');
        this.isProcessing = false;
        this.enableNewGroupForm();
      }
    });
  }

  private createNewGroupForm(): void {
    this.newGroupForm = this.fb.group({
      name: [null, Validators.compose([
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(20),
      ])],
      public: new FormControl(true),
      allowOthersToUpdateCharacters: new FormControl(false)
    });
  }

  private disableNewGroupForm(): void {
    this.newGroupForm.controls['name'].disable();
    this.newGroupForm.controls['public'].disable();
    this.newGroupForm.controls['allowOthersToUpdateCharacters'].disable();
  }

  private enableNewGroupForm(): void {
    this.newGroupForm.controls['name'].enable();
    this.newGroupForm.controls['public'].enable();
    this.newGroupForm.controls['allowOthersToUpdateCharacters'].enable();
  }
  
  public onModalAddCharsOpen(): void {
    this.modalAddChars.show();
  }

  public onModalAddCharsClose(): void {
    this.modalAddChars.hide();
  }

  public onAddNewCharacters(): void {
    // nothing yet
  }

  private createAddCharacterForm(): void {

  }

}
