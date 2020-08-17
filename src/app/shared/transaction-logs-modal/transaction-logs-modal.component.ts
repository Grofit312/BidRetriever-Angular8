import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ProjectsApi } from 'app/customer-portal/my-projects/my-projects.api.service';

import { NotificationsService } from 'angular2-notifications';
import { IGetRowsParams } from 'ag-grid-community/dist/lib/rowModels/iDatasource';
import { DataStore } from 'app/providers/datastore';

@Component({
  selector: 'transaction-logs-modal',
  templateUrl: './transaction-logs-modal.component.html',
  styleUrls: ['./transaction-logs-modal.component.scss']
})
export class TransactionLogsModalComponent implements OnInit {

  @ViewChild('transactionLogsModal', { static: false }) transactionLogsModal: ElementRef;
  @ViewChild('grid', { static: false }) grid;

  currentProject = {};
  currentSubmission = {};
  currentDocument = {};

  searchWord = '';

  rowData = null;

  gridOptions = {
    pagination: true,
    paginationAutoPageSize: true
  };

  columnDefs = [
    {
      headerName: 'Project Name',
      field: 'project_name',
      minWidth: 150,
      resizable: true,
      sortable: true,
      filter: true,
    },
    {
      headerName: 'Submission Name',
      field: 'submission_name',
      minWidth: 150,
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
      headerName: 'Operation Datetime',
      field: 'operation_datetime',
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
      headerName: 'Document Number',
      field: 'document_number',
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

  initialize(selectedProject: any, selectedSubmission: any = null, selectedDocument: any = null) {
    this.currentProject = selectedProject;
    this.currentSubmission = selectedSubmission;
    this.currentDocument = selectedDocument;

    this.rowData = null;
    this.searchWord = '';
    this.grid.gridOptions.api.paginationGoToFirstPage();

    this.transactionLogsModal.nativeElement.style.display = 'block';

    this.loadTransactionLogs();
  }

  onRefresh() {
    this.loadTransactionLogs();
  }

  loadTransactionLogs() {
    this.apiService.findTransactionLogs(
      this.currentProject['project_id'],
      this.currentSubmission && this.currentSubmission['submission_id'],
      this.currentDocument && this.currentDocument['doc_id'],
      this.dataStore.currentCustomer ? (this.dataStore.currentCustomer['customer_timezone'] || 'eastern') : 'eastern',
    ).then((logs: any) => {
      this.rowData = logs;
    }).catch(err => {
      console.log(err);
      this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
    });
  }

  onCloseModal() {
    this.transactionLogsModal.nativeElement.style.display = 'none';
  }

  /* Table Event: Global Search */
  onSearchChange(searchWord: string) {
    this.grid.gridOptions.api.setQuickFilter(searchWord);
  }
}