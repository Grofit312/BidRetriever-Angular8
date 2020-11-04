import {
  Component,
  OnInit,
  Input,
  Output,
  OnDestroy,
  EventEmitter,
} from "@angular/core";
import { FormGroup, Validators, FormBuilder } from "@angular/forms";
import { DatePipe } from "@angular/common";

import { Subject } from "rxjs";
import { takeUntil, distinctUntilChanged } from "rxjs/operators";
import { NgxSpinnerService } from "ngx-spinner";

import { DataStore } from "app/providers/datastore";
import { DashboardService } from "../../services/dashboard.service";
import { DashboardPanel } from "../../models/dashboard.model";
import {
  IntervalTypeLabels,
  ChartTypeLabels,
} from "../../models/dataTypes.model";

@Component({
  selector: "app-manage-dashboard-panel",
  templateUrl: "./manage-dashboard-panel.component.html",
  styleUrls: ["./manage-dashboard-panel.component.scss"],
})
export class ManageDashboardPanelComponent implements OnInit, OnDestroy {
  @Input() analyticType;
  @Input() dashboardId;
  @Input() dashboardPanelId;
  @Output() closeModal: EventEmitter<any> = new EventEmitter();

  destroy$: Subject<any> = new Subject();

  analyticTypes = [];
  dataSourceTypes = [];
  chartTypes = [];
  intervalTypes = [];
  chartTypeConfig = null;

  form: FormGroup = this.fb.group({
    name: ["", Validators.required],
    description: [""],
    datasource: [null, Validators.required],
    chartType: [null, Validators.required],
    panel_start_date_offset: [""],
    panel_end_date_offset: [""],
    interval: [null, Validators.required],
  });

  constructor(
    private dataStore: DataStore,
    private dashboardService: DashboardService,
    private fb: FormBuilder,
    private spinner: NgxSpinnerService,
    private datePipe: DatePipe
  ) {}

  async ngOnInit() {
    if (!this.dashboardId) {
      this.closeModal.emit("error");
    }

    this.intervalTypes = Object.keys(IntervalTypeLabels).map((key) => ({
      key,
      label: IntervalTypeLabels[key],
    }));

    this.spinner.show("spinner");
    await this.dashboardService
      .findAnalyticDatasources(
        this.dataStore.currentUser.customer_id,
        this.analyticType
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe((analyticDatasources) => {
        this.spinner.hide("spinner");
        this.dataSourceTypes = analyticDatasources.map((item) => ({
          key: item.analytic_datasource_id,
          label: item.analytic_datasource_name,
          charts: item.compatible_chart_types,
        }));
      });

    await this.form.controls.datasource.valueChanges
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((v) => {
        const dataSource = this.dataSourceTypes.find((item) => item.key === v);
        if (dataSource) {
          this.chartTypes = dataSource.charts.split(",").map((key) => ({
            key,
            label: ChartTypeLabels[key],
          }));
        } else {
          this.chartTypes = [];
        }
      });

    if (this.dashboardPanelId) {
      this.loadDefault();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.subscribe();
  }

  loadDefault() {
    this.dashboardService
      .getDashboardPanel(this.dashboardPanelId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((dashboardPanel: DashboardPanel) => {
        this.form.setValue({
          datasource: dashboardPanel.panel_analytic_datasource,
          chartType: dashboardPanel.panel_chart_type,
          description: dashboardPanel.panel_desc,
          panel_start_date_offset: dashboardPanel.panel_start_date_offset,
          panel_end_date_offset: dashboardPanel.panel_end_date_offset,
          name: dashboardPanel.panel_name,
          interval: dashboardPanel.panel_time_interval,
        });
      });
  }

  onCancel() {
    this.closeModal.emit("cancel");
  }

  onSave() {
    if (this.form.invalid) {
      return;
    }

    if (this.dashboardPanelId) {
      // update
      this.updateDashboardPanel();
    } else {
      // create
      this.createDashboardPanel();
    }
  }

  updateDashboardPanel() {
    this.spinner.show("spinner");
    this.dashboardService
      .updateDashboardPanel(this.dashboardPanelId, {
        dashboard_id: this.dashboardId,
        panel_analytic_datasource: this.form.value.datasource,
        panel_chart_type: this.form.value.chartType,
        panel_desc: this.form.value.description,
        panel_start_date_offset: this.form.value.panel_start_date_offset,
        panel_end_date_offset: this.form.value.panel_end_date_offset,
        panel_name: this.form.value.name,
        panel_time_interval: this.form.value.interval,

        edit_user_id: this.dataStore.currentUser.user_id,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.spinner.hide("spinner");
        this.closeModal.emit("update");
      });
  }

  createDashboardPanel() {
    this.spinner.show("spinner");
    this.dashboardService
      .createDashboardPanel({
        dashboard_id: this.dashboardId,
        panel_analytic_datasource: this.form.value.datasource,
        panel_chart_type: this.form.value.chartType,
        panel_desc: this.form.value.description || "",
        panel_start_date_offset: this.form.value.panel_start_date_offset,
        panel_end_date_offset: this.form.value.panel_end_date_offset,
        panel_name: this.form.value.name,
        panel_time_interval: this.form.value.interval,

        create_user_id: this.dataStore.currentUser.user_id,
        edit_user_id: this.dataStore.currentUser.user_id,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.spinner.hide("spinner");
        this.closeModal.emit("create");
      });
  }
}
