import { Component, OnInit, ViewChild } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { FormGroup, FormControl, Validators, FormBuilder, FormArray } from '@angular/forms';
import { saveAs } from 'file-saver/FileSaver';

import { AuthService } from '../../services/auth.service';
import { GroupsService } from '../../services/groups.service';
import { ServerResponse } from '../../interfaces/server-response';
import { User } from '../../interfaces/user';
import { Group } from '../../interfaces/group';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { SLOTS, REALMS, REGIONS, RAIDS, DIFFICULTIES } from '../../constants/constants';
import { ModalDirective } from '../../../../node_modules/angular-bootstrap-md';

@Component({
  selector: 'app-groups',
  templateUrl: './group.component.html',
  styleUrls: ['./group.component.scss']
})
export class GroupComponent implements OnInit {

  @ViewChild('modalNewGroup') public modalNewGroup: ModalDirective;
  @ViewChild('modalAddChars') public modalAddChars: ModalDirective;
  @ViewChild('modalEditGroup') public modalEditGroup: ModalDirective;

  isLoading: boolean = true;
  isProcessing: boolean = false;
  isFavorited: boolean;
  isSidebarClosed: boolean;

  slots: string[] = SLOTS;
  realms: {id: number, realm: string}[] = REALMS;
  regions: string[] = REGIONS;
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
  counterAddCharacterForm: number = 1;
  maxAddCharacterForm: number = 5;
  editGroupForm: FormGroup;
  
  constructor(
    public authService: AuthService,
    private groupsService: GroupsService,
    private toastr: ToastrService,
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder
  ) { }

  ngOnInit() {
    this.isSidebarClosed = !this.authService.loggedIn();
    this.route.params.subscribe((params: Params) => {
      if (this.authService.loggedIn() && this.shouldGetUser) {
        this.groupsService.getGroups().subscribe((data: ServerResponse) => {
          if (!data.success) {
            this.toastr.error(data.message, 'Error');
            this.isLoading = false;
          } else {
            this.user = data.user;
            this.shouldGetUser = false;
            this.getGroupInfo(params);
          }
        });
      } else {
        this.getGroupInfo(params);
      }
    });
  }

  private getGroupInfo(params: Params): void {
    this.groupsService.getSingleGroup(params.id).subscribe((data: ServerResponse) => {
      if (!data.success) {
        this.toastr.error(data.message, 'Error');
        this.isLoading = false;
      } else {
        this.currentGroup = data.group;
        this.setNumberOfBosses();
        if (this.authService.loggedIn() && this.currentGroup.favoritedBy.indexOf(this.user.bnet.battletag) > -1) {
          this.isFavorited = true;
        } else {
          this.isFavorited = false;
        }

        this.setGroupAverageIlvl();
        this.createNewGroupForm();
        this.createAddCharacterForm();
        this.createEditGroupForm();
        this.isLoading = false;
      }
    });
  }

  public onDeleteGroup(): void {
    if (this.user.groups.personal.length == 1) {
      this.toastr.error('This is your last group! You can\'t delete it', 'Unable to Delete Group');
      return;
    }

    this.isProcessing = true;
    this.groupsService.deleteGroup(this.currentGroup._id).subscribe((data: ServerResponse) => {
      if (!data.success) {
        this.toastr.error(data.message, 'Error');
        this.isProcessing = false;
      } else {
        this.toastr.success(data.message, 'Group ' + this.currentGroup.title + ' Deleted');
        let index = 0;
        if (this.user.groups.personal[index]._id === this.currentGroup._id) {
          index = 1;
        }

        this.isProcessing = false;
        this.shouldGetUser = true;
        this.router.navigate(['/group', this.user.groups.personal[index]._id]);
      }
    });
  }

