import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { AuthApi } from 'app/providers/auth.api.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { UserInfoApi } from 'app/customer-portal/system-settings/user-setup/user-setup.api.service';
import { NotificationsService } from 'angular2-notifications';
import * as uuid from 'uuid/v1';
import { ProjectSharingApi } from 'app/customer-portal/view-project/project-sharing/project-sharing.api.service';
import { DataStore } from 'app/providers/datastore';

@Component({
  selector: 'add-share-user-modal',
  templateUrl: './add-share-user-modal.component.html',
  styleUrls: ['./add-share-user-modal.component.scss'],
  providers: [UserInfoApi, ProjectSharingApi]
})
export class AddShareUserModalComponent implements OnInit {
  @ViewChild('addShareUserModal', { static: true }) addShareUserModal: ElementRef;

  projectId = '';
  parent = null;
  email = '';
  firstName = '';
  lastName = '';
  companyName = '';
  phone = '';
  shareType:any[]=[];
  isNewUser = false;
  userId = '';
  timer = null;

  constructor(
    private authApi: AuthApi,
    private userApi: UserInfoApi,
    private spinner: NgxSpinnerService,
    private notificationService: NotificationsService,
    private projectSharingApi: ProjectSharingApi,
    public dataStore: DataStore,
  ) { 
    this.shareType= [
    {
      name: "Admin",
      value: "admin",
    },
    {
      name: "Collaborator",
      value: "collaborator",
    },
    {
      name: "Observer",
      value: "observer",
    },
    {
      name: "None",
      value: "none",
    }   
  ];
  }

  ngOnInit() {
  }

  initialize(project_id: string, parent: any) {
    this.projectId = project_id;
    this.parent = parent;
    this.addShareUserModal.nativeElement.style.display = 'block'; 
  }
 

  createSharedProject() {    
    const params = {
      project_id: this.projectId,
      share_user_id: this.userId,
      share_source_company_id: this.dataStore.currentUser['customer_id'],
      share_source_user_id: this.dataStore.currentUser['user_id']  
    
    };

    this.spinner.show();
    this.projectSharingApi.createSharedProject(params)
      .then(res => {
        this.spinner.hide();
        this.notificationService.success('Success', 'Share user has been created', { timeOut: 3000, showProgressBar: false });

        this.reset();
        this.addShareUserModal.nativeElement.style.display = 'none';
        this.parent.onRefresh();
      })
      .catch(err => {
        this.spinner.hide();
        this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
      });
  }


  onEmailChange(event: any) {
    if (this.timer) {
      clearTimeout(this.timer);
    }

    this.isNewUser = false;

    this.timer = setTimeout(() => {
      this.spinner.show();

      this.authApi.getUser(this.email)
        .then((user: any) => {
          console.log("User",user);
          // user already exists
          this.firstName = user.user_firstname;
          this.lastName = user.user_lastname;
          this.companyName = user.customer_name;
          this.phone = user.user_phone;
          this.userId = user.user_id;
          this.spinner.hide();
        })
        .catch(err => {
          // user not exists
          this.isNewUser = true;
          this.firstName = '';
          this.lastName = '';
          this.companyName = '';
          this.phone = '';
          this.userId = '';
          this.spinner.hide();
        });
    }, 1500);
  }


  onSaveShareUser() {
    if (this.isNewUser) {
      const user_id = uuid();

      this.userApi.createUser({
        user_id,
        user_email: this.email,
        user_firstname: this.firstName,
        user_lastname: this.lastName,
        user_phone: this.phone,
      }).then(res => {
        this.userId = user_id;
        this.createSharedProject();
      }).catch(err => {
        this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
      });
    } else {
      this.createSharedProject();
    }
  }

  onCancel(event) {
    event.preventDefault();

    this.reset();
    this.addShareUserModal.nativeElement.style.display = 'none';
  }

  reset() {
    this.email = '';
    this.firstName = '';
    this.lastName = '';
    this.companyName = '';
    this.phone = '';
    this.isNewUser = false;
    this.userId = '';
    this.projectId = '';
  }
}
