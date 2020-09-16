import { Component, OnInit, ViewChild } from '@angular/core';
import { ProjectSharingApi } from '../view-project/project-sharing/project-sharing.api.service';
import { NotificationsService } from 'angular2-notifications';
import { DataStore } from 'app/providers/datastore';
import { ProjectsApi } from '../my-projects/my-projects.api.service';
import { ViewProjectApi } from '../view-project/view-project.api.service';
import * as uuid from 'uuid/v1';
import { AmazonService } from 'app/providers/amazon.service';
import { NgxSpinnerService } from 'ngx-spinner';
import DateTimeUtils from 'app/utils/date-time';
const _ = require('lodash');
import {
	CellMouseOutEvent,
	CellMouseOverEvent,
	CellValueChangedEvent,
	ColDef,
	Column,
	ColumnApi,
	GetContextMenuItemsParams,
	GridApi,
	GridOptions,
	MenuItemDef,
	RowDoubleClickedEvent,
	RowGroupOpenedEvent,
	RowNode,
	RowSelectedEvent,
	SelectionChangedEvent
} from 'ag-grid-community';

@Component({
  selector: 'app-shared-projects',
  templateUrl: './shared-projects.component.html',
  styleUrls: ['./shared-projects.component.scss'],
  providers: [ProjectSharingApi, ProjectsApi, ViewProjectApi],
})
export class SharedProjectsComponent implements OnInit {
  @ViewChild('grid', { static: true }) grid;

  projectViewMode = 'my-user';
  searchWord = '';
  private gridApi;

  columnDefs = [
    {
      headerName: 'Project Name',
      field: 'project_name',
      sortable: true,
      filter: true,
      resizable: true,
      editable: false,
      minWidth: 250,
    },
    {
      headerName: 'Source',
      field: 'share_source_user_email',
      sortable: true,
      filter: true,
      resizable: true,
      editable: false,
      minWidth: 150,
    },
    {
      headerName: 'Source Company',
      field: 'share_source_company_name',
      sortable: true,
      filter: true,
      resizable: true,
      editable: false,
      minWidth: 150,
    },
    {
      headerName: 'Bid Date/Time',
      field: 'project_bid_datetime',
      sortable: true,
      filter: true,
      resizable: true,
      editable: false,
      minWidth: 150,
    },
    {
      headerName: 'City/State',
      field: 'project_city_state',
      sortable: true,
      filter: true,
      resizable: true,
      editable: false,
      minWidth: 150,
    },
    {
      headerName: 'Office',
      field: 'share_user_office_name',
      sortable: true,
      filter: true,
      resizable: true,
      editable: false,
      minWidth: 150,
    },
    {
      headerName: 'Create Date',
      field: 'create_datetime',
      sortable: true,
      filter: true,
      resizable: true,
      editable: false,
      minWidth: 150,
    },
    {
      headerName: 'Last Change Date',
      field: 'edit_datetime',
      sortable: true,
      filter: true,
      resizable: true,
      editable: false,
      minWidth: 150,
    },
    
  ];
  rowData = null;

  get selectedSharedProject() {
    const selectedProjects = this.grid.api.getSelectedRows();

    if (selectedProjects.length === 1) {
      return selectedProjects[0];
    }

    return null;
  }

  constructor(
    public dataStore: DataStore,
    private notificationService: NotificationsService,
    private projectSharingApi: ProjectSharingApi,
    private projectApi: ProjectsApi,
    private viewProjectApi: ViewProjectApi,
    private amazonService: AmazonService,
    private spinner: NgxSpinnerService,
  ) { }

  ngOnInit() {
    if (this.dataStore.currentUser) {
      this.load();
    } else {
      this.dataStore.authenticationState.subscribe(value => {
        if (value) {
          this.load();
        }
      });
    }
  }

  load() {
    const params = { detail_level: 'admin' };

    if (this.projectViewMode === 'my-user') {
      params['share_user_id'] = this.dataStore.currentUser['user_id'];
    } else if (this.projectViewMode === 'my-office') {
      params['share_office_id'] = this.dataStore.currentUser['customer_office_id'];
    } else if (this.projectViewMode === 'my-company') {
      params['share_company_id'] = this.dataStore.currentUser['customer_id'];
    } else if (this.projectViewMode === 'public') {
      params['is_public'] = true;
    } else if (this.projectViewMode === 'archived') {
      params['share_user_id'] = this.dataStore.currentUser['user_id'];
      params['status'] = 'archived';
    }

    this.projectSharingApi.findSharedProjects(params,
      this.dataStore.currentCustomer ? (this.dataStore.currentCustomer['customer_timezone'] || 'eastern') : 'eastern')
      .then((sharedProjects: any[]) => {
        this.rowData = _.uniqBy(sharedProjects, ({ project_id }) => project_id);

        if (this.projectViewMode !== 'public') {
          this.rowData = this.rowData.filter(sharedProject => !sharedProject.public);
        }
      })
      .catch(err => {
        this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
      });
  }

