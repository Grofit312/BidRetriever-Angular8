import { Component, OnInit } from "@angular/core";

import { NgxSpinnerService } from "ngx-spinner";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";

import { DashboardComponent } from "app/analytics/components/dashboard/dashboard.component";
import { DataStore } from "app/providers/datastore";
import { DashboardService } from "app/analytics/services/dashboard.service";

@Component({
  selector: "app-system-analytics",
  templateUrl:
    "./../../analytics/components/dashboard/dashboard.component.html",
  styleUrls: [
    "./../../analytics/components/dashboard/dashboard.component.scss",
    "./system-analytics.component.scss",
  ],
})
export class SystemAnalyticsComponent extends DashboardComponent {
  public analyticType = "system";
  constructor(
    public dashboardService: DashboardService,
    public dataStore: DataStore,

    public modal: NgbModal,
    public spinner: NgxSpinnerService
  ) {
    super(dashboardService, dataStore, modal, spinner);
  }
}
