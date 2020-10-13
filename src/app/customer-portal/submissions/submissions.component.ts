import { Component, OnInit, ViewChild } from '@angular/core';
import { DataStore } from 'app/providers/datastore';

import { NotificationsService } from 'angular2-notifications';
import { SubmissionsApi } from 'app/customer-portal/submissions/submissions.api.service';
import { ProjectsApi } from 'app/customer-portal/my-projects/my-projects.api.service';
import { ViewProjectApi } from 'app/customer-portal/view-project/view-project.api.service';
import { CompanyOfficeApi } from '../system-settings/company-office-setup/company-office-setup.api.service';

@Component({
  selector: 'app-submissions',
  templateUrl: './submissions.component.html',
  styleUrls: ['./submissions.component.scss'],
  providers: [SubmissionsApi, ProjectsApi, ViewProjectApi, CompanyOfficeApi]
})
export class SubmissionsComponent implements OnInit {

  @ViewChild('grid', { static: true }) grid;
  @ViewChild('submissionDetailModal', { static: false }) submissionDetailModal;
  @ViewChild('transactionLogsModal', { static: false }) transactionLogsModal;
  @ViewChild('removeSubmissionModal', { static: false }) removeSubmissionModal;

  submissionViewMode = '';
  currentOffice = null;

  columnDefs = [];

  rowData = null;

  refreshTimer: number;
  refreshInterval = 5;

  get isBidRetrieverAdmin() {
    const { originUserEmail } = this.dataStore;
    return originUserEmail && originUserEmail.toLowerCase().includes('bidretriever.net');
  }

  constructor(
    public dataStore: DataStore,
    private apiService: SubmissionsApi,
    private projectsApi: ProjectsApi,
    private viewProjectApi: ViewProjectApi,
    private officeApiService: CompanyOfficeApi,
    private notificationService: NotificationsService,
  ) { }

  ngOnInit() {
    if (this.dataStore.currentUser) {
      this.initialize();
      this.loadSubmissions();
    } else {
      this.dataStore.authenticationState.subscribe(value => {
        if (value) {
          this.initialize();
          this.loadSubmissions();
        }
      });
    }

    this.startRefreshTimer();
  }


  initialize() {
    const isBidRetrieverAdmin = this.isBidRetrieverAdmin;

    this.submissionViewMode = isBidRetrieverAdmin ? 'all' : 'my';

    this.columnDefs = [
      {
        checkboxSelection: true,
        width: 40,
      },
      {
        headerName: 'Project Name',
        field: 'project_name',
        sortable: true,
        filter: true,
        resizable: true,
        rowDrag: true,
        width: 400,
        minWidth: 250,
      },
      {
        headerName: 'Source',
        field: 'source_sys_name',
        sortable: true,
        filter: true,
        resizable: true,
        minWidth: 100,
      },
      {
        headerName: 'Source Company',
        field: 'source_company_name',
        sortable: true,
        filter: true,
        resizable: true,
        minWidth: 100
      },
      {
        headerName: 'Submission Name',
        field: 'submission_name',
        sortable: true,
        filter: true,
        resizable: true,
        minWidth: 50,
      },
      {
        headerName: 'Submission Type',
        field: 'submission_type',
        sortable: true,
        filter: true,
        resizable: true,
        minWidth: 50,
      },
      {
        headerName: 'Submitter Email',
        field: 'submitter_email',
        sortable: true,
        filter: true,
        resizable: true,
        minWidth: 100,
      },
      {
        headerName: 'Submission Date/Time',
        field: 'submission_date',
        sortable: true,
        filter: true,
        resizable: true,
        minWidth: 100,
      },
      {
        headerName: 'Processing Status',
        field: 'submission_process_status',
        sortable: true,
        filter: true,
        resizable: true,
        tooltip: params => { return params.value; },
        minWidth: 100,
        hide: !isBidRetrieverAdmin,
      },
      {
        headerName: 'Processing Message',
        field: 'submission_process_message',
        sortable: true,
        filter: true,
        resizable: true,
        tooltip: params => { return params.value; },
        minWidth: 100,
        hide: !isBidRetrieverAdmin,
      },
      {
        headerName: '# Files',
        field: 'submission_file_count',
        sortable: true,
        resizable: true,
        width: 100,
        minWidth: 100,
      },
      {
        headerName: '# Files Pending',
        field: 'submission_pending_file_count',
        sortable: true,
        resizable: true,
        width: 150,
        minWidth: 150,
      },
      {
        headerName: '# Plans',
        field: 'submission_plan_count',
        sortable: true,
        filter: true,
        resizable: true,
        width: 100,
        minWidth: 100,
      },
      {
        headerName: 'Total Processing Time',
        field: 'total_processing_time',
        sortable: true,
        filter: true,
        resizable: true,
        width: 180,
        minWidth: 150,
        hide: !isBidRetrieverAdmin,
      },
      {
        headerName: 'Submission ID',
        field: 'submission_id',
        sortable: true,
        filter: true,
        resizable: true,
        width: 180,
        minWidth: 150,
        hide: !isBidRetrieverAdmin,
      },
    ];

    if (this.dataStore.currentUser['customer_office_id']) {
      this.officeApiService.getOffice(this.dataStore.currentUser['customer_office_id'])
        .then(office => {
          this.currentOffice = office;
        })
        .catch(err => {
          this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
        });
    }
  }

