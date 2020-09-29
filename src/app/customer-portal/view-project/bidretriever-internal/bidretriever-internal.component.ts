import * as _ from 'lodash';

import { Component, OnInit, ViewChild } from '@angular/core';
import { DataStore } from 'app/providers/datastore';
import { ProjectsApi } from 'app/customer-portal/my-projects/my-projects.api.service';

import { NotificationsService } from 'angular2-notifications';
import { Router, ActivatedRoute } from '@angular/router';
import { ViewProjectApi } from 'app/customer-portal/view-project/view-project.api.service';
import { AmazonService } from 'app/providers/amazon.service';
import { SourceSystemAccountsApi } from 'app/customer-portal/system-settings/source-system-accounts/source-system-accounts.api.service';
import { Logger } from 'app/providers/logger.service';

const CircularJSON = require('circular-json');
const moment = require('moment');

@Component({
  selector: 'app-bidretriever-internal',
  templateUrl: './bidretriever-internal.component.html',
  styleUrls: ['./bidretriever-internal.component.scss'],
  providers: [SourceSystemAccountsApi]
})
export class BidretrieverInternalComponent implements OnInit {

  @ViewChild('grid', { static: false }) grid;

  projectSubmissionIds = '';
  destinationId = '';
  sourceSystemTypes = [];

  isLogModalShown = false;
  selectedRoutine = '';
  selectedProjectId = '';
  selectedProjectName = '';
  selectedSubmissionId = '';
  selectedFileId = '';
  selectedPrimaryKey = '';

  tableFilters = [
    { name: 'Not Completed', value: 'not-completed' },
    { name: 'All Status', value: 'all-status' },
    { name: 'Completed', value: 'completed' },
    { name: 'Error', value: 'error' },
    { name: 'Completing', value: 'completing' },
    { name: 'Processing', value: 'processing' },
    { name: 'Queued', value: 'queued' },
    { name: 'Queued Manual', value: 'queued-manual' },
    { name: 'Rasterize Failed', value: 'rasterize-failed' },
    { name: 'Scheduled Duplicated', value: 'scheduled-duplicated' }
  ];
  selectedTableFilter = 'not-completed';

  selectedSubmissionFilter = '';
  submissionFilters = [];

  columnDefs = [
    {
      headerName: 'Table Name',
      field: 'table_name',
      sortable: true,
      resizable: true,
      filter: true,
      minWidth: 150,
      checkboxSelection: true,
    },
    {
      headerName: 'Record Key',
      field: 'record_key',
      sortable: true,
      resizable: true,
      filter: true,
      minWidth: 150
    },
    {
      headerName: 'Create Datetime',
      field: 'create_datetime',
      sortable: true,
      filter: true,
      resizable: true,
      minWidth: 150,
    },
    {
      headerName: 'Edit Datetime',
      field: 'edit_datetime',
      sortable: true,
      filter: true,
      resizable: true,
      minWidth: 150,
      cellStyle: params => {
        if (moment().diff(moment(params.value), 'minutes') > 15) {
          return { color: 'red' };
        } else {
          return null;
        }
      },
    },
    {
      headerName: 'Status',
      field: 'process_status',
      sortable: true,
      filter: true,
      resizable: true,
      minWidth: 100,
    },
    {
      headerName: 'Submission Id',
      field: 'submission_id',
      sortable: true,
      filter: true,
      resizable: true,
      minWidth: 200,
    },
    {
      headerName: 'Original File Name',
      field: 'file_original_filename',
      sortable: true,
      filter: true,
      resizable: true,
      minWidth: 200,
    },
    {
      headerName: 'Original File Path',
      field: 'original_filepath',
      sortable: true,
      filter: true,
      resizable: true,
      minWidth: 200,
    },
    {
      headerName: 'Document Type',
      field: 'doc_type',
      sortable: true,
      filter: true,
      resizable: true,
      minWidth: 200,
    },
    {
      headerName: 'Doc Id',
      field: 'doc_id',
      sortable: true,
      filter: true,
      resizable: true,
      minWidth: 300,
    },
    {
      headerName: 'File Id',
      field: 'file_id',
      sortable: true,
      filter: true,
      resizable: true,
      minWidth: 250,
    },
    {
      headerName: 'Description',
      field: 'description',
      sortable: true,
      filter: true,
      resizable: true,
      editable: true,
      minWidth: 200,
      newValueHandler: (params, key) => {
        return;
      }
    },
  ];

  rowData = [];
  originalRowData = [];

  get selectedRecord() {
    const selectedRecords = this.grid.api.getSelectedRows();

    if (selectedRecords.length === 0) { return null; }

    return _.last(selectedRecords) as any;
  }

  constructor(
    public dataStore: DataStore,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private projectsApi: ProjectsApi,
    private viewProjectApi: ViewProjectApi,
    private sourceSystemApi: SourceSystemAccountsApi,
    private amazonService: AmazonService,
    private notificationService: NotificationsService,
    private loggerService: Logger
  ) {
  }

  ngOnInit() {
    this.loadInternalInfo();
  }

  onGridReady(params): void {
    params.api.sizeColumnsToFit();
  }

  loadInternalInfo() {
    const projectId = this.activatedRoute.parent.snapshot.params['project_id'];

    this.projectsApi.getProjectSubmissions(projectId, 'all', '')
      .then((res: any[]) => {
        this.projectSubmissionIds = res.map(submission => submission['submission_id']).join(', ');
        this.submissionFilters = res.map(({ submission_id, submission_name }) => ({
          value: submission_id,
          name: submission_name || submission_id,
        }))
      })
      .catch(err => {
        this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
      });

    this.viewProjectApi.getProjectSettings(projectId)
      .then((res: any[]) => {
        const destinationId = res.find(setting => setting.setting_name === 'PROJECT_DESTINATION_TYPE_ID');
        destinationId && (this.destinationId = destinationId.setting_value);
      })
      .catch(err => {
        console.log(err);
      });

    this.sourceSystemApi.findSourceSystemTypes()
      .then((res: any[]) => {
        this.sourceSystemTypes = res;
      })
      .catch(err => {
        this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
      });

    this.loadUnCompleteRecords();
  }

