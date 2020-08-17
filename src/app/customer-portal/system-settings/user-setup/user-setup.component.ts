import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { LocalDataSource } from 'ng2-smart-table';
import { NotificationsService } from 'angular2-notifications';
import { DataStore } from '../../../providers/datastore';
import { UserInfoApi } from './user-setup.api.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { MouseGuard } from '../../../providers/mouseguard';
import { Logger } from 'app/providers/logger.service';
import { CompanyOfficeApi } from '../company-office-setup/company-office-setup.api.service';
const CircularJSON = require('circular-json');

const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();

enum EditType {
  CREATE,
  UPDATE,
}

@Component({
  selector: 'app-customer-portal-user-setup',
  templateUrl: './user-setup.component.html',
  styleUrls: ['./user-setup.component.scss'],
  providers: [UserInfoApi, CompanyOfficeApi],
})
export class UserSetupComponent implements OnInit {

  @ViewChild('table', { static:false}) table;
  @ViewChild('editModal', { static:false}) editModal: ElementRef;
  @ViewChild('removeModal', { static:false}) removeModal: ElementRef;
  @ViewChild('roleAlertModal', { static:false}) roleAlertModal: ElementRef;

  editType: EditType;

  editId = '';
  editEmail = '';
  editFirstName = '';
  editLastName = '';
  editPhone = '';
  editPassword = '';
  editRole = 'user';
  editOfficeId = '';

  editModalTitle = '';
  editModalDescriptionText = '';

  removeDescriptionText = '';
  roleAlertText = '';

  isSysAdmin = false;

  settings = {
    columns: {
      user_email: {
        title: 'User Email'
      },
      user_firstname: {
        title: 'User First Name'
      },
      user_lastname: {
        title: 'User Last Name',
        sort: true,
        sortDirection: 'asc',
      },
      user_phone: {
        title: 'User Phone Number'
      },
      user_office: {
        title: 'Office',
      },
      user_role: {
        title: 'Role'
      },
    },
    actions: {
      add: false,
      edit: false,
      delete: false,
    },
    pager: {
      display: false,
      perPage: 1000000,
    }
  };

  data: LocalDataSource;

  offices = [];

  constructor(
    private notificationService: NotificationsService,
    public dataStore: DataStore,
    private userInfoApi: UserInfoApi,
    private companyOfficeApi: CompanyOfficeApi,
    private spinner: NgxSpinnerService,
    private loggerService: Logger
  ) { }

  ngOnInit() {
    if (this.dataStore.currentUser) {
      this.loadData();
    } else {
      this.dataStore.authenticationState.subscribe(value => {
        if (value) {
          this.loadData();
        }
      });
    }
  }

  loadData() {
    this.isSysAdmin = this.dataStore.currentUser.user_role === 'sys admin';

    this.companyOfficeApi.findOffices(this.dataStore.currentUser['customer_id'])
      .then((offices: any[]) => {
        this.offices = offices;
        return this.userInfoApi.findUsers(this.dataStore.currentUser.customer_id);
      })
      .then((users: any) => {
        users.forEach(user => {
          const { customer_office_id } = user;
          const userOffice = this.offices.find(({ company_office_id }) => company_office_id === customer_office_id);

          if (userOffice) {
            user['user_office'] = userOffice['company_office_name'];
          }
        });

        this.data = new LocalDataSource(users);
        this.data.reset();

        return this.companyOfficeApi.findOffices(this.dataStore.currentUser['customer_id']);
      })
      .catch(err => {
        this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
      });
  }

  onAdd () {
    this.editModalTitle = `Add New User For ${this.dataStore.currentUser.customer_name}`;
    this.editModalDescriptionText = 'Adding a new user will allow that user to submit and review projects. It will also allow them to access this application so that they can modify any project settings.  Only Admin users will be able to change customer settings.';

    this.editEmail = '';
    this.editFirstName = '';
    this.editLastName = '';
    this.editPhone = '';
    this.editPassword = '';
    this.editRole = 'user';
    this.editOfficeId = '';

    this.editModal.nativeElement.style.display = 'block';
    this.editType = EditType.CREATE;
  }

  onRemove () {
    let selectedUser = this.table.grid.dataSet.selectedRow.data;

    if (selectedUser) {
      if (selectedUser['user_id'] === this.dataStore.currentUser['user_id']) {
        this.notificationService.error('Error', 'You cannot remove yourself', { timeOut: 3000, showProgressBar: false });
      } else {
        this.removeDescriptionText = `Are You Sure You Want To Remove ${selectedUser.user_firstname} ${selectedUser.user_lastname}` + `, From Accessing ${this.dataStore.currentUser.customer_name} information?`;
        this.removeModal.nativeElement.style.display = 'block';
      }
    } else {
      this.notificationService.error('Error', 'Please select a user first', { timeOut: 3000, showProgressBar: false });
    }
  }

  onEdit () {
    const selectedUser = this.table.grid.dataSet.selectedRow.data;

    if (selectedUser) {
      if (selectedUser.user_role === 'sys admin' && this.dataStore.currentUser['user_role'] !== 'sys admin') {
        return this.notificationService.error('Error', 'You cannot edit sys admin', { timeOut: 3000, showProgressBar: false });
      }

      this.editModalTitle = `Edit User ${selectedUser.user_firstname} ${selectedUser.user_lastname}`;
      this.editModalDescriptionText = 'Editing a user should not be used to remove a user and replace them with a new user. This will cause the history of previous user to be associated with the new user.';

      this.editId = selectedUser.user_id;
      this.editEmail = selectedUser.user_email;
      this.editFirstName = selectedUser.user_firstname;
      this.editLastName = selectedUser.user_lastname;
      this.editPhone = selectedUser.user_phone;
      this.editPassword = selectedUser.has_password === 'yes' ? 'FAKEPW' : '';
      this.editRole = selectedUser.user_role;
      this.editOfficeId = selectedUser.customer_office_id;

      this.editModal.nativeElement.style.display = 'block';
      this.editType = EditType.UPDATE;
    } else {
      this.notificationService.error('Error', 'Please select a user first', { timeOut: 3000, showProgressBar: false });
    }
  }

