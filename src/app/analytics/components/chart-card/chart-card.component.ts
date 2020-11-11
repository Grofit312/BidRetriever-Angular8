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
import { DashboardService } from "app/analytics/services/dashboard.service";
import { DashboardPanel } from "app/analytics/models/dashboard.model";
import { mergeObjectsByKey } from "app/analytics/helpers/object-helper";
import {
  EChartTypes,
  CompanyOverallBidHistoryResponse,
  OverallBidsReceivedResponse,
  OverallBidReceivedByProjectAdminResponse,
  OverallBidReceivedBySourceCompanyResponse,
  OverallBidsReceivedByOfficeResponse,
  CompanyOverallValueResponse,
  CompanyOverallInviteVolumeResponse,
} from "app/analytics/models/dataTypes.model";

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
    this.dataSourceTypes = this.dashboardService.analyticDatasources.map(
      (item) => ({
        key: item.analytic_datasource_id,
        label: item.analytic_datasource_name,
        analytic_datasource_type: item.analytic_datasource_type,
        charts: item.compatible_chart_types,
      })
    );

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
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe((v) => {
        let data, valueKeys;
        switch (this.panelData.panel_analytic_datasource) {
          case "CompanyOverallBidHistory":
          case "OverallBidHistory":
            data = (v as CompanyOverallBidHistoryResponse[]).map((item) => ({
              "Total Stage": item.total_stage,
              title: item.project_stage,
            }));
            valueKeys = ["Total Stage"];
            break;

          case "SourceOverallBidsReceived":
          case "OverallBidsReceived":
            data = (v as OverallBidsReceivedResponse[]).map((item) => ({
              "Total Invites": item.total_invites,
              title: item.bid_month,
            }));
            valueKeys = ["Total Invites"];
            break;

          case "OverallBidReceivedBySourceCompany":
            data = (v as OverallBidReceivedBySourceCompanyResponse[]).map(
              (item) => ({
                "Total Invites": item.totalinvites,
                title: item.bid_month,
              })
            );
            valueKeys = ["Total Invites"];
            break;

          case "OverallBidReceivedByProjectAdmin":
            // data = mergeObjectsByKey(
            //   (v as OverallBidReceivedByProjectAdminResponse[]).map((item) => ({
            //     [item.user_displayname]: item.totalinvites,
            //     title: item.bid_month,
            //   })),
            //   "title"
            // );

            data = [
              {
                title: 2003,
                europe: 2.5,
                namerica: 2.5,
                asia: 2.1,
                lamerica: 0.3,
                meast: 0.2,
                africa: 0.1,
              },
              {
                title: 2004,
                europe: 2.6,
                namerica: 2.7,
                asia: 2.2,
                lamerica: 0.3,
                meast: 0.3,
                africa: 0.1,
              },
              {
                title: 2005,
                europe: 2.8,
                namerica: 2.9,
                asia: 2.4,
                lamerica: 0.3,
                meast: 0.3,
                africa: 0.1,
              },
            ];

            valueKeys = data
              .reduce((acc, cur) => [...acc, ...Object.keys(cur)], [])
              .filter((el, i, arr) => arr.indexOf(el) === i && el !== "title");
            break;

          case "OverallBidsReceivedByOffice":
            data = mergeObjectsByKey(
              (v as OverallBidsReceivedByOfficeResponse[]).map((item) => ({
                [item.office_name]: item.totalinvites,
                title: item.bid_month,
              })),
              "title"
            );
            valueKeys = data
              .reduce((acc, cur) => [...acc, ...Object.keys(cur)], [])
              .filter((el, i, arr) => arr.indexOf(el) === i && el !== "title");
            break;

          case "CompanyOverallValue":
            data = (v as CompanyOverallValueResponse[]).map((item) => ({
              "Total Value": item.total_value,
              title: item.bid_month,
            }));
            valueKeys = ["Total Value"];
            break;

          case "CompanyOverallInviteVolume":
            data = (v as CompanyOverallInviteVolumeResponse[]).map((item) => ({
              "Total Invites": item.total_Invites,
              title: item.bid_month,
            }));
            valueKeys = ["Total Invites"];
            break;
        }

        data = data.sort((a, b) =>
          a.title > b.title ? 1 : a.title < b.title ? -1 : 0
        );

        switch (this.panelData.panel_chart_type) {
          case this.ChartTypes.PieChart:
            this.chartConfig = {
              dataProvider: data,
              valueField: valueKeys[0],
              titleField: "title",
            };
            break;
          case this.ChartTypes.BarChart:
            this.chartConfig = {
              dataProvider: data,
              legend: {
                horizontalGap: 10,
                maxColumns: 1,
                position: "right",
                useGraphSettings: true,
                markerSize: 10,
              },
              valueAxes: [
                {
                  stackType: "regular",
                  axisAlpha: 0.3,
                  gridAlpha: 0,
                },
              ],
              graphs: valueKeys.map((valueKey) => ({
                balloonText:
                  "<span style='font-size:14px'>[[category]]: <b>[[value]]</b></span>",
                fillAlphas: 0.8,
                labelText: "[[value]]",
                lineAlpha: 0.3,
                title: valueKey,
                type: "column",
                color: "#000000",
                valueField: valueKey,
              })),
              categoryAxis: {
                gridPosition: "start",
                axisAlpha: 0,
                gridAlpha: 0,
                position: "left",
              },
              categoryField: "title",
            };
            break;
        }
      });
  }
}
