import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { DataStore } from 'app/providers/datastore';
import { ProjectsApi } from 'app/customer-portal/my-projects/my-projects.api.service';

import { NotificationsService } from 'angular2-notifications';
import { AmazonService } from 'app/providers/amazon.service';
import * as moment from 'moment';
import { GridOptions } from 'ag-grid-community';

@Component({
  selector: 'submission-detail-modal',
  templateUrl: './submission-detail-modal.component.html',
  styleUrls: ['./submission-detail-modal.component.scss']
})
export class SubmissionDetailModalComponent implements OnInit {

  @ViewChild('submissionDetailModal', { static: false }) submissionDetailModal: ElementRef;
  @ViewChild('grid', { static: false }) grid;
  @ViewChild('transactionLogsModal', { static: false }) transactionLogsModal;
  @ViewChild('documentDetailModal', { static: false }) documentDetailModal;

  documentsViewMode = 'all';
  currentProject: any = {};
  currentSubmission: any = {};

  hasTransparentBackground = true;

  columnDefs = [
    {
      headerName: 'Original Filename',
      field: 'project_doc_original_filename',
      sortable: true,
      filter: true,
      resizable: true,
      editable: false,
      minWidth: 200,
      checkboxSelection: true,
      rowDrag: true,
    },
    {
      headerName: 'Document Name',
      field: 'doc_name',
      sortable: true,
      filter: true,
      resizable: true,
      editable: false,
      width: 200,
    },
    {
      headerName: 'Doc Number',
      field: 'doc_number',
      sortable: true,
      filter: true,
      resizable: true,
      editable: false,
      width: 150,
    },
    {
      headerName: 'Revision',
      field: 'doc_revision',
      sortable: true,
      filter: true,
      resizable: true,
      editable: false,
      width: 100,
    },
    {
      headerName: 'Discipline',
      field: 'doc_discipline',
      sortable: true,
      resizable: true,
      editable: false,
      width: 150,
      minWidth: 100,
    },
    {
      headerName: 'Size',
      field: 'file_size',
      sortable: true,
      filter: true,
      resizable: true,
      editable: false,
      width: 100,
      minWidth: 100,
    },
    {
      headerName: 'Create Date',
      field: 'create_datetime',
      sortable: true,
      filter: true,
      resizable: true,
      editable: false,
      width: 200,
      minWidth: 200,
    },
    {
      headerName: 'Type',
      field: 'doc_type',
      sortable: true,
      filter: true,
      resizable: true,
      editable: false,
      width: 200,
      minWidth: 200,
    },
    {
      headerName: 'Submitted Date',
      field: 'submission_datetime',
      sortable: true,
      filter: true,
      resizable: true,
      editable: false,
      width: 200,
      minWidth: 200,
    },
    {
      headerName: 'Process Status',
      field: 'process_status',
      sortable: true,
      filter: true,
      resizable: true,
      editable: false,
      width: 150,
      minWidth: 150,
    },
  ];

  rowData = null;
  selectedCount = 0;
  gridOptions: GridOptions;

  constructor(
    public dataStore: DataStore,
    private apiService: ProjectsApi,
    private amazonService: AmazonService,
    private notificationService: NotificationsService,
  ) { }

  ngOnInit() {

    if (this.gridOptions) {
      this.gridOptions.api.sizeColumnsToFit();
    }

  }

  initialize(selectedProject: any, selectedSubmission: any, isTransparent = true) {
    this.currentProject = selectedProject;
    this.currentSubmission = selectedSubmission;
    this.submissionDetailModal.nativeElement.style.display = 'block';
    this.hasTransparentBackground = isTransparent;

    this.loadDocuments();
  }

  loadDocuments() {
    this.rowData = null;

    this.apiService.getSubmissionDocuments(this.currentProject['project_id'], this.currentSubmission['submission_id'], this.dataStore.currentCustomer ? (this.dataStore.currentCustomer['customer_timezone'] || 'eastern') : 'eastern').then((documents: any) => {
      if (this.documentsViewMode === 'all') {
        this.rowData = documents;
      } else {
        this.rowData = documents.filter(document => document.doc_type.includes('original_'));
      }
    })
      .catch(err => {
        this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
      });
  }

  onChangeDocumentViewMode() {
    this.onRefresh();
  }

  onEditDocument() {
  }

