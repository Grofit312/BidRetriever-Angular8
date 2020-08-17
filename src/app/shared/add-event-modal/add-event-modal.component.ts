import { Component, OnInit, ViewChild, ElementRef, ViewEncapsulation } from '@angular/core';
import { DataStore } from 'app/providers/datastore';
import { NotificationsService } from 'angular2-notifications';
import { NgxSpinnerService } from 'ngx-spinner';
import { MyCalendarApi } from 'app/customer-portal/my-calendar/my-calendar.component.api.service';
import { Logger } from 'app/providers/logger.service';
import * as moment from 'moment';
import { DatePicker } from 'angular2-datetimepicker';
import * as uuid from 'uuid/v1';
import { CompanyOfficeApi } from 'app/customer-portal/system-settings/company-office-setup/company-office-setup.api.service';
const CircularJSON = require('circular-json');

@Component({
  selector: 'add-event-modal',
  templateUrl: './add-event-modal.component.html',
  styleUrls: ['./add-event-modal.component.scss'],
  providers: [CompanyOfficeApi],
  encapsulation: ViewEncapsulation.None
})
export class AddEventModalComponent implements OnInit {
  @ViewChild('addEventModal', { static: true }) addEventModal: ElementRef;
  @ViewChild('attendeeGrid', { static: true }) attendeeGrid;
  @ViewChild('addAttendeeModal', { static: true }) addAttendeeModal;
  @ViewChild('removeAttendeeModal', { static: true }) removeAttendeeModal;

  parent = null;

  targetProjectId = '';
  eventName = '';
  eventDescription = '';
  eventStartDateTime = new Date();
  eventEndDateTime = new Date();
  eventOrganizer = '';
  relatedProject = '';
  status = 'active';
  eventType = 'user_defined_datetime';
  eventColor = '';
  office = '';

  eventOrganizers = [];
  relatedProjects = [];
  offices = [];

  attendees = null;
  columnDefs = [
    {
      headerName: 'Email',
      field: 'user_email',
      sortable: true,
      filter: true,
      resizable: true,
      editable: false,
      checkboxSelection: true,
    },
  ];

  constructor(
    public dataStore: DataStore,
    private notificationService: NotificationsService,
    private spinner: NgxSpinnerService,
    public calendarApi: MyCalendarApi,
    private companyOfficeApi: CompanyOfficeApi,
    private loggerService: Logger
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
    this.attendeeGrid.gridSizeChanged.subscribe(() => {
      this.attendeeGrid.api.sizeColumnsToFit();
    });
    this.attendeeGrid.columnResized.subscribe((event) => {
      if (event.source !== 'sizeColumnsToFit') {
        if (document.getElementsByClassName('ag-center-cols-container')[0]['offsetWidth']
            < document.getElementsByClassName('ag-center-cols-viewport')[0]['offsetWidth']) {
          this.attendeeGrid.api.sizeColumnsToFit();
        }
      }
    });
  }

  initialize(parent: any, cellData: any) {
    this.parent = parent;
    this.eventStartDateTime = cellData.startDate;
    this.eventEndDateTime = cellData.endDate;
    this.targetProjectId = cellData.project_id;

    this.addEventModal.nativeElement.style.display = 'block';

    this.loadEventOrganizers();
    this.loadRelatedProjects();
    this.loadOffices();
  }

  loadEventOrganizers() {
    this.calendarApi.findOrganizers(this.dataStore.currentUser['customer_id'])
      .then((res: any[]) => {
        this.eventOrganizers = res.sort((firstOrganizer, secondOrganizer) => {
          const firstOrganizerEmail = firstOrganizer.user_email ? firstOrganizer.user_email.toLowerCase() : '';
          const secondOrganizerEmail = secondOrganizer.user_email ? secondOrganizer.user_email.toLowerCase() : '';
          return firstOrganizerEmail.localeCompare(secondOrganizerEmail);
        });
        this.eventOrganizer = res.find(organizer => organizer.user_email === this.dataStore.currentUser['user_email']);
        if (this.eventOrganizer) {
          this.addEventAttendee(this.eventOrganizer['user_id'], this.eventOrganizer['user_email']);
        }
      })
      .catch(err => {
        return this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
      });
  }

  loadRelatedProjects() {
    this.calendarApi.findProjects(this.dataStore.currentUser['customer_id'])
      .then((res: any[]) => {
        this.relatedProjects = res.filter(({ status }) => status === 'active');
        this.relatedProjects = this.relatedProjects.sort((firstProject, secondProject) => {
          const firstProjectName = firstProject.project_name ? firstProject.project_name.toLowerCase() : '';
          const secondProjectName = secondProject.project_name ? secondProject.project_name.toLowerCase() : '';
          return firstProjectName.localeCompare(secondProjectName);
        });
        if (this.targetProjectId) {
          this.relatedProject = this.relatedProjects.find(project => project.project_id === this.targetProjectId);
        }
      })
      .catch(err => {
        return this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
      });
  }

