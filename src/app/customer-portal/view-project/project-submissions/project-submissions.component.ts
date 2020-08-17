import { Component, OnInit, ViewChild } from '@angular/core';
import { DataStore } from 'app/providers/datastore';
import { ProjectsApi } from 'app/customer-portal/my-projects/my-projects.api.service';
import { NotificationsService } from 'angular2-notifications';
import { ActivatedRoute } from '@angular/router';
import { ViewProjectApi } from '../view-project.api.service';
import { Logger } from 'app/providers/logger.service';
import { ValidationService } from 'app/providers/validation.service';
import { ProjectFilesApi } from '../project-files/project-files.api.service';
import { NgxSpinnerService } from 'ngx-spinner';
const CircularJSON = require('circular-json');
const moment = require('moment');

@Component({
  selector: 'app-project-submissions',
  templateUrl: './project-submissions.component.html',
  styleUrls: ['./project-submissions.component.scss'],
  providers: [ProjectFilesApi],
})
export class ProjectSubmissionsComponent implements OnInit {
  @ViewChild('addSubmissionModal', { static: false }) addSubmissionModal;
  @ViewChild('submissionDetailModal', { static: false }) submissionDetailModal;
  @ViewChild('submissionRenameModal', { static: false }) submissionRenameModal;
  @ViewChild('removeSubmissionModal', { static: false }) submissionRemoveModal;
  @ViewChild('transactionLogsModal', { static: false }) transactionLogsModal;
  @ViewChild('grid', { static: false }) grid;

  submissionsViewMode = 'all';
  currentProject: any = {};
  selectedSubmission: any = {};

  columnDefs = [
    {
      headerName: 'Submission Name',
      field: 'submission_name',
      sortable: true,
      filter: true,
      resizable: true,
      editable: true,
      minWidth: 200,
      checkboxSelection: true,
      rowDrag: true,
    },
    {
      headerName: 'Submission Type',
      field: 'submission_type',
      sortable: true,
      filter: true,
      resizable: true,
      editable: false,
      minWidth: 150,
    },
    {
      headerName: 'Submission Date',
      field: 'submission_date',
      sortable: true,
      filter: true,
      resizable: true,
      editable: false,
      minWidth: 100,
    },
    {
      headerName: 'Submitter Email',
      field: 'submitter_email',
      sortable: true,
      filter: true,
      resizable: true,
      editable: false,
      minWidth: 200,
    },
    {
      headerName: 'Source',
      field: 'source_sys_name',
      sortable: true,
      resizable: true,
      editable: false,
      width: 150,
      minWidth: 100,
    },
    {
      headerName: '# Files',
      field: 'submission_file_count',
      sortable: true,
      filter: true,
      resizable: true,
      editable: false,
      width: 150,
      minWidth: 150,
    },
    {
      headerName: '# Plans',
      field: 'submission_plan_count',
      sortable: true,
      filter: true,
      resizable: true,
      editable: false,
      width: 150,
      minWidth: 100,
    },
    {
      headerName: 'Processing Status',
      field: 'submission_process_status',
      sortable: true,
      filter: true,
      resizable: true,
      editable: false,
      width: 150,
      minWidth: 100,
    },
    {
      headerName: 'Processing Message',
      field: 'submission_process_message',
      sortable: true,
      filter: true,
      resizable: true,
      editable: false,
      width: 150,
      minWidth: 100,
    },
  ];

  rowData = null;

  constructor(
    public dataStore: DataStore,
    private apiService: ProjectsApi,
    private viewProjectApiService: ViewProjectApi,
    private notificationService: NotificationsService,
    private activatedRoute: ActivatedRoute,
    private loggerService: Logger,
    private validationService: ValidationService,
    private filesApiService: ProjectFilesApi,
    private spinner: NgxSpinnerService
  ) { }

  ngOnInit() {

    const projectId = this.activatedRoute.parent.snapshot.params['project_id'];
    this.viewProjectApiService.getProject(projectId, this.dataStore.currentCustomer ? (this.dataStore.currentCustomer['customer_timezone'] || 'eastern') : 'eastern')
      .then(res => {
        this.currentProject = res;
        this.loadSubmissions();
      })
      .catch(err => {
        this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
      });
  }

  loadSubmissions() {
    this.rowData = null;

    this.apiService.getProjectSubmissions(this.currentProject['project_id'], this.submissionsViewMode, this.dataStore.currentCustomer ? (this.dataStore.currentCustomer['customer_timezone'] || 'eastern') : 'eastern').then((submissions: any) => {
      this.rowData = submissions;

      this.showInitialSubmission();
    })
      .catch(err => {
        this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
      });
  }