  public onFavoriteGroup(): void {
    if (!this.authService.loggedIn()) {
      this.toastr.error('You must be logged in to do that', 'Error');
      return;
    }

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

  public onDownloadGroup(): void {
    this.groupsService.downloadGroup(this.currentGroup._id).subscribe((data: any) => {
      let blob = new Blob([data], { type: 'text/csv' });
      saveAs(blob, this.currentGroup.title.replace(/\s/g, '_') + '.csv');
    });
  }

  public onUpdateCharacter(charId: string): void {
    this.isProcessing = true;
    this.groupsService.updateCharacter(this.currentGroup._id, charId).subscribe((data: ServerResponse) => {
      if (!data.success) {
        this.toastr.error(data.message, 'Error');
        this.isProcessing = false;
      } else {
        this.currentGroup = data.group;
        this.setGroupAverageIlvl();
        this.isProcessing = false;
      }
    });
  }

  public onRemoveCharacter(charId: string): void {
    this.isProcessing = true;
    this.groupsService.removeCharacterFromGroup(this.currentGroup._id, charId).subscribe((data: ServerResponse) => {
      if (!data.success) {
        this.toastr.error(data.message, 'Error');
        this.isProcessing = false;
      } else {
        this.currentGroup = data.group;
        this.setGroupAverageIlvl();
        this.isProcessing = false;
      }
    });
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
    });
    return numOfBossesDefeated;
  }

  private setGroupAverageIlvl(): void {
    this.averageGroupIlvl = 0;
    if (this.currentGroup.characters[0]) {
      for (let i = 0; i < this.currentGroup.characters.length; i++) {
        this.averageGroupIlvl += this.currentGroup.characters[i].iLvl;
      }
      this.averageGroupIlvl /= this.currentGroup.characters.length;
    }
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
      isPublic: this.newGroupForm.get('public').value,
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
        this.onModalNewGroupClose();
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

  public onEditGroup(): void {
    this.isProcessing = true;
    this.disableEditGroupForm();

    const newGroup = {
      title: this.editGroupForm.get('name').value,
      isPublic: this.editGroupForm.get('public').value,
      allowOthersToUpdateCharacters: this.editGroupForm.get('allowOthersToUpdateCharacters').value
    }

    this.groupsService.updateGroup(this.currentGroup._id, newGroup).subscribe((data: ServerResponse) => {
      if (!data.success) {
        this.toastr.error(data.message, 'Error');
        this.isProcessing = false;
        this.enableEditGroupForm();
      } else {
        this.onModalEditGroupClose();
        this.currentGroup = data.group;
        this.editGroupForm.reset();
        this.enableEditGroupForm();
        this.isProcessing = false;
      }
    });
  }

  private createEditGroupForm(): void {
    this.editGroupForm = this.fb.group({
      name: [null, Validators.compose([
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(20),
      ])],
      public: new FormControl(true),
      allowOthersToUpdateCharacters: new FormControl(false)
    });
  }

  private disableEditGroupForm(): void {
    this.editGroupForm.controls['name'].disable();
    this.editGroupForm.controls['public'].disable();
    this.editGroupForm.controls['allowOthersToUpdateCharacters'].disable();
  }

  private enableEditGroupForm(): void {
    this.editGroupForm.controls['name'].enable();
    this.editGroupForm.controls['public'].enable();
    this.editGroupForm.controls['allowOthersToUpdateCharacters'].enable();
  }

  public onModalEditGroupOpen(): void {
    this.modalEditGroup.show();
  }

  public onModalEditGroupClose(): void {
    this.modalEditGroup.hide();
  }

  public onAddNewCharacters(): void {
    this.isProcessing = true;
    this.disableAddCharacterForm();
    let validForm = true;

    const chars = [];
    this.characterForms.controls.map(char => {
      if (!char.value['name'] || char.value['name'].length < 2 || char.value['name'].length > 12 || !char.value['realm'].realm) {
        validForm = false;
        return;
      }

      chars.push({
        name: char.value['name'].toLowerCase(),
        realm: char.value['realm'].realm
      });
    });

    if (!validForm) {
      validForm = true;
      this.toastr.error('Make sure all fields are filled out properly, there can\'t be any blank feilds', 'Error');
      this.isProcessing = false;
      this.enableAddCharacterForm();
      return;
    }

    const region = this.addCharacterForm.controls['region'].value;

    this.groupsService.addCharactersToGroup(this.currentGroup._id, region, chars, false).subscribe((data: ServerResponse) => {
      if (!data.success) {
        this.toastr.error(data.message, 'Error');
        this.isProcessing = false;
        this.addCharacterForm.reset();
        this.enableAddCharacterForm();
      } else {
        if (data.message) {
          this.toastr.warning(data.message, 'More Information');
        }

        this.currentGroup = data.group;
        this.setGroupAverageIlvl();
        this.setNumberOfBosses();
        this.modalAddChars.hide();
        this.isProcessing = false;
        this.addCharacterForm.reset();
        this.enableAddCharacterForm();
      }
    });
  }

  private createAddCharacterForm(): void {
    this.addCharacterForm = this.fb.group({
      region: new FormControl(null, Validators.required),
      characters: this.fb.array([
        this.initChar()
      ])
    });
  }

  private initChar(): FormGroup {
    return this.fb.group({
      name: ['', Validators.compose([
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(12)
      ])],
      realm: [null, Validators.required]
    });
  }

  public onAddCharacterToForm(): void {
    if (this.counterAddCharacterForm < this.maxAddCharacterForm) {
      this.counterAddCharacterForm++;
      const control = <FormArray>this.addCharacterForm.controls['characters'];
      control.push(this.initChar());
    }
  }

  public onRemoveCharacterFromForm(i: number): void {
    this.counterAddCharacterForm--;
    const control = <FormArray>this.addCharacterForm.controls['characters'];
    control.removeAt(i);
  }

  get characterForms(): FormArray {
    return <FormArray>this.addCharacterForm.get('characters');
  }

  private enableAddCharacterForm(): void {
    this.addCharacterForm.enable();
  }

  private disableAddCharacterForm(): void {
    this.addCharacterForm.disable();
  }
}
