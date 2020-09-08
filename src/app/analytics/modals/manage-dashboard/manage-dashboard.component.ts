import {
  Component,
  OnInit,
  Input,
  OnDestroy,
  Output,
  EventEmitter,
} from "@angular/core";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";

import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { NgxSpinnerService } from "ngx-spinner";

import { DashboardService } from "../../services/dashboard.service";
import { Dashboard } from "../../models/dashboard.model";
import { DataStore } from "app/providers/datastore";

@Component({
  selector: "app-manage-dashboard",
  templateUrl: "./manage-dashboard.component.html",
  styleUrls: ["./manage-dashboard.component.scss"],
})
export class ManageDashboardComponent implements OnInit, OnDestroy {
  @Input() dashboardId;
  @Output() closeModal: EventEmitter<any> = new EventEmitter();

  destroy$: Subject<any> = new Subject();

  form: FormGroup = this.fb.group({
    name: ["", Validators.required],
  });

  constructor(
    private dataStore: DataStore,
    private dashboardService: DashboardService,
    private fb: FormBuilder,
    private spinner: NgxSpinnerService
  ) {}

  ngOnInit(): void {
    if (this.dashboardId) {
      this.loadDefault();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.subscribe();
  }

  loadDefault() {
    this.dashboardService
      .getDashboard(this.dashboardId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((dashboard: Dashboard) => {
        this.form.setValue({
          name: dashboard.dashboard_name,
        });
      });
  }

  onCancel() {
    this.closeModal.emit("cancel");
  }

  onSave() {
    if (this.dashboardId) {
      // update
      this.updateDashboard();
    } else {
      // create
      this.createDashboard();
    }
  }

  updateDashboard() {
    this.spinner.show("spinner");
    this.dashboardService
      .updateDashboard(this.dashboardId, {
        dashboard_name: this.form.value.name,

        edit_user_id: this.dataStore.currentUser.user_id,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.spinner.hide("spinner");
        this.closeModal.emit("update");
      });
  }

  createDashboard() {
    this.spinner.show("spinner");
    this.dashboardService
      .createDashboard({
        dashboard_name: this.form.value.name,

        create_user_id: this.dataStore.currentUser.user_id,
        user_id: this.dataStore.currentUser.user_id,
        edit_user_id: this.dataStore.currentUser.user_id,
        customer_id: this.dataStore.currentUser.customer_id,
        office_id: this.dataStore.currentUser.customer_office_id,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.spinner.hide("spinner");
        this.closeModal.emit("create");
      });
  }
}
