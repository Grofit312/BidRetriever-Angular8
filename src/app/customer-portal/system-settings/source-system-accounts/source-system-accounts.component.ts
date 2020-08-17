import { Component, OnInit, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { Ng2SmartTableModule, LocalDataSource, ViewCell } from 'ng2-smart-table';
import { NotificationsService } from 'angular2-notifications';
import { DataStore } from '../../../providers/datastore';
import { NgxSpinnerService } from 'ngx-spinner';
import { MouseGuard } from '../../../providers/mouseguard';
import { SourceSystemAccountsApi } from './source-system-accounts.api.service';
import { UserInfoApi } from 'app/customer-portal/system-settings/user-setup/user-setup.api.service';
import { AmazonService } from 'app/providers/amazon.service';
import { Logger } from 'app/providers/logger.service';
const CircularJSON = require('circular-json');

enum EditType {
  CREATE,
  UPDATE,
}

/**
 *
 * Custom Cell For Displaying Password
 * Show password for 5 seconds on click
 *
 */
@Component({
  selector: 'password-view',
  template: `
    <span (click)="onClick()" style="cursor: pointer;">{{ renderValue }}</span>
  `,
})
export class PasswordCellComponent implements ViewCell, OnInit {
  renderValue: string;
  originValue: string;
  showPasswordTimer = null;

  @Input() value: string | number;
  @Input() rowData: any;

  ngOnInit() {
    this.originValue = this.value.toString();
    this.renderValue = '*'.repeat(this.originValue.length);
  }

  onClick() {
    if (this.showPasswordTimer) {
      clearInterval(this.showPasswordTimer);
    }

    this.renderValue = this.originValue;
    this.showPasswordTimer = setTimeout(() => {
      this.renderValue = '*'.repeat(this.originValue.length);
    }, 5000);
  }
}

/**
 *
 * Custom Cell For Displaying Tooltip
 * Show Tooltip on hover
 *
 */
@Component({
  selector: 'tooltip-view',
  template: `
    <span (mouseenter)="onMouseEnter()" (mouseleave)="onMouseLeave()" style="position:relative;display:inline-block;border-bottom:1px dotted black;">{{ renderValue }}
    <span #tooltip style="visibility:hidden;width:250px;background-color:black;color:white;border-radius:6px;padding:5px 5px;position:absolute;z-index:1;">{{ tooltipValue }}</span>
    </span>
  `,
})
export class TooltipCellComponent implements ViewCell, OnInit {
  renderValue: string;
  tooltipValue: string;

  @ViewChild('tooltip', { static:false}) tooltip: ElementRef;

  @Input() value: string | number;
  @Input() rowData: any;

  ngOnInit() {
    let stringValue = this.value.toString();
    this.renderValue = stringValue.split('@@@')[0];
    this.tooltipValue = stringValue.split('@@@')[1];
  }

  onMouseEnter() {
    this.tooltip.nativeElement.style.visibility = 'visible';
  }

  onMouseLeave() {
    this.tooltip.nativeElement.style.visibility = 'hidden';
  }
}


@Component({
  selector: 'app-customer-portal-source-system-accounts',
  templateUrl: './source-system-accounts.component.html',
  styleUrls: ['./source-system-accounts.component.scss'],
  providers: [SourceSystemAccountsApi, UserInfoApi]
})
export class SourceSystemAccountsComponent implements OnInit {

  @ViewChild('table', { static: true }) table;
  @ViewChild('editModal', { static: true }) editModal: ElementRef;
  @ViewChild('removeModal', { static: true }) removeModal: ElementRef;

  editModalTitle = '';
  removeDescriptionText = '';

  editType: EditType;

  editId = '';
  editSourceSystemName = '';
  editSourceSystemType = '';
  editOtherSourceSystemUrl = '';
  editUsername = '';
  editPassword = '';
  editToken = '';

  settings = {
    columns: {
      customer_source_sys_name: {
        title: 'Source System Name',
        sort: true,
        sortDirection: 'asc'
      },
      source_sys_type_name: {
        title: 'Type',
        type: 'custom',
        renderComponent: TooltipCellComponent,
      },
      username: {
        title: 'Username'
      },
      password: {
        title: 'Password',
        type: 'custom',
        renderComponent: PasswordCellComponent,
      },
      access_token: {
        title: 'Token'
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
  sourceSystemTypes: any;

  constructor(
    private notificationService: NotificationsService,
    public dataStore: DataStore,
    private spinner: NgxSpinnerService,
    private sourceSystemAccountsApi: SourceSystemAccountsApi,
    private amazonService: AmazonService,
    private userInfoApi: UserInfoApi,
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
    this.sourceSystemAccountsApi.findSourceSystemTypes()
      .then((sourceSystemTypes: any) => {
        if (Array.isArray(sourceSystemTypes)) {
          this.sourceSystemTypes = sourceSystemTypes;
        } else {
          this.sourceSystemTypes = [sourceSystemTypes];
        }

        return this.sourceSystemAccountsApi.findSourceSystems(this.dataStore.currentUser.customer_id);
      })
      .then((sourceSystems: any) => {
        let sourceSystemsArray = Array.isArray(sourceSystems) ? sourceSystems : [sourceSystems];

        sourceSystemsArray.forEach((sourceSystem) => {
          let sourceTypeName = sourceSystem.source_sys_type_name;
          let sourceSystemType = this.sourceSystemTypes.find((systemType) => { return systemType.source_type_name === sourceTypeName });

          sourceSystem.source_sys_type_name = `${sourceTypeName}@@@${(!sourceSystemType || !sourceSystemType.source_type_tooltip) ? 'No Tooltip Available' : sourceSystemType.source_type_tooltip}`;
        });

        this.data = new LocalDataSource(sourceSystemsArray);
        this.data.reset();
      })
      .catch(err => {
        this.data = new LocalDataSource([]);
        this.data.reset();

        this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
      });
  }

  onAdd() {
    this.editModalTitle = `Add New Source System For ${this.dataStore.currentUser.customer_name}`;

    this.editSourceSystemName = '';
    this.editSourceSystemType = '';
    this.editOtherSourceSystemUrl = '';
    this.editUsername = '';
    this.editPassword = '';
    this.editToken = '';

    this.editModal.nativeElement.style.display = 'block';
    this.editType = EditType.CREATE;
  }

  onRemove() {
    let selectedSourceSystem = this.table.grid.dataSet.selectedRow.data;

    if (selectedSourceSystem) {
      this.removeDescriptionText = `Are You Sure You Want To Remove ${selectedSourceSystem.customer_source_sys_name}?`;
      this.removeModal.nativeElement.style.display = 'block';
    } else {
      this.notificationService.error('Error', 'Please select a source system', { timeOut: 3000, showProgressBar: false });
    }
  }

  onEdit() {
    let selectedSourceSystem = this.table.grid.dataSet.selectedRow.data;

    if (selectedSourceSystem) {
      this.editModalTitle = `Edit Source System For ${this.dataStore.currentUser.customer_name}`;

      this.editId = selectedSourceSystem.customer_source_sys_id;
      this.editSourceSystemName = selectedSourceSystem.customer_source_sys_name;
      this.editSourceSystemType = selectedSourceSystem.source_sys_type_name.split('@@@')[0];
      this.editOtherSourceSystemUrl = selectedSourceSystem.source_sys_url;
      this.editUsername = selectedSourceSystem.username;
      this.editPassword = selectedSourceSystem.password;
      this.editToken = selectedSourceSystem.access_token;

      this.editModal.nativeElement.style.display = 'block';
      this.editType = EditType.UPDATE;
    } else {
      this.notificationService.error('Error', 'Please select a source system', { timeOut: 3000, showProgressBar: false });
    }
  }

  onCloseEditModal() {
    this.editModal.nativeElement.style.display = 'none';
  }

  onSave() {
    let selectedSourceSystemType = this.sourceSystemTypes.find((sourceSystemType) => {
      return sourceSystemType.source_type_name === this.editSourceSystemType
    });

    let params: any = {
      customer_source_sys_name: this.editSourceSystemName,
      source_sys_type_id: selectedSourceSystemType ? selectedSourceSystemType.source_sys_type_id : '',
      source_sys_url: this.editSourceSystemType === 'googledrive' ? this.editOtherSourceSystemUrl : '',
      username: this.editUsername,
      password: this.editPassword,
      access_token: this.editToken,
    };

    this.spinner.show();

    if (this.editType === EditType.CREATE) {
      params.customer_id = this.dataStore.currentUser.customer_id;

      this.sourceSystemAccountsApi.createSourceSystem(params)
        .then(res => {
          this.spinner.hide();
          this.editModal.nativeElement.style.display = 'none';
          this.notificationService.success('Sucess', 'Source system has been created', { timeOut: 3000, showProgressBar: false });
          this.logTransaction('Create source system', 'Completed', `Created a source system - ${params.customer_source_sys_name}`, 'summary');

          this.loadData();
        })
        .catch(err => {
          this.spinner.hide();
          this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
          this.logTransaction('Create source system', 'Failed', CircularJSON.stringify(err), 'summary');
        });
    } else {
      params.search_customer_source_sys_id = this.editId;

      this.sourceSystemAccountsApi.updateSourceSystem(params)
        .then(res => {
          this.spinner.hide();
          this.notificationService.success('Sucess', 'Source system has been updated', { timeOut: 3000, showProgressBar: false });
          this.editModal.nativeElement.style.display = 'none';

          this.loadData();

          // check 920 table and set auth-failed records status to pending (only for current company users)
          // first, get company users
          return this.userInfoApi.findUsers(this.dataStore.currentUser['customer_id']);
        })
        .then((users: any[]) => {
          const userIdArray = users.map(user => user['user_id']);
          return this.amazonService.updateProjectRetrievalRecords(userIdArray, params.source_sys_type_id);
        })
        .then(res => {
          this.logTransaction('Update source system', 'Completed', `Updated source system - ${params.customer_source_sys_name}`, 'summary');
        })
        .catch(err => {
          this.spinner.hide();
          this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
          this.logTransaction('Update source system', 'Failed', CircularJSON.stringify(err), 'summary');
        });
    }
  }

  onCloseRemoveModal() {
    this.removeModal.nativeElement.style.display = 'none';
  }

  onConfirmRemove() {
    let selectedSourceSystem = this.table.grid.dataSet.selectedRow.data;
    let customer_source_sys_id = selectedSourceSystem.customer_source_sys_id;

    this.sourceSystemAccountsApi.removeSourceSystem(customer_source_sys_id)
      .then(res => {
        this.removeModal.nativeElement.style.display = 'none';
        this.notificationService.success('Sucess', 'Source system has been removed', { timeOut: 3000, showProgressBar: false });
        this.logTransaction('Remove Source System', 'Completed', `Successfully removed source system - ${selectedSourceSystem.customer_source_sys_name}`, 'summary');

        this.loadData();
      })
      .catch(err => {
        this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
        this.logTransaction('Remove Source System', 'Failed', CircularJSON.stringify(err), 'summary');
      });
  }

  onUserRowSelected(event) {
    if (MouseGuard.isDoubleClick()){
      this.onEdit();
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
