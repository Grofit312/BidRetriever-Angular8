import { Component, OnInit, ViewChild } from '@angular/core';
import { DataStore } from 'app/providers/datastore';
import { ProjectsApi } from 'app/customer-portal/my-projects/my-projects.api.service';
import { NotificationsService } from 'angular2-notifications';
import { ActivatedRoute } from '@angular/router';
import { Logger } from 'app/providers/logger.service';
import { ValidationService } from 'app/providers/validation.service';
import { ProjectFilesApi } from '../project-files/project-files.api.service';
import { NgxSpinnerService } from 'ngx-spinner';
import CustomStore from 'devextreme/data/custom_store';
import DataSource from 'devextreme/data/data_source';

import { DxDataGridComponent, DxToolbarComponent, DxSelectBoxComponent } from 'devextreme-angular';
import { LoadOptions } from 'devextreme/data/load_options';

const CircularJSON = require('circular-json');
const moment = require('moment');
const _ = require('lodash');

@Component({
  selector: 'app-project-submissions',
  templateUrl: './project-submissions.component.html',
  styleUrls: ['./project-submissions.component.scss'],
  providers: [ProjectFilesApi],
})
export class ProjectSubmissionsComponent implements OnInit {
  @ViewChild('submissionGrid', { static: false }) submissionGrid: DxDataGridComponent;
  @ViewChild('addSubmissionModal', { static: false }) addSubmissionModal;
  @ViewChild('submissionDetailModal', { static: false }) submissionDetailModal;
  @ViewChild('submissionRenameModal', { static: false }) submissionRenameModal;
  @ViewChild('removeSubmissionModal', { static: false }) submissionRemoveModal;
  @ViewChild('transactionLogsModal', { static: false }) transactionLogsModal;
  @ViewChild('grid', { static: false }) grid;

  submissionsViewMode = 'all';
  currentProject: any = {};
  selectedSubmission: any = {};

  submissionGridColumns: any[];
  submissionGridDataSource: any;
  submissionGridContent = [];
  submissionGridContentLoaded = false;
  searchWord ='';
  