  showInitialSubmission() {
    const initialSubmissionId = localStorage.getItem('submission_id');
    const submission = this.rowData.find(({ submission_id }) => submission_id === initialSubmissionId);

    if (submission) {
      this.submissionDetailModal.initialize(this.currentProject, submission, false);
    }
  }

  onAddSubmission() {
    const currentProjectStatus = this.currentProject['status'];

    if (currentProjectStatus === 'deleted' || currentProjectStatus === 'archived') {
      this.notificationService.error('Error', 'You cannot add submission to deleted/archived project!', { timeOut: 3000, showProgressBar: false });
    } else {
      this.addSubmissionModal.initialize(this.currentProject, this);
    }
  }

  onViewSubmission() {
    const selectedSubmissions = this.grid.api.getSelectedRows();

    if (selectedSubmissions.length === 0) {
      this.notificationService.error('No Selection', 'Please select one submission!', { timeOut: 3000, showProgressBar: false });
      return;
    } else if (selectedSubmissions.length > 1) {
      this.notificationService.error('Multiple Selection', 'The system can only view one submission. Please select a single submission.', { timeOut: 3000, showProgressBar: false });
      return;
    }

    this.submissionDetailModal.initialize(this.currentProject, selectedSubmissions[0], false);
  }

  onViewSourceSystemLink() {
    const selectedSubmissions = this.grid.api.getSelectedRows();

    if (selectedSubmissions.length === 0) {
      this.notificationService.error('No Selection', 'Please select one submission!', { timeOut: 3000, showProgressBar: false });
      return;
    } else if (selectedSubmissions.length > 1) {
      this.notificationService.error('Multiple Selection', 'The system can only view one submission. Please select a single submission.', { timeOut: 3000, showProgressBar: false });
      return;
    }

    if (selectedSubmissions[0]['source_url']) {
      window.open(selectedSubmissions[0]['source_url'], '_blank');
    } else {
      this.notificationService.error('Not Found', 'Source system url link not found.', { timeOut: 3000, showProgressBar: false });
    }
  }

  onRemoveSubmission() {
    const selectedSubmissions = this.grid.api.getSelectedRows();

    if (selectedSubmissions.length === 0) {
      this.notificationService.error('No Selection', 'Please select one submission!', { timeOut: 3000, showProgressBar: false });
      return;
    } else if (selectedSubmissions.length > 1) {
      this.notificationService.error(
        'Multiple Selection',
        'The system can only rename one submission. Please select a single submission.',
        { timeOut: 3000, showProgressBar: false }
      );
      return;
    }

    this.submissionRemoveModal.initialize(selectedSubmissions[0]);
  }

  onRenameSubmission() {
    const selectedSubmissions = this.grid.api.getSelectedRows();

    if (selectedSubmissions.length === 0) {
      this.notificationService.error('No Selection', 'Please select one submission!', { timeOut: 3000, showProgressBar: false });
      return;
    } else if (selectedSubmissions.length > 1) {
      this.notificationService.error('Multiple Selection', 'The system can only rename one submission. Please select a single submission.', { timeOut: 3000, showProgressBar: false });
      return;
    }

    this.selectedSubmission = selectedSubmissions[0];
    this.submissionRenameModal.nativeElement.style.display = 'block';
  }

  onViewTransactionLogs() {
    const selectedSubmissions = this.grid.api.getSelectedRows();

    if (selectedSubmissions.length === 0) {
      this.notificationService.error('No Selection', 'Please select one submission!', { timeOut: 3000, showProgressBar: false });
      return;
    } else if (selectedSubmissions.length > 1) {
      this.notificationService.error('Multiple Selection', 'The system can only rename one submission. Please select a single submission.', { timeOut: 3000, showProgressBar: false });
      return;
    }

    this.transactionLogsModal.initialize(this.currentProject, selectedSubmissions[0]);
  }