  loadSubmissions() {
    this.rowData = null;

    const params = {
      submission_process_status: this.isBidRetrieverAdmin ? this.submissionViewMode : 'all',
    };
    const userTimezone = this.dataStore.currentCustomer ? (this.dataStore.currentCustomer['customer_timezone'] || 'eastern') : 'eastern';

    if (!this.isBidRetrieverAdmin) {
      if (this.submissionViewMode === 'my') {
        params['user_id'] = this.dataStore.currentUser['user_id'];
      } else if (this.submissionViewMode === 'office') {
        params['office_id'] = this.dataStore.currentUser['customer_office_id'];
      } else if (this.submissionViewMode === 'all') {
        params['customer_id'] = this.dataStore.currentUser['customer_id'];
      }
    }

    this.apiService.getSubmissions(params, userTimezone).then((submissions: any) => {
      if (this.isBidRetrieverAdmin) {
        this.rowData = submissions;
      } else {
        this.rowData = submissions.filter(({ submission_file_count }) => Number(submission_file_count) > 0);
      }
    })
      .catch(err => {
        this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
      });
  }

  startRefreshTimer() {
    this.refreshTimer = window.setInterval(() => {
      this.onRefresh();
    }, this.refreshInterval * 60 * 1000);
  }

  onDestroy() {
    window.clearInterval(this.refreshTimer);
  }

  /* Switch refresh interval */
  onChangeRefreshInterval() {
    window.clearInterval(this.refreshTimer);

    if (this.refreshInterval > 0) {
      this.startRefreshTimer();
    }
  }

  /* Switch Submission View Mode */
  onChangeSubmissionViewMode() {
    this.onRefresh();
  }

  /* View project */
  onViewProject() {
    const selectedSubmissions = this.grid.api.getSelectedRows();

    if (selectedSubmissions.length === 0) {
      this.notificationService.error('No Selection', 'Please select one submission!', { timeOut: 3000, showProgressBar: false });
      return;
    } else if (selectedSubmissions.length > 1) {
      this.notificationService.error(
        'Multiple Selection',
        'The system can only view one submission. Please select a single submission.',
        { timeOut: 3000, showProgressBar: false }
      );
      return;
    }

    window.open(`/#/customer-portal/view-project/${selectedSubmissions[0]['project_id']}`, '_blank');
  }

