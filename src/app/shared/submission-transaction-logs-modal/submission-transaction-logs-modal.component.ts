import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ProjectsApi } from 'app/customer-portal/my-projects/my-projects.api.service';

import { NotificationsService } from 'angular2-notifications';
import { IGetRowsParams } from 'ag-grid-community/dist/lib/rowModels/iDatasource';
import { DataStore } from 'app/providers/datastore';

@Component({
  selector: 'submission-transaction-logs-modal',
  templateUrl: './submission-transaction-logs-modal.component.html',
  styleUrls: ['./submission-transaction-logs-modal.component.scss']
})
export class SubmissionTransactionLogsModalComponent implements OnInit {

  @ViewChild('submissionTransactionLogsModal', { static: false }) transactionLogsModal: ElementRef;
  @ViewChild('grid', { static: false }) grid;

  currentProject:any = {};
  currentSubmission:any = {};

  transactionStatus = 'all';
  transactionLevel = 'summary';
  searchWord = '';

  originData = [];
  rowData = null;

  gridOptions = {
    pagination: true,
    paginationAutoPageSize: true
  };

  columnDefs = [
    {
      headerName: 'Operation Datetime',
      field: 'operation_datetime',
      minWidth: 200,
      resizable: true,
      sortable: true,
      filter: true,
    },
    {
      headerName: 'Routine Name',
      field: 'routine_name',
      minWidth: 200,
      resizable: true,
      sortable: true,
      filter: true,
    },
    {
      headerName: 'Function Name',
      field: 'function_name',
      minWidth: 200,
      resizable: true,
      sortable: true,
      filter: true,
    },
    {
      headerName: 'Operation Name',
      field: 'operation_name',
      minWidth: 200,
      resizable: true,
      sortable: true,
      filter: true,
    },
    {
      headerName: 'Operation Data',
      field: 'operation_data',
      minWidth: 150,
      resizable: true,
      sortable: true,
      filter: true,
    },
    {
      headerName: 'Operation Status',
      field: 'operation_status',
      minWidth: 150,
      resizable: true,
      sortable: true,
      filter: true,
    },
    {
      headerName: 'Operation Status Description',
      field: 'operation_status_desc',
      minWidth: 200,
      resizable: true,
      sortable: true,
      filter: true,
    },
    {
      headerName: 'Document Name',
      field: 'document_name',
      minWidth: 150,
      resizable: true,
      sortable: true,
      filter: true,
    },
    {
      headerName: 'Document Number',
      field: 'document_number',
      minWidth: 150,
      resizable: true,
      sortable: true,
      filter: true,
    },
    {
      headerName: 'Document Revision',
      field: 'document_revision',
      minWidth: 150,
      resizable: true,
      sortable: true,
      filter: true,
    },
    {
      headerName: 'Document Type',
      field: 'document_type',
      minWidth: 150,
      resizable: true,
      sortable: true,
      filter: true,
    },
  ];

  constructor(
    private apiService: ProjectsApi,
    private notificationService: NotificationsService,
    public dataStore: DataStore,
  ) { }

  ngOnInit() {
   
  }

  onGridReady(params): void {
    params.api.sizeColumnsToFit();
  }

  initialize(selectedProject: any, selectedSubmission: any = null) {
    this.currentProject = selectedProject;
    this.currentSubmission = selectedSubmission;

    this.rowData = null;
    this.transactionLevel = 'summary';
    this.transactionStatus = 'all';
    this.searchWord = '';
    this.grid.gridOptions.api.paginationGoToFirstPage();

    this.transactionLogsModal.nativeElement.style.display = 'block';

    this.loadTransactionLogs();
  }

  loadTransactionLogs() {
    this.apiService.findTransactionLogs(
      this.currentProject['project_id'],
      this.currentSubmission && this.currentSubmission['submission_id'],
      '',
      this.dataStore.currentCustomer ? (this.dataStore.currentCustomer['customer_timezone'] || 'eastern') : 'eastern',
    )
      .then((logs: any) => {
        this.originData = logs;
        this.filterData();
      })
      .catch(err => {
        console.log(err);
        this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
      });
  }

  filterData() {
    let data = [];

    if (this.transactionStatus === 'failed') {
      data = this.originData.filter(log => log.operation_status === 'Failed');
    } else {
      data = this.originData.filter(() => true);
    }

    if (this.transactionLevel === 'transaction') {
      this.rowData = data.filter(log => log.transaction_level === 'transaction'
        || log.transaction_level === 'detail'
        || log.transaction_level === 'summary'
        || log.transaction_level === '');
    } else if (this.transactionLevel === 'detail') {
      this.rowData = data.filter(log => log.transaction_level === 'detail' || log.transaction_level === 'summary');
    } else {
      this.rowData = data.filter(log => log.transaction_level === 'summary');
    }
  }

  onCloseModal() {
    this.transactionLogsModal.nativeElement.style.display = 'none';
  }

  onViewDetails() {

  }

  onExportLog() {

  }

  onViewFileTransactionLog() {

  }

  onViewProjectTransactionLog() {

  }

  onRefresh() {
    this.rowData = null;
    this.loadTransactionLogs();
  }

  onHelp() {

  }

  onChangeTransactionStatus() {
    this.filterData();
  }

  onChangeTransactionLevel() {
    this.filterData();
  }

  /* Table Event: Global Search */
  onSearchChange(searchWord: string) {
    this.grid.gridOptions.api.setQuickFilter(searchWord);
  }
}
