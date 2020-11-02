import {
  Component,
  OnInit,
  Output,
  EventEmitter,
  OnDestroy,
  Input,
  TemplateRef,
  ViewChild,
} from "@angular/core";
import { ActivatedRoute } from "@angular/router";

import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { NgbModal, NgbModalRef } from "@ng-bootstrap/ng-bootstrap";

import { DataStore } from "app/providers/datastore";
import { DashboardService } from "../../services/dashboard.service";
import { DashboardPanel } from "../../models/dashboard.model";
import { EChartTypes } from "../../models/dataTypes.model";

@Component({
  selector: "app-chart-card",
  templateUrl: "./chart-card.component.html",
  styleUrls: ["./chart-card.component.scss"],
})
export class ChartCardComponent implements OnInit, OnDestroy {
  @ViewChild("manageDashboardPanelTemplate", { static: false })
  manageDashboardPanelTemplate: TemplateRef<any>;

  @Input() dashboardPanelId: string;
  @Input() analyticType: string;
  @Output() remove: EventEmitter<any> = new EventEmitter();

  panelData: DashboardPanel;
  ChartTypes = EChartTypes;
  dataSourceTypes = [];

  chartConfig: any;

  destroy$: Subject<any> = new Subject();

  constructor(
    private activatedRoute: ActivatedRoute,
    private dashboardService: DashboardService,
    private dataStore: DataStore,
    private modal: NgbModal
  ) {}

  ngOnInit(): void {
    this.dashboardService
      .findAnalyticDatasources(
        this.dataStore.currentUser.customer_id,
        this.analyticType
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe((analyticDatasources) => {
        this.dataSourceTypes = analyticDatasources.map((item) => ({
          key: item.analytic_datasource_id,
          label: item.analytic_datasource_name,
          analytic_datasource_type: item.analytic_datasource_type,
          charts: item.compatible_chart_types,
        }));
      });

    if (this.dashboardPanelId) {
      this.getDashboardPanel();
    }
  }

  getDashboardPanel() {
    this.dashboardService
      .getDashboardPanel(this.dashboardPanelId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((panel) => {
        this.panelData = panel;
        this.getData();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  closeModal(modalRef: NgbModalRef, ev: any) {
    modalRef.dismiss();

    if (ev === "update") {
      this.chartConfig = null;
      this.getDashboardPanel();
    }
  }

  openModal(modalRef: TemplateRef<any>) {
    this.modal.open(modalRef, {
      centered: true,
    });
  }

  onManageDashboard() {
    this.openModal(this.manageDashboardPanelTemplate);
  }

  onDeleteDashboardPanel() {
    this.dashboardService
      .updateDashboardPanel(this.dashboardPanelId, {
        panel_status: "deleted",
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.remove.emit();
      });
  }

  getData() {
    this.dashboardService
      .executeAnalyticDatasource({
        customer_id: this.dataStore.currentUser.customer_id,
        company_id: this.activatedRoute.snapshot.queryParams["company_id"],
        analytic_datasource_interval: this.panelData.panel_time_interval,
        analytic_datasource_startdatetime: this.panelData
          .panel_start_date_offset,
        analytic_datasource_enddatetime: this.panelData.panel_end_date_offset,
        analytic_datasource_id: this.panelData.panel_analytic_datasource,
        analytic_type: (
          this.dataSourceTypes.find(
            (type) => type.key === this.panelData.panel_analytic_datasource
          ) || {}
        ).analytic_datasource_type,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((v) => {
        switch (this.panelData.panel_chart_type) {
          case this.ChartTypes.PieChart:
            this.chartConfig = {
              dataProvider: v,
              valueField: "total_stage",
              titleField: "project_stage",
            };
            break;
            case this.ChartTypes.BarChart:
              this.chartConfig = {
                dataProvider: v,
                graphs: [
                  {
                    fillAlphas: 0.9,
                    lineAlpha: 0.2,
                    type: "column",
                    valueField: "total_stage",
                  },
                ],
                categoryField: "project_stage",
              };
              break;
        }
      });
  }
}
