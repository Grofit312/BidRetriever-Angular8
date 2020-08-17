import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';


@Component({
  selector: 'app-notification-viewer',
  templateUrl: './notification-viewer.component.html',
  styleUrls: ['./notification-viewer.component.scss']
})
export class NotificationViewerComponent implements OnInit {

  @ViewChild('notificationViewer', { static:false}) notificationViewer: ElementRef;

  constructor() { }

  ngOnInit() {
    this.loadNotification();
  }

  loadNotification() {
    let notificationContent = localStorage.getItem('notification_content');
    this.notificationViewer.nativeElement.innerHTML = notificationContent;
  }
}