  onViewDocument() {
    const selectedDocuments = this.grid.api.getSelectedRows();

    if (selectedDocuments.length === 0) {
      this.notificationService.error('No Selection', 'Please select one document!', { timeOut: 3000, showProgressBar: false });
      return;
    } else if (selectedDocuments.length > 1) {
      this.notificationService.error('Multiple Selection', 'Please select a single document.', { timeOut: 3000, showProgressBar: false });
      return;
    }

    if (selectedDocuments[0]['doc_type'] === 'original_other_project_document') {
      return this.onDownloadFile();
    }

    const { currentUser: { user_id: userId } } = this.dataStore;
    window.open(`${window['env'].docViewerBaseUrl}?project_id=${this.currentProject['project_id']}&user_id=${userId}&doc_id=${selectedDocuments[0]['doc_id']}&doc_type=normal`, '_blank');
  }

  onViewDocumentDetails() {
    const selectedDocuments = this.grid.api.getSelectedRows();

    if (selectedDocuments.length === 0) {
      this.notificationService.error('No Selection', 'Please select one document!', { timeOut: 3000, showProgressBar: false });
      return;
    } else if (selectedDocuments.length > 1) {
      this.notificationService.error('Multiple Selection', 'Please select a single document.', { timeOut: 3000, showProgressBar: false });
      return;
    }

    this.documentDetailModal.initialize(this.currentProject, this.currentSubmission, selectedDocuments[0]);
  }

  onViewSourceSystemLink() {
    if (this.currentSubmission['source_url']) {
      window.open(this.currentSubmission['source_url'], '_blank');
    } else {
      this.notificationService.error('Not Found', 'Source system url link not found.', { timeOut: 3000, showProgressBar: false });
    }
  }

  onViewSubmissionEmail() {
    const bucketName = this.currentSubmission['submission_email_file_bucket'];
    const fileKey = this.currentSubmission['submission_email_file_key'];

    if (bucketName && fileKey) {
      window.open(`/email-viewer?bucket_name=${bucketName}&file_key=${fileKey}`, '_blank');
    } else {
      this.notificationService.error('Not Found', 'Email file not found.', { timeOut: 3000, showProgressBar: false });
    }
  }

  onRemoveSubmission() {

  }

  onDownloadFile() {
    const selectedDocuments = this.grid.api.getSelectedRows();

    if (selectedDocuments.length === 0) {
      this.notificationService.error('No Selection', 'Please select one document!', { timeOut: 3000, showProgressBar: false });
      return;
    } else if (selectedDocuments.length > 1) {
      this.notificationService.error('Multiple Selection', 'Please select a single document.', { timeOut: 3000, showProgressBar: false });
      return;
    }

    this.apiService.getDocument(selectedDocuments[0]['doc_id'])
      .then((doc: any) => {
        return this.amazonService.getPresignedUrl(doc['bucket_name'], doc['file_key']);
      })
      .then((url: string) => {
        window.open(url, '_blank');
      })
      .catch(err => {
        this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
      });
  }

  onDownloadSubmission() {
  }

  onViewTransactionLogs() {
    const selectedDocuments = this.grid.api.getSelectedRows();

    if (selectedDocuments.length === 0) {
      this.notificationService.error('No Selection', 'Please select one document!', { timeOut: 3000, showProgressBar: false });
      return;
    } else if (selectedDocuments.length > 1) {
      this.notificationService.error('Multiple Selection', 'Please select a single document.', { timeOut: 3000, showProgressBar: false });
      return;
    }

    this.transactionLogsModal.initialize(this.currentProject, this.currentSubmission, selectedDocuments[0]);
  }

  onViewSubmissionDetails() {

  }

  onExport() {
    this.grid.gridOptions.api.exportDataAsCsv({
      fileName: `${this.currentProject['project_name']}_submission_files_${moment().format('YYYY-MM-DD_HH-mm')}`,
    });
  }

  onRefresh() {
    this.loadDocuments();
  }

  onHelp() {

  }

  onCloseModal() {
    localStorage.removeItem('submission_id');
    this.submissionDetailModal.nativeElement.style.display = 'none';
  }

  /* Table Event: Cell Changed */
  onCellValueChanged(event: any) {
  }

  /* Table Event: Grid Ready */
  onGridReady(event: any) {
    const defaultSortModel = [
      { colId: "doc_number", sort: "asc" },
    ];
    event.api.setSortModel(defaultSortModel);
  }

  /* Table Event: Grid Selection Changed */
  onGridSelectionChanged(event: any) {
    this.selectedCount = event.api.getSelectedRows().length;
  }

  /* Table Event: Global Search */
  onSearchChange(searchWord: string) {
    this.grid.gridOptions.api.setQuickFilter(searchWord);
  }
}
