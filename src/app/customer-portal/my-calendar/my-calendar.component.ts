import { Component, OnInit, ViewChild } from '@angular/core';
import { MyCalendarApi } from './my-calendar.component.api.service';
import { DataStore } from 'app/providers/datastore';
import { NotificationsService } from 'angular2-notifications';
import { DxSchedulerComponent } from 'devextreme-angular';
import { DxContextMenuComponent } from 'devextreme-angular';
import { ViewProjectApi } from '../view-project/view-project.api.service';
import { AuthApi } from 'app/providers/auth.api.service';
import { CompanyOfficeApi } from '../system-settings/company-office-setup/company-office-setup.api.service';
const DomUtils = require('devextreme/core/utils/dom');
const moment = require('moment-timezone');

@Component({
  selector: 'app-my-calendar',
  templateUrl: './my-calendar.component.html',
  styleUrls: ['./my-calendar.component.scss'],
  providers: [MyCalendarApi, ViewProjectApi, CompanyOfficeApi]
})
export class MyCalendarComponent implements OnInit {
  @ViewChild('targetScheduler', {static:false}) scheduler: DxSchedulerComponent;
  @ViewChild('contextMenu', { static: false }) contextMenu: DxContextMenuComponent;
  @ViewChild('addEventModal', {static:false}) addEventModal;
  @ViewChild('editEventModal', {static:false}) editEventModal;
  @ViewChild('removeEventModal', {static:false}) removeEventModal;
  @ViewChild('editProjectModal', {static:false}) editProjectModal;
  
  calendarViewMode = 'my-active';
  currentOffice = null;

  events = [];
  currentDate: Date = new Date();

  isDouble = 0;
  prevCellData = null;

  showOverview = true;
  overviewData = [];

  selectedEvent = null;
  selectedBlankCell = null;

  dataSource = [];
  ctxdisabled: boolean = true;
  ctxtarget: any;
  onContextMenuItemClick: any;
  cellContextMenuItems: any[];
  appointmentContextMenuItems: any[];

  constructor(
    private myCalenderApi: MyCalendarApi,
    public dataStore: DataStore,
    private projectApi: ViewProjectApi,
    private authApi: AuthApi,
    private officeApiService: CompanyOfficeApi,
    private notificationService: NotificationsService
  ) { 
      const that = this;
      this.cellContextMenuItems = [
            { text: 'Add Event', onItemClick: that.onAddEventCtx }
        ];

        this.appointmentContextMenuItems = [
          { text: 'View project', onItemClick: that.onViewProjectCtx },
          { text: 'Add Event', onItemClick: that.onAddEventCtx },
          { text: 'View project documents', onItemClick: that.onViewProjectDocumentsCtx },
          { text: 'Edit Project', onItemClick: that.onEditProjectCtx },
          { text: 'Archive Project', onItemClick: that.onArchiveProjectCtx },
          { text: 'Edit Event', onItemClick: that.onEditEventCtx },
          { text: 'Delete Event', onItemClick: that.onDeleteEventCtx },
          { text: 'Refresh Calendar', onItemClick: that.onRefreshCtx },
          { text: 'Help', onItemClick: that.onHelp }
      ];
  }
  ngOnInit() {
    if (this.dataStore.currentUser) {
      this.loadEvents();
      this.loadCurrentOffice();
    } else {
      this.dataStore.authenticationState.subscribe(value => {
        if (value) {
          this.loadEvents();
          this.loadCurrentOffice();
        }
      });
    }
  }

  loadEvents() {    
    const timezone = this.dataStore.currentCustomer ? (this.dataStore.currentCustomer['customer_timezone'] || 'eastern') : 'eastern';
    this.myCalenderApi.findCalendarEvents(this.dataStore.currentUser['customer_id'], null, timezone)
      .then((res: any[]) => {
        const events = res.map(event => {
          let today = null;
          let endDate = null;

          if(event.calendar_event_end_datetime===event.calendar_event_start_datetime){
            today = new Date(event.calendar_event_end_datetime);
            today.setHours(today.getHours() + 1);

            endDate = new Date(event.calendar_event_start_datetime);
            endDate.setHours(today.getHours() + 1);         
          }
          return {
            text: event.calendar_event_name,
            startDate: new Date(event.calendar_event_start_datetime),
            endDate: event.calendar_event_end_datetime?            
            (event.calendar_event_end_datetime!=event.calendar_event_start_datetime
              ? new Date(event.calendar_event_end_datetime)
              : today):endDate,
            event,
          };
        }); 
      const { currentUser: { user_id, customer_office_id } } = this.dataStore;
        if (this.calendarViewMode === 'my-active') {
          this.events = events.filter(({ event }) => event['calendar_event_organizer_user_id'] === user_id && event['status'] === 'active');
        } else if (this.calendarViewMode === 'my-inactive') {
          this.events = events.filter(({ event }) => event['calendar_event_organizer_user_id'] === user_id && event['status'] !== 'active');
        } else if (this.calendarViewMode === 'office-active') {
          this.events = events.filter(({ event }) =>
            event['calendar_event_company_office_id'] === customer_office_id && event['status'] === 'active');
        } else if (this.calendarViewMode === 'office-inactive') {
          this.events = events.filter(({ event }) =>
            event['calendar_event_company_office_id'] === customer_office_id && event['status'] !== 'active');
        } else if (this.calendarViewMode === 'all-active') {
          this.events = events.filter(({ event }) => event['status'] === 'active');
        } else if (this.calendarViewMode === 'all-inactive') {
          this.events = events.filter(({ event }) => event['status'] !== 'active');
        } else {
          this.events = events;
        }
      
        this.selectedEvent = this.events.find(({ startDate, endDate }) =>   
          startDate >= moment().startOf('day') && endDate < moment().endOf('day'));
        this.selectedBlankCell = null;
      
        if (this.selectedEvent) {
          this.loadEventOverview(this.selectedEvent.event);
        } else {
          this.overviewData = [];
        }
      })
      .catch(err => {
        this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
      });
  }

