import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';


@Component({
  selector: 'app-notification-viewer',
  templateUrl: './notification-viewer.component.html',
  styleUrls: ['./notification-viewer.component.scss']
})
export class NotificationViewerComponent implements OnInit , AfterViewInit{

  @ViewChild('notificationViewer', { static:false}) notificationViewer: ElementRef;
  @ViewChild('notificationHtml', { read: ElementRef, static: false }) notificationHtml: ElementRef;

  constructor() { }

  ngOnInit() {
   // this.loadNotification();
  }

  loadNotification() {
    let notificationContent = localStorage.getItem('notification_content');
    this.notificationHtml.nativeElement.innerHTML = notificationContent;
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.loadNotification();
    }, 600);
  }
}
