import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { NotificationsService } from 'angular2-notifications';
import { NgxSpinnerService } from 'ngx-spinner';
import { MyCalendarApi } from 'app/customer-portal/my-calendar/my-calendar.component.api.service';

@Component({
  selector: 'remove-event-modal',
  templateUrl: './remove-event-modal.component.html',
  styleUrls: ['./remove-event-modal.component.scss'],
  providers: [MyCalendarApi]
})
export class RemoveEventModalComponent implements OnInit {

  @ViewChild('removeEventModal', { static: true }) removeEventModal: ElementRef;

  parent = null;
  selectedEvent = null;
  modalTitle = '';

  constructor(
    public calendarApi: MyCalendarApi,
    private notificationService: NotificationsService,
    private spinner: NgxSpinnerService
  ) { }

  ngOnInit() {
  }

  initialize(parent: any, event: any) {
    this.selectedEvent = event;
    this.parent = parent;
    this.modalTitle = `Are you sure you want to delete event <${event.calendar_event_name}>?`;
    this.removeEventModal.nativeElement.style.display = 'block';
  }

  onCancel() {
    this.removeEventModal.nativeElement.style.display = 'none';
  }

  onYes() {
    this.spinner.show();
    this.calendarApi.updateCalendarEvent(this.selectedEvent.calendar_event_id, { status: 'deleted' })
      .then(res => {
        this.parent.onRefresh();
        this.removeEventModal.nativeElement.style.display = 'none';
        this.spinner.hide();
        this.notificationService.success('Success', 'Event has been deleted', { timeOut: 3000, showProgressBar: false });
      })
      .catch(err => {
        this.removeEventModal.nativeElement.style.display = 'none';
        this.spinner.hide();
        this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
      });
  }
}
