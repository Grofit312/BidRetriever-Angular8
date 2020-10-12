import { Component, OnInit } from '@angular/core';
import { DataStore } from 'app/providers/datastore';
import { NotificationsService } from 'angular2-notifications';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-my-settings-menu',
  templateUrl: './my-settings-menu.component.html',
  styleUrls: ['./my-settings-menu.component.scss']
})
export class MySettingsMenuComponent implements OnInit {

  
  currentMenu = 1;
  newLoad = false;

  constructor(
    private _router: Router,
    private activatedRoute: ActivatedRoute,
    public dataStore: DataStore,
    private notificationService: NotificationsService
  ) { }

  ngOnInit() {
    const url = window.location.href;

    this.newLoad = true;

    if (url.includes('notification-settings')) {
      document.getElementById('list-notification-settings').click();
    } else {
      document.getElementById('list-notification-settings').click();
    }
  }

  onClickMenu(index: number) {
    debugger
    this.currentMenu = index;

    const newLoad = this.newLoad;
    this.newLoad = false;

    switch (index) {
      case 1:
      this._router.navigate([newLoad ? this._router.url : '/customer-portal/my-settings/notifcation-settings']);
      break;

      default:
      this._router.navigate([newLoad ? this._router.url : '/customer-portal/my-settings/notifcation-settings']);
      break;
    }
  }
}