  onChangeProjectViewMode() {
    this.load();
  }

  onViewSharedProject() {
    const sharedProject = this.selectedSharedProject;

    if (sharedProject) {
      window.open(sharedProject['share_source_url'], '_blank');
    } else {
      this.notificationService.error('Error', 'Please select a shared project', { timeOut: 3000, showProgressBar: false });
    }
  }

  onAddToMyProjects() {
    const sharedProject = this.selectedSharedProject;

    if (sharedProject) {
      this.spinner.show();

      const { project_id } = sharedProject;
      const newProjectId = uuid();
      const newSubmissionId = uuid();
      const timezone = this.dataStore.currentCustomer['customer_timezone'] || 'eastern';
      const submissionDateTime = DateTimeUtils.getTimestamp();
      const submissionName = DateTimeUtils.convertTimestampToUserTimezone(submissionDateTime, timezone);

      let originProject = {};

      this.viewProjectApi.getProject(project_id, 'eastern')
        .then((project: any) => {
          originProject = project;
          return this.projectApi.createProject({
            project_admin_user_id: this.dataStore.currentUser['user_id'],
            project_name: project.project_name,
            project_id: newProjectId,
            project_address1: project.project_address1,
            project_address2: project.project_address2,
            project_city: project.project_city,
            project_state: project.project_state,
            project_zip: project.project_zip,
            project_country: project.project_country,
            project_desc: project.project_desc,
            project_service_area: project.project_service_area,
            project_number: project.project_number,
            project_bid_datetime: project.project_bid_datetime_origin,
            project_type: project.project_type,
            project_customer_id: this.dataStore.currentUser['customer_id'],
            auto_update_status: project.auto_update_status,
            customer_source_sys_id: project.customer_source_sys_id,
            project_timezone: timezone,
            source_url: project.source_url,
            source_username: project.source_username,
            source_password: project.source_password,
            source_token: project.source_token,
            source_sys_type_id: project.source_sys_type_id,
            project_notes: project.project_notes,
            project_rating: project.project_rating,
            project_award_status: project.project_award_status,
            project_building_type: project.project_building_type,
            project_contract_type: project.project_contract_type,
            project_construction_type: project.project_construction_type,
            project_labor_requirement: project.project_labor_requirement,
            project_segment: project.project_segment,
            project_size: project.project_size,
            project_stage: project.project_stage,
            project_value: project.project_value,
            source_company_id: project.source_company_id,
            source_user_id: project.source_user_id,
          });
        })
        .then(res => {
          return this.projectApi.createProjectSubmission({
            user_id: this.dataStore.currentUser['user_id'],
            submitter_email: this.dataStore.currentUser['user_email'],
            submission_id: newSubmissionId,
            submission_name: submissionName,
            project_id: newProjectId,
            project_name: originProject['project_name'],
            customer_id: this.dataStore.currentUser['customer_id'],
            source_url: originProject['source_url'],
            source_sys_type_id: originProject['source_sys_type_id'],
            received_datetime: submissionDateTime,
            project_number: originProject['project_number'],
            user_timezone: timezone,
            submission_type: 'shared_project',
          });
        })
        .then(res => {
          return this.amazonService.createProjectRetrievalRecord({
            submission_id: newSubmissionId,
            source_url: originProject['project_id'],
            email_username: this.dataStore.currentUser['user_email'],
            submitter_email: this.dataStore.currentUser['user_email'],
            source_sys_type_id: 'bidretriever',
            vault_bucket: this.amazonService.tempBucketName,
            process_status: 'queued',
            project_name: originProject['project_name'],
            submission_type: 'shared_project',
            submission_datetime: submissionDateTime,
            user_timezone: timezone,
            project_id: newProjectId,
            submitter_id: this.dataStore.currentUser['user_id'],
          });
        })
        .then(res => {
          this.spinner.hide();
          this.notificationService.success('Success', 'Project has been added', { timeOut: 3000, showProgressBar: false });
        })
        .catch(err => {
          this.spinner.hide();
          this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
        });
    } else {
      this.notificationService.error('Error', 'Please select a shared project', { timeOut: 3000, showProgressBar: false });
    }
  }

