import { Component, OnInit, ViewChild, ElementRef, ViewEncapsulation } from '@angular/core';
import { DataStore } from 'app/providers/datastore';
import { NotificationsService } from 'angular2-notifications';
import { NgxSpinnerService } from 'ngx-spinner';
import { ProjectsApi } from 'app/customer-portal/my-projects/my-projects.api.service';
import { ValidationService } from 'app/providers/validation.service';
import { Logger } from 'app/providers/logger.service';
import { DatePicker } from 'angular2-datetimepicker';
import * as moment from 'moment';
import { MyCalendarApi } from 'app/customer-portal/my-calendar/my-calendar.component.api.service';
import { CompanyOfficeApi } from 'app/customer-portal/system-settings/company-office-setup/company-office-setup.api.service';
import { UserInfoApi } from 'app/customer-portal/system-settings/user-setup/user-setup.api.service';
const CircularJSON = require('circular-json');

@Component({
  selector: 'edit-project-modal',
  templateUrl: './edit-project-modal.component.html',
  styleUrls: ['./edit-project-modal.component.scss'],
  providers: [MyCalendarApi, ProjectsApi, CompanyOfficeApi, UserInfoApi],
  encapsulation: ViewEncapsulation.None
})
export class EditProjectModalComponent implements OnInit {
  @ViewChild('editProjectModal', { static: true }) editProjectModal: ElementRef;
  parent = null;

  currentProject:any = {};
  preBidDateTime:any = {};
  projectStartDateTime:any = {};
  projectFinishDateTime:any = {};
  workStartDateTime:any = {};
  workFinishDateTime:any = {};
  expectedAwardDateTime:any = {};
  awardDateTime:any = {};
  expectedContractDateTime:any = {};
  contractDateTime:any = {};

  viewMode = 'basic';
  offices = [];
  companyUsers = [];

  constructor(
    public dataStore: DataStore,
    private notificationService: NotificationsService,
    private spinner: NgxSpinnerService,
    private apiService: ProjectsApi,
    private validationService: ValidationService,
    private loggerService: Logger,
    public calendarApi: MyCalendarApi,
    private userApiService: UserInfoApi,
    private officeApi: CompanyOfficeApi,
  ) {
    DatePicker.prototype.ngOnInit = function() {
      this.settings = Object.assign(this.defaultSettings, this.settings);
      if (this.settings.defaultOpen) {
      this.popover = true;
      }
      this.date = new Date();
      };
  }

  ngOnInit() {
  }

  initialize(parent: any, project: any) {
    this.parent = parent;
    this.editProjectModal.nativeElement.style.display = 'block';

    if (!project['project_bid_datetime'] || project['project_bid_datetime'] === 'Invalid date') {
      project['project_bid_datetime'] = new Date();
    }

    this.currentProject = project;
    this.currentProject['project_auto_update_status'] = project['auto_update_status'] === 'active';

    this.userApiService.findUsers(this.dataStore.currentUser['customer_id'])
      .then((users: any[]) => {
        this.companyUsers = users.filter(({ status }) => status === 'active');
        this.companyUsers = this.companyUsers.sort((firstUser, secondUser) => {
          const firstUserEmail = firstUser.user_email ? firstUser.user_email.toLowerCase() : '';
          const secondUserEmail = secondUser.user_email ? secondUser.user_email.toLowerCase() : '';
          return firstUserEmail.localeCompare(secondUserEmail);
        });

        return this.calendarApi.findCalendarEvents(null, this.currentProject['project_id']);
      })
      .then((res: any[]) => {
        this.preBidDateTime = res.find(event => event.calendar_event_type === 'project_prebid_mtg_datetime') || {};
        this.projectStartDateTime = res.find(event => event.calendar_event_type === 'project_start_datetime') || {};
        this.projectFinishDateTime = res.find(event => event.calendar_event_type === 'project_complete_datetime') || {};
        this.workStartDateTime = res.find(event => event.calendar_event_type === 'project_work_start_datetime') || {};
        this.workFinishDateTime = res.find(event => event.calendar_event_type === 'project_work_end_datetime') || {};
        this.expectedAwardDateTime = res.find(event => event.calendar_event_type === 'project_expected_award_datetime') || {};
        this.awardDateTime = res.find(event => event.calendar_event_type === 'project_award_datetime') || {};
        this.expectedContractDateTime = res.find(event => event.calendar_event_type === 'project_expected_contract_datetime') || {};
        this.contractDateTime = res.find(event => event.calendar_event_type === 'project_contract_datetime') || {};

        return this.officeApi.findOffices(this.dataStore.currentUser['customer_id']);
      })
      .then((offices: any[]) => {
        this.offices = offices;
      })
      .catch(err => {
        this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
      });
  }

  onClickTab(_: any, index: number) {
    if (index === 1) {
      this.viewMode = 'basic';
    } else if (index === 2) {
      this.viewMode = 'date';
    } else if (index === 3) {
      this.viewMode = 'detail';
    } else {
      this.viewMode = 'basic';
    }
  }