  constructor(
    public dataStore: DataStore,
    private apiService: ProjectsApi,
    private notificationService: NotificationsService,
    private activatedRoute: ActivatedRoute,
    private loggerService: Logger,
    private validationService: ValidationService,
    private filesApiService: ProjectFilesApi,
    private spinner: NgxSpinnerService
  ) { 

    
    this.submissionGridDataSource = new CustomStore({
      key: 'submission_id',
      load: (loadOptions) => this.gridSubmissionLoadAction(loadOptions)
    });

  }
  gridSubmissionLoadAction(loadOptions: any){
    
    return new Promise((resolve, reject) => {
      
      if (this.submissionGridContentLoaded) {
        const filteredSubmissions = this.getGridSubmissionContentByLoadOption(loadOptions);
        return resolve({
          data: filteredSubmissions,
          totalCount: filteredSubmissions.length
        });
      }

      if (!this.dataStore.currentUser || !this.dataStore.currentCustomer) {
        this.submissionGridContent = [];
        this.submissionGridContentLoaded = false;

        const filteredSubmissions = this.getGridSubmissionContentByLoadOption(loadOptions);
        return resolve({
          data: filteredSubmissions,
          totalCount: filteredSubmissions.length
        });
      }

      
      const findSubmissions= this.apiService.getProjectSubmissions(this.currentProject['project_id'], this.submissionsViewMode, this.dataStore.currentCustomer ? (this.dataStore.currentCustomer['customer_timezone'] || 'eastern') : 'eastern')

      Promise.all([findSubmissions])
        .then(([submissions, dataViewFieldSettings]) =>  {
          
          //this.rowData = _.uniqBy(submissions, ({ submission_id }) => submission_id);
  
          console.log("Submissions",submissions);
          this.submissionGridContent = submissions as any[];
          this.submissionGridContentLoaded = true;
         
            this.submissionGridColumns = [
              { dataField: 'submission_id', dataType: 'number', caption: 'Submission Id', width: 250, visible: false, allowEditing: false },
              { dataField: 'submission_name', caption: 'Submission Name', minWidth: 200, allowEditing: false },
              { dataField: 'submission_type', caption: 'Submission Type', minWidth: 150, allowEditing: false },
              { dataField: 'submission_date', caption: 'Submission Date', minWidth: 100, allowEditing: false, cellTemplate: 'dateCell' },
              { dataField: 'submitter_email', caption: 'Submission Email', minWidth: 200, allowEditing: false },
              { dataField: 'source_sys_name', caption: 'Source', width: 150, minWidth: 100, allowEditing: false },
              { dataField: 'submission_file_count', caption: '# Files', width: 150, minWidth: 150, allowEditing: false },
              { dataField: 'submission_plan_count', caption: '# Plans', width: 150, minWidth: 100, allowEditing: false },
              { dataField: 'submission_process_status', caption: 'Processing Status', width: 150, minWidth: 100, allowEditing: false},
              { dataField: 'submission_process_message', caption: 'Processing Message', width: 150, minWidth: 100, allowEditing: false},
            ];
         

          const filteredSubmissions = this.getGridSubmissionContentByLoadOption(loadOptions);
          return resolve({
            data: filteredSubmissions,
            totalCount: filteredSubmissions.length
          });
        })
        .catch((error) => {
          console.log('Load Error', error);
          this.notificationService.error('Error', error, { timeOut: 3000, showProgressBar: false });
          this.submissionGridContent = [];
          this.submissionGridContentLoaded = false;
          return resolve({
            data: this.submissionGridContent,
            totalCount: this.submissionGridContent.length
          });
        });
    });
  }
  getGridSubmissionContentByLoadOption(loadOptions: any) {
    
    let submissions = this.submissionGridContent;
    let sortName = 'submission_date';

    if (loadOptions.sort && loadOptions.sort.length > 0) {
      sortName = loadOptions.sort[0].selector;
    }
    
    submissions = submissions.sort((first, second) => {
        const sortColumnOption = this.submissionGridColumns.find((column) => column.dataField === sortName);

        let firstValue = first[sortName];
        let secondValue = second[sortName];

  
        if (sortColumnOption) {
          if (sortColumnOption.dataType === 'date' || sortColumnOption.dataType === 'datetime') {
            firstValue = new Date(firstValue).getTime();
            secondValue = new Date(secondValue).getTime();
            firstValue = firstValue.toString().toLowerCase();
            secondValue = secondValue.toString().toLowerCase();
          }
        }

        if(!loadOptions.sort)
        {
          if (firstValue > secondValue ) {
            return -1;
          }
          else return 1;
        }
        let loadOptionIndex = 0;
        while (loadOptionIndex < loadOptions.sort.length) {
          if (firstValue > secondValue && loadOptions.sort[loadOptionIndex].desc) { 
            return -1;
          }   
          if (firstValue < secondValue && !loadOptions.sort[loadOptionIndex].desc) {    
            return -1;
          } 
          if (firstValue === secondValue) {
            loadOptionIndex++;   
            continue;
          }   
          return 1;
        }
        return 1;
      });
    if(this.searchWord)
    {
      submissions = submissions.filter((project) => {
        const isMatched = Object.keys(project).map(key => project[key]).some(item => item.toString().toLowerCase().includes(this.searchWord));
        return isMatched;
      });
    }
    return submissions;
  }

  ngOnInit() {
    if (this.dataStore.currentProject) {
      this.currentProject = this.dataStore.currentProject;
      this.loadSubmissions();
    } else {
      this.dataStore.getProjectState.subscribe(value => {
        if (value) {
          this.currentProject = this.dataStore.currentProject;
          this.loadSubmissions();
        }
      });
    }
  }

  loadSubmissions() {
    // this.rowData = null;

    // this.apiService.getProjectSubmissions(this.currentProject['project_id'], this.submissionsViewMode, this.dataStore.currentCustomer ? (this.dataStore.currentCustomer['customer_timezone'] || 'eastern') : 'eastern').then((submissions: any) => {
    //   this.rowData = submissions;

    //   this.showInitialSubmission();
    // })
    //   .catch(err => {
    //     this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
    //   });
  }

