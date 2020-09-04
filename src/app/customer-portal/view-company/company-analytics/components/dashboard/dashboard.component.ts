import {
  Component,
  OnInit,
  TemplateRef,
  ViewChild,
  OnDestroy,
} from "@angular/core";

import { Dashboard, DashboardPanel } from "../../models/dashboard.model";
import { DashboardService } from "../../services/dashboard.service";
import { DataStore } from "app/providers/datastore";
import { NgbModal, NgbModalRef } from "@ng-bootstrap/ng-bootstrap";
import { takeUntil } from "rxjs/operators";
import { Subject } from "rxjs";
import { NgxSpinnerService } from "ngx-spinner";

@Component({
  selector: "app-dashboard",
  templateUrl: "./dashboard.component.html",
  styleUrls: ["./dashboard.component.scss"],
})
export class DashboardComponent implements OnInit, OnDestroy {
  @ViewChild("manageDashboardTemplate", { static: false })
  manageDashboardTemplate: TemplateRef<any>;
  @ViewChild("manageDashboardPanelTemplate", { static: false })
  manageDashboardPanelTemplate: TemplateRef<any>;

  dashboards: Dashboard[];
  selectedDashboard: string = null;
  selectedDashboardId: string = null;
  selectedDashboardPanelId: string = null;
  dashboardPanels: DashboardPanel[];

  destroy$: Subject<any> = new Subject();

  constructor(
    private dashboardService: DashboardService,
    private dataStore: DataStore,

    private modal: NgbModal,
    private spinner: NgxSpinnerService
  ) {}

  ngOnInit(): void {
    if (this.dataStore.currentUser) {
      this.findDashboards();
    } else {
      this.dataStore.authenticationState.subscribe((value) => {
        if (value) {
          this.findDashboards();
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  findDashboards() {
    this.spinner.show();
    this.dashboardService
      .findDashboards(
        this.dataStore.currentUser.user_id,
        this.dataStore.currentUser.customer_id,
        this.dataStore.currentUser.customer_office_id
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe((dashboards) => {
        this.spinner.hide();
        this.dashboards = dashboards;
        if (dashboards.length > 0 && this.selectedDashboard === null) {
          this.selectedDashboard = dashboards[0].dashboard_id;
          this.onChangeDashboard();
        } else if (dashboards.length === 0) {
          this.selectedDashboard = null;
          this.onChangeDashboard();
        }
      });
  }
  onRemovePortal() {
    this.onChangeDashboard();
  }

  onChangeDashboard() {
    if (this.selectedDashboard) {
      this.dashboardService
        .findDashboardPanels(this.selectedDashboard)
        .pipe(takeUntil(this.destroy$))
        .subscribe((panels) => (this.dashboardPanels = panels));
    } else {
      this.dashboardPanels = [];
    }
  }

  closeModal(modalRef: NgbModalRef, ev: any, updated: string) {
    modalRef.dismiss();
    if (ev === "update" || ev === "create") {
      if (updated === "dashboard") {
        this.findDashboards();
      } else {
        this.onChangeDashboard();
      }
    }
  }

  openModal(modalRef: TemplateRef<any>) {
    this.modal.open(modalRef, {
      centered: true,
    });
  }

  onCreateDashboard() {
    this.selectedDashboardId = null;
    this.openModal(this.manageDashboardTemplate);
  }

  onManageDashboard() {
    this.selectedDashboardId = this.selectedDashboard;
    this.openModal(this.manageDashboardTemplate);
  }

  onCreateDashboardPanel() {
    this.selectedDashboardPanelId = null;
    this.openModal(this.manageDashboardPanelTemplate);
  }

  onDeleteDashboard() {
    this.dashboardService
      .updateDashboard(this.selectedDashboard, {
        dashboard_status: "deleted",
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.findDashboards();
      });
  }
}
