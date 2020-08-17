import { Component, OnInit } from '@angular/core';
import { DataStore } from 'app/providers/datastore';

import { NotificationsService } from 'angular2-notifications';
import { Router, ActivatedRoute } from '@angular/router';
@Component({
  selector: 'app-system-settings-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnInit {

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

    if (url.includes('user-setup')) {
      document.getElementById('list-user-setup').click();
    } else if (url.includes('customer-information')) {
      document.getElementById('list-customer-information').click();
    } else if (url.includes('company-office-setup')) {
      document.getElementById('list-company-office-setup').click();
    } else if (url.includes('document-settings')) {
      document.getElementById('list-document-settings').click();
    } else if (url.includes('destination-system-settings')) {
      document.getElementById('list-destination-system-settings').click();
    } else if (url.includes('source-system-accounts')) {
      document.getElementById('list-source-system-accounts').click();
    } else if (url.includes('notification-settings')) {
      document.getElementById('list-notification-settings').click();
    } else if (url.includes('subscription-settings')) {
      document.getElementById('list-subscription-settings').click();
    } else {
      document.getElementById('list-user-setup').click();
    }
  }

  onClickMenu (index: number) {
    this.currentMenu = index;

    const newLoad = this.newLoad;
    this.newLoad = false;

    switch (index) {
      case 1:
      this._router.navigate([newLoad ? this._router.url : '/customer-portal/system-settings/user-setup']);
      break;

      case 2:
      this._router.navigate([newLoad ? this._router.url : '/customer-portal/system-settings/customer-information']);
      break;

      case 3:
      this._router.navigate([newLoad ? this._router.url : '/customer-portal/system-settings/company-office-setup']);
      break;

      case 4:
      this._router.navigate([newLoad ? this._router.url : '/customer-portal/system-settings/document-settings']);
      break;

      case 5:
      if (newLoad) {
        this.activatedRoute.queryParams.subscribe(params => {
          this._router.navigate(['/customer-portal/system-settings/destination-system-settings'], { queryParams: { code: params['code'] } });
        });
      } else {
        this._router.navigate(['/customer-portal/system-settings/destination-system-settings']);
      }
      break;

      case 6:
      this._router.navigate([newLoad ? this._router.url : '/customer-portal/system-settings/source-system-accounts']);
      break;

      case 7:
      this._router.navigate([newLoad ? this._router.url : '/customer-portal/system-settings/notification-settings']);
      break;

      case 8:
      if (!this.dataStore.currentUser || this.dataStore.originUserEmail === this.dataStore.currentUser['user_email']) {
        this._router.navigate([newLoad ? this._router.url : '/customer-portal/system-settings/subscription-settings']);
      } else {
        this.notificationService.error('Access Denied', `Subscription settings can only be accessed by the customer's system administrator.`, { timeOut: 5000, showProgressBar: false });
      }
      break;

      default:
      this._router.navigate([newLoad ? this._router.url : '/customer-portal/system-settings/user-setup']);
      break;
    }
  }
}