  /* View Submission */
  onViewSubmission() {
    const selectedSubmissions = this.grid.api.getSelectedRows();

    if (selectedSubmissions.length === 0) {
      this.notificationService.error('No Selection', 'Please select one submission!', { timeOut: 3000, showProgressBar: false });
      return;
    } else if (selectedSubmissions.length > 1) {
      this.notificationService.error(
        'Multiple Selection',
        'The system can only view one submission. Please select a single submission.',
        { timeOut: 3000, showProgressBar: false }
      );
      return;
    }

    this.viewProjectApi.getProject(selectedSubmissions[0]['project_id'], '')
      .then(project => {
        this.submissionDetailModal.initialize(project, selectedSubmissions[0], false);
      })
      .catch(err => {
        this.notificationService.error('Error', 'Failed to retrieve project info.', { timeOut: 3000, showProgressBar: false });
      });
  }

  /* View published submission */
  onViewPublishedSubmission() {
    const selectedSubmissions = this.grid.api.getSelectedRows();

    if (selectedSubmissions.length === 0) {
      this.notificationService.error('No Selection', 'Please select one submission!', { timeOut: 3000, showProgressBar: false });
      return;
    } else if (selectedSubmissions.length > 1) {
      this.notificationService.error('Multiple Selection', 'Please select just one submission!', { timeOut: 3000, showProgressBar: false });
      return;
    }

    this.projectsApi.getPublishedLink(selectedSubmissions[0]['project_id'], selectedSubmissions[0]['submission_id'])
      .then((url: string) => {
        window.open(url, '_blank');
      })
      .catch(err => {
        this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
      });
  }

  /* View submission email  */
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
      window.open(`/#/email-viewer?bucket_name=${bucketName}&file_key=${fileKey}`, '_blank');
    } else {
      this.notificationService.error('Not Found', 'Email file not found.', { timeOut: 3000, showProgressBar: false });
    }
  }

  /* Delete submission */
  onDeleteSubmission() {
    const selectedSubmissions = this.grid.api.getSelectedRows();

    if (selectedSubmissions.length === 0) {
      this.notificationService.error('No Selection', 'Please select one submission!', { timeOut: 3000, showProgressBar: false });
      return;
    } else if (selectedSubmissions.length > 1) {
      this.notificationService.error('Multiple Selection', 'Please select just one submission!', { timeOut: 3000, showProgressBar: false });
      return;
    }

    this.removeSubmissionModal.initialize(selectedSubmissions[0]);
  }

  /* View transaction log */
  onViewTransactionLogs() {
    const selectedSubmissions = this.grid.api.getSelectedRows();

    if (selectedSubmissions.length === 0) {
      this.notificationService.error('No Selection', 'Please select one submission!', { timeOut: 3000, showProgressBar: false });
      return;
    } else if (selectedSubmissions.length > 1) {
      this.notificationService.error('Multiple Selection',
        'The system can only rename one submission. Please select a single submission.',
        { timeOut: 3000, showProgressBar: false }
      );
      return;
    }

    this.viewProjectApi.getProject(selectedSubmissions[0]['project_id'], '')
      .then(project => {
        this.transactionLogsModal.initialize(project, selectedSubmissions[0]);
      })
      .catch(err => {
        this.notificationService.error('Error', 'Failed to retrieve project info.', { timeOut: 3000, showProgressBar: false });
      });
  }

  /* Refresh Page */
  onRefresh() {
    this.loadSubmissions();
  }

  /* Help */
  onHelp() {

  }

  /**
   * Table Event: Row double clicked
   * @param event
   */
  onRowDoubleClicked(event: any) {
    // window.open(`/#/customer-portal/view-project/${event['data']['project_id']}`, '_blank');
  }

  /* Table Event: Global Search */
  onSearchChange(searchWord: string) {
    this.grid.gridOptions.api.setQuickFilter(searchWord);
  }

  /* Table Event: Grid Ready */
  onGridReady(event: any) {
    const defaultSortModel = [
      { colId: 'submission_date', sort: 'desc' },
    ];
    event.api.setSortModel(defaultSortModel);
    event.api.sizeColumnsToFit();
  }
}