  loadOffices() {
    this.companyOfficeApi.findOffices(this.dataStore.currentUser['customer_id'])
      .then((offices: any[]) => {
        this.offices = offices;
        this.offices = this.offices.sort((firstOffice, secondOffice) => {
          const firstOfficeName = firstOffice.company_office_name ? firstOffice.company_office_name.toLowerCase() : '';
          const secondOfficeName = secondOffice.company_office_name ? secondOffice.company_office_name.toLowerCase() : '';
          return firstOfficeName.localeCompare(secondOfficeName);
        });
      })
      .catch(err => {
        this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
      });
  }

  onSaveEvent() {
    this.spinner.show();

    this.calendarApi.createCalendarEvent({
      calendar_event_name: this.eventName,
      calendar_event_start_datetime: this.formatDateTime(this.eventStartDateTime),
      calendar_event_end_datetime: this.formatDateTime(this.eventEndDateTime),
      calendar_event_organizer_user_id: this.eventOrganizer['user_id'],
      calendar_event_desc: this.eventDescription,
      project_id: this.relatedProject ? this.relatedProject['project_id'] : '',
      status: this.status,
      calendar_event_status: 'scheduled',
      calendar_event_type: this.eventType,
      calendar_event_company_id: this.dataStore.currentUser['customer_id'],
      calendar_event_organizer_company_id: this.eventOrganizer['customer_id'],
      calendar_event_company_office_id: this.office ? this.office['company_office_id'] : '',
      calendar_event_organizer_company_office_id: this.eventOrganizer['customer_office_id'] || '',
    }).then((calendar_event_id: any) => {
      const tasks = [];
      this.attendees.forEach(attendee => {
        tasks.push(this.calendarApi.createEventAttendee({
          calendar_event_id,
          event_attendee_user_id: attendee.user_id,
        }));
      });
      return Promise.all(tasks);
    }).then(res => {
      this.spinner.hide();
      this.notificationService.success('Success', 'Event has been created', { timeOut: 3000, showProgressBar: false });

      this.reset();
      this.addEventModal.nativeElement.style.display = 'none';
      this.parent.onRefresh();
    }).catch(err => {
      this.spinner.hide();
      this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
    });
  }

  onCancel(event) {
    event.preventDefault();

    this.reset();
    this.addEventModal.nativeElement.style.display = 'none';
  }

  onAddAttendee(event) {
    event.stopPropagation();
    event.preventDefault();

    this.addAttendeeModal.initialize(this);
  }

  onRemoveAttendee(event) {
    event.stopPropagation();
    event.preventDefault();

    const selectedAttendees = this.attendeeGrid.api.getSelectedRows();

    if (selectedAttendees.length === 0) {
      this.notificationService.error('Error', 'Please select attendees to remove!', { timeOut: 3000, showProgressBar: false });
    } else {
      this.removeAttendeeModal.initialize(this, selectedAttendees);
    }
  }

  onRelatedProjectChange() {
    if (this.relatedProject['project_assigned_office_id']) {
      const projectOffice = this.offices.find(office => office['company_office_id'] === this.relatedProject['project_assigned_office_id']);
      this.office = projectOffice || '';
    } else {
      this.office = '';
    }
  }

  addEventAttendee(user_id: string, user_email: string) {
    this.attendees = Array.prototype.concat(this.attendees || [], [{
      user_email,
      user_id,
    }]);
  }

  removeEventAttendees(selectedAttendees: any[]) {
    selectedAttendees.forEach(selectedAttendee => {
      const index = this.attendees.findIndex(attendee => attendee.user_email === selectedAttendee.user_email);
      this.attendees.splice(index, 1);
    });
    this.attendees = Array.prototype.concat([], this.attendees);
  }

  formatDateTime(timestamp: Date) {
    return moment(timestamp).utc().format('YYYY-MM-DDTHH:mm:ss.SSSSSS') + 'Z';
  }

  reset() {
    this.eventName = '';
    this.eventDescription = '';
    this.eventStartDateTime = new Date();
    this.eventEndDateTime = new Date();
    this.eventOrganizer = '';
    this.relatedProject = '';
    this.status = 'active';
    this.eventType = 'user_defined_datetime';
    this.eventColor = '';
    this.attendees = null;
  }

  onClickDatePicker(event: any) {
    event.stopPropagation();
    event.preventDefault();
  }

  logTransaction(operation: string, status: string, description: string, project_id: string = '', submission_id: string = '', transaction_level: string) {
    this.loggerService.logAppTransaction({
      routine_name: 'Customer Portal',
      function_name: 'Add Project',
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
}