  onViewSharedProjectFiles() {
    const sharedProject = this.selectedSharedProject;

    if (sharedProject) {
      this.projectApi.getPublishedLink(sharedProject['project_id'])
        .then((url: string) => {
          window.open(url, '_blank');
        })
        .catch(err => {
          this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
        });
    } else {
      this.notificationService.error('Error', 'Please select a shared project', { timeOut: 3000, showProgressBar: false });
    }
  }

  onArchiveSharedProject() {
    const sharedProject = this.selectedSharedProject;

    if (sharedProject) {
      const params = {
        search_shared_project_id: sharedProject.shared_project_id,
        status: 'archived',
      };

      this.projectSharingApi.updateSharedProject(params)
        .then(res => {
          this.load();
          this.notificationService.success('Success', 'Shared project archived', { timeOut: 3000, showProgressBar: false });
        })
        .catch(err => {
          this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
        });
    } else {
      this.notificationService.error('Error', 'Please select a shared project', { timeOut: 3000, showProgressBar: false });
    }
  }

  onDeleteSharedProject() {
    const sharedProject = this.selectedSharedProject;

    if (sharedProject) {
      const params = {
        search_shared_project_id: sharedProject.shared_project_id,
        status: 'deleted',
      };

      this.projectSharingApi.updateSharedProject(params)
        .then(res => {
          this.load();
          this.notificationService.success('Success', 'Shared project deleted', { timeOut: 3000, showProgressBar: false });
        })
        .catch(err => {
          this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
        });
    } else {
      this.notificationService.error('Error', 'Please select a shared project', { timeOut: 3000, showProgressBar: false });
    }
  }

  onViewTransactionLog() {

  }

  onRefresh() {
    this.load();
  }

  onHelp() {
  }

  onSearchChange(searchWord: string) {
    this.grid.gridOptions.api.setQuickFilter(searchWord);
  }

  onViewTransactionLogs() {

  }

  onGridReady(event: any) {
    const defaultSortModel = [
      { colId: 'create_datetime', sort: 'desc' },
    ];
    event.api.setSortModel(defaultSortModel);
    event.api.sizeColumnsToFit();
    this.gridApi = event.api;
  }

  onSelectionChanged(event: any) {
    var selectedRows = this.gridApi.getSelectedRows();
    if(selectedRows[0].project_id != null && selectedRows[0].project_id != ''){
      window.open(`/#/customer-portal/view-project/${selectedRows[0].project_id}`, '_blank');
    }
  }

  getContextMenuItems() {
    var result = [
      {
        name: 'Always Disabled',
        disabled: true,
        tooltip:
          'Very long tooltip, did I mention that I am very long, well I am! Long!  Very Long!',
      },
      {
        name: 'Country',
        subMenu: [
          {
            name: 'Ireland',
            action: function () {
              console.log('Ireland was pressed');
            }
          },
          {
            name: 'UK',
            action: function () {
              console.log('UK was pressed');
            },
          },
          {
            name: 'France',
            action: function () {
              console.log('France was pressed');
            },
          },
        ],
      },
      {
        name: 'Person',
        subMenu: [
          {
            name: 'Niall',
            action: function () {
              console.log('Niall was pressed');
            },
          },
          {
            name: 'Sean',
            action: function () {
              console.log('Sean was pressed');
            },
          },
          {
            name: 'John',
            action: function () {
              console.log('John was pressed');
            },
          },
          {
            name: 'Alberto',
            action: function () {
              console.log('Alberto was pressed');
            },
          },
          {
            name: 'Tony',
            action: function () {
              console.log('Tony was pressed');
            },
          },
          {
            name: 'Andrew',
            action: function () {
              console.log('Andrew was pressed');
            },
          },
          {
            name: 'Kev',
            action: function () {
              console.log('Kev was pressed');
            },
          },
          {
            name: 'Will',
            action: function () {
              console.log('Will was pressed');
            },
          },
          {
            name: 'Armaan',
            action: function () {
              console.log('Armaan was pressed');
            },
          },
        ],
      }, // built in separator
      'separator',
      {
        // custom item
        name: 'Windows',
        shortcut: 'Alt + W',
        action: function () {
          console.log('Windows Item Selected');
        },
        icon: '<img src="../images/skills/windows.png"/>',
      },
      {
        // custom item
        name: 'Mac',
        shortcut: 'Alt + M',
        action: function () {
          console.log('Mac Item Selected');
        },
        icon: '<img src="../images/skills/mac.png"/>',
      }, // built in separator
      'separator',
      {
        // custom item
        name: 'Checked',
        checked: true,
        action: function () {
          console.log('Checked Selected');
        },
        icon: '<img src="../images/skills/mac.png"/>',
      }, // built in copy item
      'copy',
      'separator',
      'chartRange',
    ];
  
    return result;
  }
  
}