  // showInitialSubmission() {
  //   const initialSubmissionId = this.activatedRoute.snapshot.queryParamMap.get('submission_id');
  //   const submission = this.rowData.find(({ submission_id }) => submission_id === initialSubmissionId);

  //   if (submission) {
  //     this.submissionDetailModal.initialize(this.currentProject, submission, false);
  //   }
  // }
  onDownloadProject() {
    this.apiService.getPublishedLink(this.dataStore.currentProject['project_id'])
      .then((url: string) => {
        const downloadUrl = url.replace('dl=0', 'dl=1');
        window.open(downloadUrl, '_blank');
      })
      .catch(err => {
        this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
      });
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
    const { selectedRowKeys } = this.submissionGrid;

    if (selectedRowKeys.length === 0) {
      this.notificationService.error('No Selection', 'Please select one submission!', { timeOut: 3000, showProgressBar: false });
      return;
    } else if (selectedRowKeys.length > 1) {
      this.notificationService.error('Multiple Selection', 'The system can only view one submission. Please select a single submission.', { timeOut: 3000, showProgressBar: false });
      return;
    }
    const selectedRows = this.submissionGridContent.filter(({ submission_id: submissionId }) => selectedRowKeys.includes(submissionId));
    this.submissionDetailModal.initialize(this.currentProject, selectedRows[0], false);
  }

  onViewSourceSystemLink() {
    const { selectedRowKeys } = this.submissionGrid;

    if (selectedRowKeys.length === 0) {
      this.notificationService.error('No Selection', 'Please select one submission!', { timeOut: 3000, showProgressBar: false });
      return;
    } else if (selectedRowKeys.length > 1) {
      this.notificationService.error('Multiple Selection', 'The system can only view one submission. Please select a single submission.', { timeOut: 3000, showProgressBar: false });
      return;
    }

    const selectedRows = this.submissionGridContent.filter(({ submission_id: submissionId }) => selectedRowKeys.includes(submissionId));
    if (selectedRows[0]['source_url']) {
      window.open(selectedRows[0]['source_url'], '_blank');
    } else {
      this.notificationService.error('Not Found', 'Source system url link not found.', { timeOut: 3000, showProgressBar: false });
    }
  }

  onRemoveSubmission() {
    const { selectedRowKeys } = this.submissionGrid;

    if (selectedRowKeys.length === 0) {
      this.notificationService.error('No Selection', 'Please select one submission!', { timeOut: 3000, showProgressBar: false });
      return;
    } else if (selectedRowKeys.length > 1) {
      this.notificationService.error(
        'Multiple Selection',
        'The system can only rename one submission. Please select a single submission.',
        { timeOut: 3000, showProgressBar: false }
      );
      return;
    }
    const selectedRows = this.submissionGridContent.filter(({ submission_id: submissionId }) => selectedRowKeys.includes(submissionId));
    this.submissionRemoveModal.initialize(selectedRows[0]);
  }

  onRenameSubmission() {
    const { selectedRowKeys } = this.submissionGrid;

    if (selectedRowKeys.length === 0) {
      this.notificationService.error('No Selection', 'Please select one submission!', { timeOut: 3000, showProgressBar: false });
      return;
    } else if (selectedRowKeys.length > 1) {
      this.notificationService.error('Multiple Selection', 'The system can only rename one submission. Please select a single submission.', { timeOut: 3000, showProgressBar: false });
      return;
    }
    
    const selectedRows = this.submissionGridContent.filter(({ submission_id: submissionId }) => selectedRowKeys.includes(submissionId));
    this.selectedSubmission = selectedRows[0];
    this.submissionRenameModal.nativeElement.style.display = 'block';
  }

  onViewTransactionLogs() {
    const { selectedRowKeys } = this.submissionGrid;

    if (selectedRowKeys.length === 0) {
      this.notificationService.error('No Selection', 'Please select one submission!', { timeOut: 3000, showProgressBar: false });
      return;
    } else if (selectedRowKeys.length > 1) {
      this.notificationService.error('Multiple Selection', 'The system can only rename one submission. Please select a single submission.', { timeOut: 3000, showProgressBar: false });
      return;
    }
    const selectedRows = this.submissionGridContent.filter(({ submission_id: submissionId }) => selectedRowKeys.includes(submissionId));
    this.transactionLogsModal.initialize(this.currentProject, selectedRows[0]);
  }