  onSaveProject() {
    if (!this.currentProject['project_name'] || !this.currentProject['project_name'].trim()) {
      return this.notificationService.error('Error', 'Please input project name', { timeOut: 3000, showProgressBar: false });
    }

    const projectName = this.validationService.validateProjectName(this.currentProject['project_name']);

    if (projectName.length === 0) {
      this.notificationService.error('Error', 'Project name cannot be empty', { timeOut: 3000, showProgressBar: false });
      return;
    }

    const projectOffice = this.offices.find(office => office['company_office_id'] === this.currentProject['project_assigned_office_id']);
    const params = Object.assign(
      {},
      this.currentProject,
      { project_name: projectName },
      { project_bid_datetime: this.currentProject['project_bid_datetime'] ? this.formatDateTime(this.currentProject['project_bid_datetime']) : null },
      { project_assigned_office_name: projectOffice ? projectOffice['company_office_name'] : '' },
      { auto_update_status: this.currentProject['project_auto_update_status'] ? 'active' : 'inactive' }
    );

    this.spinner.show();

    this.apiService.updateProject(this.currentProject['project_id'], params).then(res => this.updateProjectEvents()).then(res => {
      this.spinner.hide();
      this.notificationService.success('Updated', 'Project has been updated', { timeOut: 3000, showProgressBar: false });

      this.reset();
      this.editProjectModal.nativeElement.style.display = 'none';
      this.parent.onRefresh();

      this.logTransaction('Edit Project', 'Completed', `Successfully updated project`, this.currentProject['project_id'], '', 'summary');
    }).catch(err => {
      this.spinner.hide();
      this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });

      this.logTransaction('Edit Project', 'Failed', CircularJSON.stringify(err), '', '', 'detail');
    });
  }

  updateProjectEvents() {
    const tasks = [];
    tasks.push(this.updateProjectEvent(this.preBidDateTime, 'Prebid Meeting Date', 'project_prebid_mtg_datetime'));
    tasks.push(this.updateProjectEvent(this.projectStartDateTime, 'Start Date', 'project_start_datetime'));
    tasks.push(this.updateProjectEvent(this.projectFinishDateTime, 'Finish Date', 'project_complete_datetime'));
    tasks.push(this.updateProjectEvent(this.workStartDateTime, 'Work Start Date', 'project_work_start_datetime'));
    tasks.push(this.updateProjectEvent(this.workFinishDateTime, 'Work Finish Date', 'project_work_end_datetime'));
    tasks.push(this.updateProjectEvent(this.expectedAwardDateTime, 'Expected Award Date', 'project_expected_award_datetime'));
    tasks.push(this.updateProjectEvent(this.awardDateTime, 'Award Date', 'project_award_datetime'));
    tasks.push(this.updateProjectEvent(this.expectedContractDateTime, 'Expected Contract Date', 'project_expected_contract_datetime'));
    tasks.push(this.updateProjectEvent(this.contractDateTime, 'Contract Date', 'project_contract_datetime'));

    return Promise.all(tasks);
  }

  updateProjectEvent(eventData: any, event_name: string, event_type: string) {
    const customerId = this.currentProject['project_customer_id'] || this.dataStore.currentUser['customer_id'];
    const projectName = this.currentProject['project_name'];
    const projectId = this.currentProject['project_id'];
    const userId = this.currentProject['project_admin_user_id'] || this.dataStore.currentUser['user_id'];

    if (eventData['calendar_event_start_datetime']) {
      if (eventData['calendar_event_id']) {
        return this.calendarApi.updateCalendarEvent(
          eventData['calendar_event_id'],
          {calendar_event_start_datetime: this.formatDateTime(eventData['calendar_event_start_datetime'])}
        );
      } else {
        return this.calendarApi.createCalendarEvent({
          project_id: projectId,
          calendar_event_company_id: customerId,
          calendar_event_name: `${projectName} - ${event_name}`,
          calendar_event_organizer_company_id: customerId,
          calendar_event_organizer_user_id: userId,
          calendar_event_start_datetime: this.formatDateTime(eventData['calendar_event_start_datetime']),
          calendar_event_status: 'scheduled',
          calendar_event_type: event_type,
          calendar_event_company_office_id: this.currentProject['project_assigned_office_id'] || '',
        });
      }
    } else {
      return new Promise((resolve) => resolve());
    }
  }

  onCancel(event) {
    event.preventDefault();
    this.reset();
    this.editProjectModal.nativeElement.style.display = 'none';
  }

  logTransaction(operation: string, status: string, description: string, project_id: string = '', submission_id: string = '', transaction_level: string) {
    this.loggerService.logAppTransaction({
      routine_name: 'Customer Portal',
      function_name: 'Edit Project',
      user_id: this.dataStore.currentUser['user_id'],
      customer_id: this.dataStore.currentCustomer['customer_id'],
      operation_name: operation,
      operation_status: status,
      operation_status_desc: description,
      project_id: project_id,
      submission_id: submission_id,
      transaction_level: transaction_level,
    });
  }

  formatDateTime(timestamp: string) {
    return moment(timestamp).utc().format('YYYY-MM-DDTHH:mm:ss.SSSSSS') + 'Z';
  }

  reset() {
    this.currentProject = {};
    this.preBidDateTime = {};
    this.projectStartDateTime = {};
    this.projectFinishDateTime = {};
    this.workStartDateTime = {};
    this.workFinishDateTime = {};
    this.expectedAwardDateTime = {};
    this.awardDateTime = {};
    this.expectedContractDateTime = {};
    this.contractDateTime = {};
    this.viewMode = 'basic';
  }

  onClickDatePicker(event: any) {
    event.stopPropagation();
    event.preventDefault();
  }
}