  onCloseEditModal() {
    this.editModal.nativeElement.style.display = 'none';
  }

  onSave() {
    let sysAdmin = this.data['data'].find((user) => user.user_role === 'sys admin');

    if(!(!sysAdmin || this.editRole !== 'sys admin' || (sysAdmin['user_id'] === this.editId && this.editType === EditType.UPDATE))) {
      // sys admin conflict, show alert message
      this.roleAlertText = `There can only be one system administrator. By adding this role to user <${this.editFirstName} ${this.editLastName}> you are making them the system administrator and demoting <${sysAdmin['user_firstname']} ${sysAdmin['user_lastname']}> to an admin.  This will prevent him from managing payment information.`;
      this.roleAlertModal.nativeElement.style.display = 'block';
    } else {
      this.save();
    }
  }

  onCloseRemoveModal() {
    this.removeModal.nativeElement.style.display = 'none';
  }

  onConfirmRemove() {
    let selectedUser = this.table.grid.dataSet.selectedRow.data;
    let user_id = selectedUser.user_id;
    let customer_id = selectedUser.customer_id;

    this.userInfoApi.removeUser(user_id, customer_id)
      .then(res => {
        this.removeModal.nativeElement.style.display = 'none';
        this.notificationService.success('Sucess', 'User has been removed', { timeOut: 3000, showProgressBar: false });
        this.logTransaction('Remove user', 'Completed', `User <${selectedUser.user_email}> has been removed`, 'summary');

        this.loadData();
      })
      .catch(err => {
        this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
        this.logTransaction('Remove user', 'Failed', CircularJSON.stringify(err), 'summary');
      });
  }

  onUserRowSelected(event) {
    if (MouseGuard.isDoubleClick()){
      this.onEdit();
    }
  }

  onCloseAlertModal() {
    this.roleAlertModal.nativeElement.style.display = 'none';
  }

  onConfirmSave() {
    this.roleAlertModal.nativeElement.style.display = 'none';

    let sysAdmin = this.data['data'].find((user) => user.user_role === 'sys admin');

    this.userInfoApi.updateUser({
      search_user_id: sysAdmin['user_id'],
      user_role: 'user',
    }).then(res => {
      this.save();
    }).catch(err => {
      this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
    });
  }

  save() {
    let formattedPhone = this.editPhone;

    try {
      formattedPhone = phoneUtil.formatInOriginalFormat(phoneUtil.parseAndKeepRawInput(this.editPhone, 'US'), 'US');
    } catch (err) {
      this.notificationService.alert('Warning', 'Phone number cannot be formatted', { timeOut: 3000, showProgressBar: false });
    }

    const params: any = {
      user_email: this.editEmail,
      user_firstname: this.editFirstName,
      user_lastname: this.editLastName,
      user_phone: formattedPhone,
      user_role: this.editRole,
      customer_office_id: this.editOfficeId,
    };

    if (this.editPassword && this.editPassword !== 'FAKEPW') {
      params.user_password = this.editPassword;
    }

    this.spinner.show();

    if (this.editType === EditType.CREATE) {
      this.userInfoApi.createUser(params)
        .then((user_id: string) => {
          return this.userInfoApi.addCompanyUser(user_id, this.dataStore.currentUser.customer_id);
        })
        .then((status: string) => {
          this.spinner.hide();
          this.editModal.nativeElement.style.display = 'none';

          if (status.includes('added')) {
            this.notificationService.success('Sucess', 'User has been added', { timeOut: 3000, showProgressBar: false });
            this.logTransaction('Create user', 'Completed', `User <${params.user_email}> created`, 'summary');

            this.loadData();
          } else {
            this.notificationService.info('Sucess', 'Company change request has been sent to the user', { timeOut: 3000, showProgressBar: false });
            this.logTransaction('Create user', 'Completed', `Company change request has been sent to the user <${params.user_email}>`, 'summary');
          }
        })
        .catch(err => {
          this.spinner.hide();
          this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
          this.logTransaction('Create user', 'Failed', CircularJSON.stringify(err), 'summary');
        });
    } else {
      params.search_user_id = this.editId;

      this.userInfoApi.updateUser(params)
        .then(res => {
          this.spinner.hide();
          this.editModal.nativeElement.style.display = 'none';

          this.notificationService.success('Sucess', 'User has been updated', { timeOut: 3000, showProgressBar: false });
          this.logTransaction('Update user', 'Completed', `User <${params.user_email}> updated`, 'summary');

          this.loadData();
        })
        .catch(err => {
          this.spinner.hide();
          this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
          this.logTransaction('Update user', 'Failed', CircularJSON.stringify(err), 'summary');
        });
    }
  }

  logTransaction(operation: string, status: string, description: string, transaction_level: string) {
    this.loggerService.logAppTransaction({
      routine_name: 'Customer Portal',
      operation_name: operation,
      user_id: this.dataStore.currentUser['user_id'],
      customer_id: this.dataStore.currentUser['customer_id'],
      function_name: operation,
      operation_status: status,
      operation_status_desc: description,
      transaction_level: transaction_level,
    });
  }
}