  getCustomDate(date: any){
     date=new Date(date);    

    const month = (date. getMonth() + 1).length == 1 ? "0" +(date. getMonth() + 1) : (date. getMonth() + 1);
    const day =   date.getDate().toString().length == 1 ? "0" + date.getDate() : date.getDate();
    let customDate=   date. getFullYear() + '-' + month + '-'  + day;    
    return customDate;
  }
  loadEventOverview(event: any) {
 
    const timezone = this.dataStore.currentCustomer ? (this.dataStore.currentCustomer['customer_timezone'] || 'eastern') : 'eastern';
    this.overviewData = [];

    if (event.project_id) {
      Promise.all([
        this.projectApi.getProject(event.project_id, timezone),
        this.authApi.getUserById(event.calendar_event_organizer_user_id),
      ]).then((res: any[]) => {
          const projectInfo = res[0];
          const eventAdminInfo = res[1];
          this.overviewData = [
            {
              name: 'Event Name:',
              value: event.calendar_event_name,
            },
            {
              name: 'Event Description:',
              value: event.calendar_event_desc || '--',
            },
            {
              name: 'Project Name:',
              value: projectInfo.project_name,
            },
            {
              name: 'Project Description:',
              value: projectInfo.project_desc || '--',
            },
            {
              name: 'Project Admin Contact:',
              value: projectInfo.user_email,
            },
            {
              name: 'Event Admin Contact:',
              value: eventAdminInfo.user_email,
            },
            {
              name: 'Project Office',
              value: projectInfo.project_assigned_office_name || '--',
            },
            {
              name: 'Bid Due Date:',
              value: projectInfo.project_bid_datetime,
            },
            {
              name: 'Last Update:',
              value: this.projectApi.convertToTimeZoneObject(projectInfo.edit_datetime_origin, timezone).format('MMM D, YYYY H:mm z'),
            },
            {
              name: 'Value:',
              value: `$${this.formatValue(projectInfo.project_value)}`,
            },
            {
              name: 'Location:',
              value: `${projectInfo.project_address1} ${projectInfo.project_address2} ${projectInfo.project_city} ${projectInfo.project_state} ${projectInfo.project_zip} ${projectInfo.project_country}`.trim(),
            },
            {
              name: 'Project Stage:',
              value: projectInfo.project_stage,
            },
          ];
          return this.myCalenderApi.findCalendarEvents('', event.project_id, timezone);
        })
        .then((res: any) => {
          const prebidDate = res.find(event => event.calendar_event_type === 'project_prebid_mtg_datetime');
          const expectedAwardDate = res.find(event => event.calendar_event_type === 'project_expected_award_datetime');
          const projectStartDate = res.find(event => event.calendar_event_type === 'project_start_datetime');
          const workStartDate = res.find(event => event.calendar_event_type === 'project_work_start_datetime');

          if (prebidDate) {
            this.overviewData.push({
              name: 'Pre-Bid Meeting:',
              value: this.projectApi.convertToTimeZoneObject(prebidDate.calendar_event_start_datetime, timezone).format('MMM D, YYYY H:mm z'),
            });
          }
          if (expectedAwardDate) {
            this.overviewData.push({
              name: 'Expected Award:',
              value: this.projectApi.convertToTimeZoneObject(expectedAwardDate.calendar_event_start_datetime, timezone).format('MMM D, YYYY H:mm z'),
            });
          }
          if (projectStartDate) {
            this.overviewData.push({
              name: 'Project Start:',
              value: this.projectApi.convertToTimeZoneObject(projectStartDate.calendar_event_start_datetime, timezone).format('MMM D, YYYY H:mm z'),
            });
          }
          if (workStartDate) {
            this.overviewData.push({
              name: 'Work Start:',
              value: this.projectApi.convertToTimeZoneObject(workStartDate.calendar_event_start_datetime, timezone).format('MMM D, YYYY H:mm z'),
            });
          }
          return this.myCalenderApi.findEventAttendees(event.calendar_event_id);
        })
        .then((res: any[]) => {
          this.overviewData.push({
            name: 'Attendees:',
            value: res.map(attendee => `${attendee.user_firstname} ${attendee.user_lastname}`.trim()).join(', '),
          });

          if (event['calendar_event_company_office_id']) {
            return this.officeApiService.getOffice(event['calendar_event_company_office_id']);
          } else {
            return new Promise(resolve => resolve({ company_office_name: '--' }));
          }
        })
        .then(eventOffice => {
          this.overviewData.splice(5, 0, {
            name: 'Event Office:',
            value: eventOffice['company_office_name'],
          });
        })
        .catch(err => {
          this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
        });
    } else {
      this.authApi.getUserById(event.calendar_event_organizer_user_id)
        .then((res: any) => {
          this.overviewData = [
            {
              name: 'Event Name:',
              value: event.calendar_event_name,
            },
            {
              name: 'Event Description:',
              value: event.calendar_event_desc,
            },
            {
              name: 'Event Organizer Contact:',
              value: res.user_email,
            },
            {
              name: 'Event Start Date/Time:',
              value: this.projectApi.convertToTimeZoneObject(event.calendar_event_start_datetime, timezone).format('MMM D, YYYY H:mm z'),
            },
            {
              name: 'Event End Date/Time:',
              value: event.calendar_event_end_datetime ?
                this.projectApi.convertToTimeZoneObject(event.calendar_event_end_datetime, timezone).format('MMM D, YYYY H:mm z')
                : '--',
            },
            {
              name: 'Last Update:',
              value: this.projectApi.convertToTimeZoneObject(event.edit_datetime, timezone).format('MMM D, YYYY H:mm z'),
            },
          ];
          return this.myCalenderApi.findEventAttendees(event.calendar_event_id);
        })
        .then((res: any[]) => {
          this.overviewData.push({
            name: 'Attendees:',
            value: res.map(attendee => `${attendee.user_firstname} ${attendee.user_lastname}`.trim()).join(', '),
          });

          if (event['calendar_event_company_office_id']) {
            return this.officeApiService.getOffice(event['calendar_event_company_office_id']);
          } else {
            return new Promise(resolve => resolve({ company_office_name: '--' }));
          }
        })
        .then(eventOffice => {
          this.overviewData.push({
            name: 'Event Office:',
            value: eventOffice['company_office_name'],
          });
        })
        .catch(err => {
          this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
        });
    }
  }

