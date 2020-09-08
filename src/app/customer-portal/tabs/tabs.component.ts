import { Component, OnInit } from "@angular/core";
import { DataStore } from "app/providers/datastore";

import { NotificationsService } from "angular2-notifications";
import { AuthApi } from "app/providers/auth.api.service";
import { Router } from "@angular/router";

@Component({
  selector: "customer-portal-tabs",
  templateUrl: "./tabs.component.html",
  styleUrls: ["./tabs.component.scss"],
})
export class TabsComponent implements OnInit {
  currentTab = 1;
  newLoad = false;

  isDesktopSynced = true;

  constructor(
    private _authApi: AuthApi,
    private _router: Router,
    public dataStore: DataStore,
    private _notificationService: NotificationsService
  ) {}

  ngOnInit() {
    const url = window.location.href;

    this.newLoad = true;

    this.dataStore.authenticationState.subscribe((state) => {
      if (state) {
        const { user_id: userId } = this.dataStore.currentUser;
        this._authApi
          .findUserDevices(userId)
          .then((devices: any[]) => {
            if (!devices || devices.length <= 0) {
              this.isDesktopSynced = false;
              return;
            }
            this.isDesktopSynced = true;
          })
          .catch((error) => {});
      }
    });

    if (url.includes("my-projects")) {
      document.getElementById("tab-my-projects").click();
      return;
    }

    if (url.includes("my-calendar")) {
      document.getElementById("tab-my-calendar").click();
      return;
    }

    if (url.includes("my-settings")) {
      document.getElementById("tab-my-settings").click();
      return;
    }

    if (url.includes("system-settings")) {
      document.getElementById("tab-system-settings").click();
      return;
    }

    if (url.includes("all-submissions")) {
      document.getElementById("tab-all-submissions").click();
      return;
    }

    if (url.includes("shared-projects")) {
      document.getElementById("tab-shared-projects").click();
      return;
    }

    if (url.includes("system-analytics")) {
      document.getElementById("tab-system-analytics").click();
      return;
    }

    document.getElementById("tab-my-projects").click();
  }

  onClickTab(event: any, index: number) {
    this.currentTab = index;

    const newLoad = this.newLoad;
    this.newLoad = false;

    switch (index) {
      case 1:
        this._router.navigate([
          newLoad ? this._router.url : "/customer-portal/my-projects",
        ]);
        break;

      case 2:
        this._router.navigate([
          newLoad ? this._router.url : "/customer-portal/shared-projects",
        ]);
        break;

      case 3:
        this._router.navigate([
          newLoad ? this._router.url : "/customer-portal/my-calendar",
        ]);
        break;

      case 4:
        if (this.dataStore.currentCustomer) {
          this._router.navigate([
            newLoad ? this._router.url : "/customer-portal/my-settings",
          ]);
        } else {
          event.preventDefault();
          event.stopPropagation();

          document.getElementById("tab-my-projects").click();
          document.getElementById("tab-my-settings").classList.remove("active");
          document.getElementById("tab-my-settings").blur();

          this._notificationService.error(
            "Access Denied",
            "The user selected is a trial user, and therefore does not have any system settings defined.",
            { timeOut: 5000, showProgressBar: false }
          );
        }
        break;

      case 5:
        if (!this.dataStore.currentUser || this.dataStore.currentCustomer) {
          this._router.navigate([
            newLoad ? this._router.url : "/customer-portal/system-settings",
          ]);
        } else {
          event.preventDefault();
          event.stopPropagation();

          document.getElementById("tab-my-projects").click();
          document
            .getElementById("tab-system-settings")
            .classList.remove("active");
          document.getElementById("tab-system-settings").blur();

          this._notificationService.error(
            "Access Denied",
            "The user selected is a trial user, and therefore does not have any system settings defined.",
            { timeOut: 5000, showProgressBar: false }
          );
        }
        break;

      case 6:
        this._router.navigate([
          newLoad ? this._router.url : "/customer-portal/all-submissions",
        ]);
        break;

      case 7:
        if (!this.dataStore.currentUser || this.dataStore.currentCustomer) {
          this._router.navigate([
            newLoad ? this._router.url : "/customer-portal/system-analytics",
          ]);
        } else {
          event.preventDefault();
          event.stopPropagation();

          document.getElementById("tab-my-projects").click();
          document
            .getElementById("tab-system-analytics")
            .classList.remove("active");
          document.getElementById("tab-system-analytics").blur();

          this._notificationService.error(
            "Access Denied",
            "The user selected is a trial user, and therefore does not have any system analytics defined.",
            { timeOut: 5000, showProgressBar: false }
          );
        }
        break;

      default:
        this._router.navigate([
          newLoad ? this._router.url : "/customer-portal/my-projects",
        ]);
        break;
    }
  }
}