  loadUnCompleteRecords() {
    const projectId = this.activatedRoute.parent.snapshot.params['project_id'];

    this.originalRowData = [];
    this.rowData = [];

    this.amazonService.getAllWipRecords(projectId,
      this.dataStore.currentCustomer ? (this.dataStore.currentCustomer['customer_timezone'] || 'eastern') : 'eastern')
      .then((res: any[]) => {
        this.originalRowData = res;
        this.setGridRowData();
      })
      .catch(err => {
        this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
      });
  }

  onUpdateSourceSystemUrl() {
    const currentProject = this.dataStore.currentProject;

    if (currentProject) {
      this.projectsApi.updateProject(currentProject['project_id'], { source_url: currentProject['source_url'] })
        .then(res => {
          this.notificationService.success('Success', 'Source url updated!', { timeOut: 3000, showProgressBar: false });
          this.logTransaction('Update source system url', 'Completed', `Updated source url to ${currentProject['source_url']}`, 'summary');
        })
        .catch(err => {
          this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
          this.logTransaction('Update source system url', 'Failed', CircularJSON.stringify(err), 'summary');
        });
    }
  }

  onUpdateSourceSystemType() {
    const currentProject = this.dataStore.currentProject;

    if (currentProject) {
      this.projectsApi.updateProject(currentProject['project_id'], { source_sys_type_id: currentProject['source_sys_type_id'] })
        .then(res => {
          this.notificationService.success('Success', 'Source system type updated!', { timeOut: 3000, showProgressBar: false });
          this.logTransaction('Update source system type', 'Completed',
            `Updated source system type to <${currentProject['source_sys_type_id']}>`, 'summary');
        })
        .catch(err => {
          this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
          this.logTransaction('Update source system type', 'Failed', CircularJSON.stringify(err), 'summary');
        });
    }
  }

  onResubmitRecord() {
    const selectedRecords: any[] = this.grid.api.getSelectedRows();

    if (!selectedRecords || selectedRecords.length == 0) {
      this.notificationService.error('No Selection', 'Please select a record', { timeOut: 3000, showProgressBar: false });
      return;
    }

    const tasks: Promise<any>[] = selectedRecords.map(record => {
      const { table_name: tableName, record_key: recordKey, description } = record;

      if (tableName === '940') {
        const { sheet_number: sheetNumber } = JSON.parse(description);

        if (sheetNumber) {
          return this.amazonService.updateWipRecordStatus(tableName, recordKey, 'processing', true);
        }
      }
      
      return this.amazonService.updateWipRecordStatus(tableName, recordKey, 'queued', true);
    }).filter(task => !_.isNil(task));

    if (!tasks || tasks.length == 0) {
      return;
    }

    Promise.all(tasks).then(() => {
      this.loadUnCompleteRecords();
      this.notificationService.success('Success', 'Resubmitted Record', { timeOut: 3000, showProgressBar: false });
    }).catch(error => {
      this.notificationService.error('Error', error, { timeOut: 3000, showProgressBar: false });
    });
  }

  onViewRecordLog() {
    const selectedRecord = this.selectedRecord;

    if (!selectedRecord) {
      this.notificationService.error('No Selection', 'Please select a record', { timeOut: 3000, showProgressBar: false });
      return;
    }

    this.selectedProjectId = this.dataStore.currentProject['project_id'];
    this.selectedProjectName = this.dataStore.currentProject['project_name'];
    this.selectedRoutine = selectedRecord['table_name'];
    this.selectedSubmissionId = selectedRecord['submission_id'];
    this.selectedFileId = selectedRecord['file_id'];
    this.selectedPrimaryKey = selectedRecord['record_key'];

    this.isLogModalShown = true;
  }

  onRefresh() {
    this.loadUnCompleteRecords();
  }

  logTransaction(operation: string, status: string, description: string, transaction_level: string) {
    this.loggerService.logAppTransaction({
      routine_name: 'Customer Portal',
      operation_name: operation,
      user_id: this.dataStore.currentUser['user_id'],
      customer_id: this.dataStore.currentUser['customer_id'],
      function_name: 'Bid Retriever Internal',
      operation_status: status,
      operation_status_desc: description,
      project_id: this.activatedRoute.parent.snapshot.params['project_id'],
      transaction_level: transaction_level,
    });
  }

  setGridRowData() {
    if (!this.originalRowData || this.originalRowData.length === 0) {
      this.rowData = [];
    }

    this.rowData = this.originalRowData;

    if (this.selectedSubmissionFilter) {
      this.rowData = this.rowData.filter(({ submission_id }) => submission_id === this.selectedSubmissionFilter);
    }

    switch (this.selectedTableFilter) {
      case 'not-completed':
        this.rowData = this.rowData.filter(({ process_status }) => !process_status.includes('completed'));
        break;
      case 'all-status':
        this.rowData = this.rowData;
        break;
      default:
        this.rowData = this.rowData.filter(({ process_status }) => process_status === this.selectedTableFilter);
        break;
    }
  }

  logModalHiddenAction() {
    this.isLogModalShown = false;
  }

  onSearchChange(searchWord: string) {
    this.grid.gridOptions.api.setQuickFilter(searchWord);
  }
}