  loadCurrentOffice() {
 
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

  onCellClick(event) {
  
    event.cancel = true;
    this.selectedBlankCell = event;
    this.selectedEvent = this.events.find(({ startDate }) => startDate >= event.cellData.startDate && startDate < event.cellData.endDate);

    if (this.selectedEvent) {
      this.loadEventOverview(this.selectedEvent.event);
    } else {
      this.overviewData = [];
    }

    if (this.isDouble === 1) {
      this.prevCellData = event.cellData;
    }
    this.isDouble++;
    setTimeout(() => {
  
      if (this.isDouble === 2) {
        this.selectedEvent = null;
        this.selectedBlankCell = null;
        this.overviewData = [];
        if ((event.cellData.startDate === this.prevCellData.startDate)
        && (event.cellData.endDate === this.prevCellData.endDate)) {
          this.onAddEvent(event);
        }
      }
      this.isDouble = 0;
      this.prevCellData = null;
    }, 300);
  }

  onOptionChanged(event: any) {
  
    if (event.name === 'currentView' && (event.value === 'day' || event.value === 'week')) {
      setTimeout(() => {
        this.scheduler.instance.scrollToTime(Math.max(this.currentDate.getHours() - 1, 0), 0);
      });
    }
  }

  onAppointmentClick(event) {
    event.cancel = true;

    this.selectedEvent = event.appointmentData;
    this.selectedBlankCell = null;
    this.loadEventOverview(event.appointmentData.event);
  }

onAppointmentDblClick(event) {
    event.cancel = true;
    this.onEditEvent(event);
  }


onCellContextMenu(e) {
  this.ctxtarget = ".dx-scheduler-date-table-cell";
  this.ctxdisabled = false;
  this.dataSource = this.cellContextMenuItems;
  this.onContextMenuItemClick = this.onItemClick(e);
}

onAppointmentContextMenu(e) {
  this.ctxtarget = ".dx-scheduler-appointment";
  this.ctxdisabled = false;
  this.dataSource = this.appointmentContextMenuItems;
  this.onContextMenuItemClick = this.onItemClick(e);
}

onItemClick(ctxEvent: any): any {
  return function(e)
  {
    e.itemData.onItemClick(ctxEvent, e);
  }
}

  onContextMenuHiding(event: any) {
    this.ctxdisabled = true;
    this.dataSource = [];
  }
  onAddEvent(event: any) {
    if (event) {
      this.addEventModal.initialize(this, event.cellData);
    } else if (this.selectedBlankCell) {
      this.addEventModal.initialize(this, this.selectedBlankCell.cellData);
      this.selectedBlankCell = null;
    } else {
      this.notificationService.error('Error', 'Please select a cell', { timeOut: 3000, showProgressBar: false });
    }
  }
    //this Component Context Handling !Required!
    onAddEventCtx = (event: any) => {
      this.onAddEvent(event);
    }
   
  onEditEvent(event: any) {
    if (event) {
      this.editEventModal.initialize(this, event.appointmentData);
    } else if (this.selectedEvent) {
      this.editEventModal.initialize(this, this.selectedEvent);
    } else {
      this.notificationService.error('Error', 'Please select an event', { timeOut: 3000, showProgressBar: false });
    }
  }
  //this Component Context Handling !Required!
  onEditEventCtx = (event: any) => {
    this.onEditEvent(event);
  }
  

  onViewProject() {
    if (this.selectedEvent) {
      if (this.selectedEvent.event.project_id) {
        window.open(`/customer-portal/view-project/${this.selectedEvent.event.project_id}`, '_blank');
      } else {
        this.notificationService.error('Error', 'This is not a project event', { timeOut: 3000, showProgressBar: false });
      }
    } else {
      this.notificationService.error('Error', 'Please select an event', { timeOut: 3000, showProgressBar: false });
    }
  }
    //this Component Context Handling !Required!
    onViewProjectCtx = (event: any) => {
      this.onViewProject();
    }

  onEditProject() {
    if (this.selectedEvent) {
      if (this.selectedEvent.event.project_id) {
        this.myCalenderApi.findProject(this.selectedEvent.event.project_id)
          .then(project => {
            this.editProjectModal.initialize(this, project);
          })
          .catch(err => {
            this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
          });
      } else {
        this.notificationService.error('Error', 'This is not a project event', { timeOut: 3000, showProgressBar: false });
      }
    } else {
      this.notificationService.error('Error', 'Please select an event', { timeOut: 3000, showProgressBar: false });
    }
  }
 //this Component Context Handling !Required!
 onEditProjectCtx = (event: any) => {
  this.onEditProject();
}
  onDeleteEvent() {
    if (this.selectedEvent) {
      this.removeEventModal.initialize(this, this.selectedEvent.event);
    } else {
      this.notificationService.error('Error', 'Please select an event', { timeOut: 3000, showProgressBar: false });
    }
  }
  
   //this Component Context Handling !Required!
   onDeleteEventCtx = (event: any) => {
    this.onDeleteEvent();
  }

  onViewProjectDocuments() {
    if (this.selectedEvent) {
      if (this.selectedEvent.event.project_id) {
        const { currentUser: { user_id: userId } } = this.dataStore;
        window.open(`${window['env'].docViewerBaseUrl}?project_id=${this.selectedEvent.event.project_id}&user_id=${userId}&doc_type=normal&doc_id=unknown&folder_id=unknown`, '_blank');
      } else {
        this.notificationService.error('Error', 'This is not a project event', { timeOut: 3000, showProgressBar: false });
      }
    } else {
      this.notificationService.error('Error', 'Please select an event', { timeOut: 3000, showProgressBar: false });
    }
  }
  
    //this Component Context Handling !Required!
    onViewProjectDocumentsCtx = (event: any) => {
      this.onViewProjectDocuments();
    }
   

  onArchiveProject() {
    // TODO
  }
  
   //this Component Context Handling !Required!
   onArchiveProjectCtx = (event: any) => {
    this.onArchiveProject();
  }
 

  onRefresh() {
    this.loadEvents();
  }
  
  //this Component Context Handling !Required!
  onRefreshCtx = (event: any) => {
      this.onRefresh();
  }
   

  onChangeCalendarViewMode() {
    this.loadEvents();
  }

  onHelp() {

  } 

  onChangeSplit() {
    this.schedulerRefresh();
  }

  schedulerRefresh() {
    setTimeout(() => DomUtils.triggerResizeEvent(this.scheduler.instance.element()), 0);
  }

  formatValue(value: string) {
    if (value) {
      return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    } else {
      return '0';
    }
  }
} 
