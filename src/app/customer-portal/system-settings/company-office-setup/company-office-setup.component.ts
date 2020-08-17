import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CompanyOfficeApi } from './company-office-setup.api.service';
import { LocalDataSource } from 'ng2-smart-table';
import { NotificationsService } from 'angular2-notifications';
import { DataStore } from 'app/providers/datastore';
import { NgxSpinnerService } from 'ngx-spinner';
import { MouseGuard } from 'app/providers/mouseguard';
import { Logger } from 'app/providers/logger.service';
import { UserInfoApi } from '../user-setup/user-setup.api.service';

const CircularJSON = require('circular-json');
const addressParser = require('parse-address');
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();

enum EditType {
  CREATE,
  UPDATE,
}

@Component({
  selector: 'app-company-office-setup',
  templateUrl: './company-office-setup.component.html',
  styleUrls: ['./company-office-setup.component.scss'],
  providers: [CompanyOfficeApi, UserInfoApi]
})
export class CompanyOfficeSetupComponent implements OnInit {
  @ViewChild('table', { static: true }) table;
  @ViewChild('editModal', { static: true }) editModal: ElementRef;
  @ViewChild('removeModal', { static: true }) removeModal: ElementRef;

  editType: EditType;

  editOfficeId = '';
  editOfficeHeadOffice = false;
  editOfficeName = '';
  editOfficeAddress = '';
  editOfficePhone = '';
  editOfficeAdminUserId = '';
  editOfficeTimezone = '';

  users = [];

  editModalTitle = '';
  editModalDescriptionText = '';
  removeDescriptionText = '';