  onViewSubmissionEmail() {
    const { selectedRowKeys } = this.submissionGrid;

    if (selectedRowKeys.length === 0) {
      this.notificationService.error('No Selection', 'Please select one submission!', { timeOut: 3000, showProgressBar: false });
      return;
    } else if (selectedRowKeys.length > 1) {
      this.notificationService.error('Multiple Selection', 'Please select just one submission!', { timeOut: 3000, showProgressBar: false });
      return;
    }

    const selectedRows = this.submissionGridContent.filter(({ submission_id: submissionId }) => selectedRowKeys.includes(submissionId));
    const bucketName = selectedRows[0]['submission_email_file_bucket'];
    const fileKey = selectedRows[0]['submission_email_file_key'];

    if (bucketName && fileKey) {
      window.open(`/email-viewer?bucket_name=${bucketName}&file_key=${fileKey}`, '_blank');
    } else {
      this.notificationService.error('Not Found', 'Email file not found.', { timeOut: 3000, showProgressBar: false });
    }
  }

  onRefresh() {
    
    this.submissionGridContentLoaded = false;
    if (this.submissionGrid && this.submissionGrid.instance) {
      this.submissionGrid.instance.refresh();
    }
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
      this.onRefresh();
  }

  onCancelRenaming() {
    this.submissionRenameModal.nativeElement.style.display = 'none';
  }

  onExport() {
    if (this.submissionGrid && this.submissionGrid.instance) {
      this.submissionGrid.instance.exportToExcel(false);
    }
  }


  /* Table Event: Global Search */
  onSearchChange(searchWord: string) {
    if(this.submissionGrid && this.submissionGrid.instance){
      this.submissionGrid.instance.refresh();
    }
  }
  toolbarViewSubmissionAction(){
    const { selectedRowKeys } = this.submissionGrid;
    if (selectedRowKeys.length === 0) {
      this.notificationService.error('No Selection', 'Please select one submission!', { timeOut: 3000, showProgressBar: false });
      return;
    } else if (selectedRowKeys.length > 1) {
      this.notificationService.error('Multiple Selection', 'The system can only view one submission. Please select a single submission.', { timeOut: 3000, showProgressBar: false });
      return;
    }
    const selectedRows = this.submissionGridContent.filter(({ submission_id: submissionId }) => selectedRowKeys.includes(submissionId));
    this.submissionDetailModal.initialize(this.currentProject, selectedRows[0], false);
  }

  addSubmissionGridMenuItems(e){
    
    
    if (!e.row) { return; }
    
    e.component.selectRows([e.row.data.submission_id]);

    if (e.row && e.row.rowType === 'data') {   // e.items can be undefined
      if (!e.items) { e.items = []; }

      
      e.items.push(
        {
          type: 'normal',
          text: 'Add Submission',
          onClick: () => this.onAddSubmission()
        },
        {
          type: 'normal',
          text: 'View Submission',
          onClick: () => this.onViewSubmission()
        },
        {
          type: 'normal',
          text: 'View Source System Link',
          onClick: () => this.onViewSourceSystemLink()
        },
        {
          type: 'normal',
          text: 'View Submission Email',
          onClick: () => this.onViewSubmissionEmail()
        },
        {
          type: 'normal',
          text: 'Remove Submission',
          onClick: () => this.onRemoveSubmission()
        },
       {
          type: 'normal',
          text: 'Download All Files',
          onClick: () => this.onDownloadProject()
        }, 
        {
          type: 'normal',
          text: 'Export List To CSV',
          onClick: () => this.onExport()
        },
        {
          type: 'normal',
          text: 'View Transaction Log',
          onClick: () => this.onViewTransactionLogs()
        },
        {
          type: 'normal',
          text: 'Refresh Grid',
          onClick: () => this.onRefresh()
        },
        {
          type: 'normal',
          text: 'Help',
          onClick: () => this.onHelp()
        }
      );
    }
    return e;
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
