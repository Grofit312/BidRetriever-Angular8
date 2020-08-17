import { Component, OnInit, ViewChild, ElementRef, ViewEncapsulation } from '@angular/core';
import { DataStore } from 'app/providers/datastore';
import { NotificationsService } from 'angular2-notifications';
import { NgxSpinnerService } from 'ngx-spinner';
import { MyCalendarApi } from 'app/customer-portal/my-calendar/my-calendar.component.api.service';
import { DatePicker } from 'angular2-datetimepicker';
import * as moment from 'moment';
import { Logger } from 'app/providers/logger.service';
import { CompanyOfficeApi } from 'app/customer-portal/system-settings/company-office-setup/company-office-setup.api.service';

@Component({
  selector: 'edit-event-modal',
  templateUrl: './edit-event-modal.component.html',
  styleUrls: ['./edit-event-modal.component.scss'],
  providers: [CompanyOfficeApi],
  encapsulation: ViewEncapsulation.None
})
export class EditEventModalComponent implements OnInit {
  @ViewChild('editEventModal', { static: true }) editEventModal: ElementRef;
  @ViewChild('attendeeGrid', { static: true }) attendeeGrid;
  @ViewChild('addAttendeeModal', { static: true }) addAttendeeModal;
  @ViewChild('removeAttendeeModal', { static: true }) removeAttendeeModal;

  parent = null;
  currentEvent:any = {};
  eventOrganizer:any = {};
  relatedProject:any = {};
  status:any = {};
  eventType:any = {};
  office = '';

  eventOrganizers = [];
  relatedProjects = [];
  offices = [];

  attendeesToRemove = [];

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

  initialize(parent: any, { event, startDate, endDate }) {
    this.parent = parent;
    this.currentEvent = event;
    this.currentEvent['calendar_event_start_datetime'] = startDate;
    this.currentEvent['calendar_event_end_datetime'] = endDate;
    this.status = this.calendarApi.eventStatus.find(status => status.value === event.status) || {};
    this.eventType = this.calendarApi.eventType.find(type => type.value === event.calendar_event_type) || {};

    this.editEventModal.nativeElement.style.display = 'block';

    this.loadEventAttendees();
    this.loadEventOrganizers();
    this.loadRelatedProjects();
    this.loadOffices();
  }

  loadEventOrganizers() {
    this.calendarApi.findOrganizers(this.dataStore.currentUser['customer_id'])
      .then((res: any[]) => {
        this.eventOrganizers = res;
        this.eventOrganizer = this.eventOrganizers.find(organizer =>
          organizer.user_id === this.currentEvent['calendar_event_organizer_user_id']);
      })
      .catch(err => {
        return this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
      });
  }

  loadRelatedProjects() {
    this.calendarApi.findProjects(this.dataStore.currentUser['customer_id'])
      .then((res: any[]) => {
        this.relatedProjects = res;
        this.relatedProject = this.relatedProjects.find(project => project.project_id === this.currentEvent['project_id']) || {};
      })
      .catch(err => {
        return this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
      });
  }

  loadEventAttendees() {
    this.calendarApi.findEventAttendees(this.currentEvent['calendar_event_id'])
      .then((res: any[]) => {
        this.attendees = res;
      })
      .catch(err => {
        return this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
      });
  }

  loadOffices() {
    this.companyOfficeApi.findOffices(this.dataStore.currentUser['customer_id'])
      .then((offices: any[]) => {
        this.offices = offices;
        this.office = offices.find(office => office['company_office_id'] === this.currentEvent['calendar_event_company_office_id']) || '';
      })
      .catch(err => {
        this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
      });
  }

  onSaveEvent() {
    this.currentEvent['calendar_event_start_datetime'] = this.formatDateTime(this.currentEvent['calendar_event_start_datetime']);

    if (this.currentEvent['calendar_event_end_datetime']) {
      this.currentEvent['calendar_event_end_datetime'] = this.formatDateTime(this.currentEvent['calendar_event_end_datetime']);
    }

    this.currentEvent['calendar_event_organizer_user_id'] = this.eventOrganizer['user_id'];
    this.currentEvent['calendar_event_organizer_company_id'] = this.eventOrganizer['customer_id'];

    if (this.relatedProject['project_id']) {
      this.currentEvent['project_id'] = this.relatedProject['project_id'];
    }

    this.currentEvent['status'] = this.status['value'] || '';
    this.currentEvent['calendar_event_type'] = this.eventType['value'] || '';

    this.currentEvent['calendar_event_company_office_id'] = this.office ? this.office['company_office_id'] : '';
    this.currentEvent['calendar_event_organizer_company_office_id'] = this.eventOrganizer['customer_office_id'] || '';

    this.spinner.show();
    this.calendarApi.updateCalendarEvent(this.currentEvent['calendar_event_id'], this.currentEvent)
      .then(_ => {
        return Promise.all(this.attendees.filter(attendee => !attendee.event_attendee_id).map(attendee =>
          this.calendarApi.createEventAttendee({
            calendar_event_id: this.currentEvent['calendar_event_id'],
            event_attendee_user_id: attendee.user_id,
          })
        ));
      })
      .then(_ => {
        return Promise.all(this.attendeesToRemove.map(attendee =>
          this.calendarApi.updateEventAttendee(attendee.event_attendee_id, { status: 'deleted' })
        ));
      })
      .then(_ => {
        this.spinner.hide();
        this.notificationService.success('Success', 'Event has been updated', { timeOut: 3000, showProgressBar: false });

        this.reset();
        this.editEventModal.nativeElement.style.display = 'none';
        this.parent.onRefresh();
      }).catch(err => {
        this.spinner.hide();
        this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
      });
  }

  onCancel(event) {
    event.preventDefault();

    this.reset();
    this.editEventModal.nativeElement.style.display = 'none';
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

    this.attendeesToRemove = this.attendeesToRemove.concat(selectedAttendees.filter(attendee => attendee.event_attendee_id));
  }

  formatDateTime(timestamp: any) {
    return moment(timestamp).utc().format('YYYY-MM-DDTHH:mm:ss.SSSSSS') + 'Z';
  }

  reset() {
    this.currentEvent = {};
    this.attendees = null;
    this.eventOrganizer = {};
    this.relatedProject = {};
    this.status = {};
    this.eventType = {};
    this.attendeesToRemove = [];
  }

  onClickDatePicker(event: any) {
    event.stopPropagation();
    event.preventDefault();
  }

  onRelatedProjectChange() {
    if (this.relatedProject['project_assigned_office_id']) {
      const projectOffice = this.offices.find(office => office['company_office_id'] === this.relatedProject['project_assigned_office_id']);
      this.office = projectOffice || '';
    } else {
      this.office = '';
    }
  }
}