  settings = {
    columns: {
      company_office_name: {
        title: 'Name',
      },
      company_office_state: {
        title: 'State'
      },
      company_office_city: {
        title: 'City',
      },
      company_office_admin_display_name: {
        title: 'Administrator'
      },
      company_office_headoffice: {
        title: 'Head Office',
        sort: true,
        sortDirection: 'desc',
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

  constructor(
    private notificationService: NotificationsService,
    public dataStore: DataStore,
    private companyOfficeApi: CompanyOfficeApi,
    private userApi: UserInfoApi,
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
    this.companyOfficeApi.findOffices(this.dataStore.currentUser.customer_id)
      .then((offices: any[]) => {
        this.data = new LocalDataSource(offices);
        this.data.reset();
        return this.userApi.findUsers(this.dataStore.currentUser.customer_id);
      })
      .then((users: any[]) => {
        this.users = users;
      })
      .catch(err => {
        this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
      });
  }

  onAdd () {
    this.editModalTitle = 'Add New Company Office Location';
    this.editModalDescriptionText = `Defining Company Offices or Location allows the system to filter projects and
    calendar items for each office.\nUsers can be assigned to offices so that they have access to the projects or
    calendar items associated with that location`;

    this.editOfficeName = '';
    this.editOfficeAddress = '';
    this.editOfficePhone = '';
    this.editOfficeAdminUserId = '';
    this.editOfficeTimezone = '';

    this.editModal.nativeElement.style.display = 'block';
    this.editType = EditType.CREATE;
  }

  onRemove () {
    const selectedOffice = this.table.grid.dataSet.selectedRow.data;

    if (selectedOffice) {
      this.removeDescriptionText = `Are You Sure You Want To Remove ${selectedOffice.company_office_name}?`;
      this.removeModal.nativeElement.style.display = 'block';
    } else {
      this.notificationService.error('Error', 'Please select a user first', { timeOut: 3000, showProgressBar: false });
    }
  }

  onEdit () {
    const selectedOffice = this.table.grid.dataSet.selectedRow.data;

    if (selectedOffice) {
      this.editModalTitle = `Edit Company Office`;
      this.editModalDescriptionText = `Defining Company offices or locations allow the system to filter projects and
      calendar items for each office.\nUsers can be assigned to offices so that they have access to the projects or calendar
      items associated with that location.`;

      this.editOfficeId = selectedOffice.company_office_id;
      this.editOfficeHeadOffice = selectedOffice.company_office_headoffice;
      this.editOfficeName = selectedOffice.company_office_name;
      this.editOfficeAddress = (`${selectedOffice.company_office_address1} ${selectedOffice.company_office_address2} `
        + `${selectedOffice.company_office_city} ${selectedOffice.company_office_state} `
        + `${selectedOffice.company_office_zip} ${selectedOffice.company_office_country}`).trim();
      this.editOfficePhone = selectedOffice.company_office_phone;
      this.editOfficeTimezone = selectedOffice.company_office_timezone;
      this.editOfficeAdminUserId = selectedOffice.company_office_admin_user_id;

      this.editModal.nativeElement.style.display = 'block';
      this.editType = EditType.UPDATE;
    } else {
      this.notificationService.error('Error', 'Please select an office', { timeOut: 3000, showProgressBar: false });
    }
  }

  onCloseEditModal() {
    this.editModal.nativeElement.style.display = 'none';
  }

  onSave() {
    this.save();
  }

  onCloseRemoveModal() {
    this.removeModal.nativeElement.style.display = 'none';
  }

  onConfirmRemove() {
    const selectedOffice = this.table.grid.dataSet.selectedRow.data;

    this.spinner.show();

    this.companyOfficeApi.updateOffice({
      search_company_office_id: selectedOffice['company_office_id'],
      status: 'deleted',
    }).then(res => {
      this.spinner.hide();
      this.removeModal.nativeElement.style.display = 'none';
      this.notificationService.success('Success', 'Removed office', { timeOut: 3000, showProgressBar: false });

      this.loadData();
    }).catch(err => {
      this.spinner.hide();
      this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
    });
  }

  onUserRowSelected(event) {
    if (MouseGuard.isDoubleClick()) {
      this.onEdit();
    }
  }

  save() {
    let formattedPhone = this.editOfficePhone;
    let parsedAddress = null;

    try {
      formattedPhone = phoneUtil.formatInOriginalFormat(phoneUtil.parseAndKeepRawInput(this.editOfficePhone, 'US'), 'US');
    } catch (err) {
      this.notificationService.alert('Warning', 'Phone number cannot be formatted', { timeOut: 3000, showProgressBar: false });
    }

    try {
      parsedAddress = addressParser.parseAddress(this.editOfficeAddress);
    } catch (err) {
      this.notificationService.alert('Warning', 'Failed to parse company address', { timeOut: 3000, showProgressBar: false });
    }

    const params = {
      customer_id: this.dataStore.currentUser['customer_id'],
      company_office_name: this.editOfficeName,
      company_office_phone: formattedPhone,
      company_office_admin_user_id: this.editOfficeAdminUserId || '',
      company_office_timezone: this.editOfficeTimezone || '',
    };

    if (parsedAddress) {
      params['company_office_address1'] = `${parsedAddress.number || ''} ${parsedAddress.prefix || ''}`;
      params['company_office_address2'] = `${parsedAddress.street || ''} ${parsedAddress.type || ''}`;
      params['company_office_city'] = parsedAddress.city || '';
      params['company_office_state'] = parsedAddress.state || '';
      params['company_office_zip'] = parsedAddress.zip || '';
      params['company_office_country'] = 'USA';
    }

    this.spinner.show();

    if (this.editType === EditType.CREATE) {
      this.companyOfficeApi.createOffice(params)
        .then(res => {
          this.spinner.hide();
          this.editModal.nativeElement.style.display = 'none';
          this.loadData();

          this.notificationService.success('Success', 'Office has been created', { timeOut: 3000, showProgressBar: false });
          this.logTransaction('Create Office', 'Completed', `Office <${params.company_office_name}> created`, 'summary');
        })
        .catch(err => {
          this.spinner.hide();
          this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
          this.logTransaction('Create Office', 'Failed', CircularJSON.stringify(err), 'summary');
        });
    } else {
      params['search_company_office_id'] = this.editOfficeId;
      params['company_office_headoffice'] = this.editOfficeHeadOffice;

      this.companyOfficeApi.updateOffice(params)
        .then(res => {
          this.spinner.hide();
          this.editModal.nativeElement.style.display = 'none';
          this.loadData();

          this.notificationService.success('Success', 'Office has been updated', { timeOut: 3000, showProgressBar: false });
          this.logTransaction('Update Office', 'Completed', `Office <${params.company_office_name}> created`, 'summary');
        })
        .catch(err => {
          this.spinner.hide();
          this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
          this.logTransaction('Update Office', 'Failed', CircularJSON.stringify(err), 'summary');
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
