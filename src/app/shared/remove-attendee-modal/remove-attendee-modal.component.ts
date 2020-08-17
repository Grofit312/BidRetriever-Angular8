import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'remove-attendee-modal',
  templateUrl: './remove-attendee-modal.component.html',
  styleUrls: ['./remove-attendee-modal.component.scss']
})
export class RemoveAttendeeModalComponent implements OnInit {
  @ViewChild('removeAttendeeModal', { static: true }) removeAttendeeModal: ElementRef;

  parent = null;
  emails = '';
  selectedAttendees = [];

  constructor() { }

  ngOnInit() {
  }

  initialize(parent: any, selectedAttendees: any[]) {
    this.parent = parent;
    this.emails = selectedAttendees.map(attendee => attendee.user_email).join(', ');
    this.selectedAttendees = selectedAttendees;

    this.removeAttendeeModal.nativeElement.style.display = 'block';
  }

  onYes() {
    this.parent.removeEventAttendees(this.selectedAttendees);
    this.removeAttendeeModal.nativeElement.style.display = 'none';
  }

  onCancel() {
    this.removeAttendeeModal.nativeElement.style.display = 'none';
  }
}