  onViewSubmissionEmail() {
    const selectedSubmissions = this.grid.api.getSelectedRows();

    if (selectedSubmissions.length === 0) {
      this.notificationService.error('No Selection', 'Please select one submission!', { timeOut: 3000, showProgressBar: false });
      return;
    } else if (selectedSubmissions.length > 1) {
      this.notificationService.error('Multiple Selection', 'Please select just one submission!', { timeOut: 3000, showProgressBar: false });
      return;
    }

    const bucketName = selectedSubmissions[0]['submission_email_file_bucket'];
    const fileKey = selectedSubmissions[0]['submission_email_file_key'];

    if (bucketName && fileKey) {
      window.open(`/email-viewer?bucket_name=${bucketName}&file_key=${fileKey}`, '_blank');
    } else {
      this.notificationService.error('Not Found', 'Email file not found.', { timeOut: 3000, showProgressBar: false });
    }
  }

  onRefresh() {
    this.loadSubmissions();
  }

  onHelp() {

  }

  onChangeSubmissionViewMode() {
    this.onRefresh();
  }

  /* Submission Rename Modal Event */
  onSaveRenaming() {
    const submissionName = this.validationService.validateProjectName(this.selectedSubmission['submission_name']);

    if (!submissionName) {
      return this.notificationService.error('Error', 'Please input valid submission name', { timeOut: 3000, showProgressBar: false });
    }

    this.spinner.show();

    // update project
    this.apiService.updateProjectSubmission(this.selectedSubmission['submission_id'], { submission_name: submissionName })
      .then(res => {
        return this.filesApiService.getSubmissionFolders(this.currentProject['project_id'], this.selectedSubmission['submission_id']);
      })
      .then((submissionFolders: any[]) => {
        const tasks = submissionFolders.map(({ folder_id }) => {
          const params = {
            search_folder_id: folder_id,
            folder_name: submissionName,
          };

          return this.filesApiService.updateFolder(params);
        });

        return Promise.all(tasks);
      })
      .then(res => {
        this.submissionRenameModal.nativeElement.style.display = 'none';
        this.selectedSubmission['submission_name'] = submissionName;
        this.grid.api.refreshCells();

        this.notificationService.success('Success', 'Submission has been renamed', { timeOut: 3000, showProgressBar: false });
        this.logTransaction(this.selectedSubmission['submission_id'], 'Rename submission', 'Completed',
          `Renamed submission to <${this.selectedSubmission['submission_name']}>`, 'summary');
        this.spinner.hide();
      })
      .catch(err => {
        this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
        this.logTransaction(this.selectedSubmission['submission_id'], 'Rename submission', 'Failed',
          CircularJSON.stringify(err), 'summary');
        this.spinner.hide();
      });
  }

  onCancelRenaming() {
    this.submissionRenameModal.nativeElement.style.display = 'none';
  }

  onExport() {
    this.grid.gridOptions.api.exportDataAsCsv({
      fileName: `${this.currentProject['project_name']}_submissions_${moment().format('YYYY-MM-DD_HH-mm')}`,
    });
  }

  /* Table Event: Cell Changed */
  onCellValueChanged(event: any) {
    const newValue = this.validationService.validateProjectName(event['newValue']);
    const columnName = event['colDef']['field'];
    const submissionId = event['data']['submission_id'];

    if (!newValue || event['newValue'] === event['oldValue']) {
      return;
    }

    // update project
    this.apiService.updateProjectSubmission(submissionId, { [columnName]: newValue })
      .then(res => {
        this.notificationService.success('Success', 'Submission has been updated', { timeOut: 3000, showProgressBar: false });
        this.logTransaction(submissionId, 'Update submission', 'Completed', 'Update submission info', 'summary');
      })
      .catch(err => {
        this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
        this.logTransaction(submissionId, 'Update submission', 'Failed', CircularJSON.stringify(err), 'summary');
      });
  }

  /* Table Event: Grid Ready */
  onGridReady(event: any) {
    const defaultSortModel = [
      { colId: "submission_date", sort: "desc" },
    ];
    event.api.setSortModel(defaultSortModel);
    event.api.sizeColumnsToFit();
  }

  /* Table Event: Global Search */
  onSearchChange(searchWord: string) {
    this.grid.gridOptions.api.setQuickFilter(searchWord);
  }

  /* Log transaction */
  logTransaction(submission_id: string, operation: string, status: string, description: string, transaction_level: string) {
    this.loggerService.logAppTransaction({
      routine_name: 'Customer Portal',
      operation_name: operation,
      user_id: this.dataStore.currentUser['user_id'],
      customer_id: this.dataStore.currentUser['customer_id'],
      function_name: 'Project Submissions',
      operation_status: status,
      operation_status_desc: description,
      project_id: this.currentProject['project_id'],
      submission_id: submission_id,
      transaction_level: transaction_level,
    });
  }
}
