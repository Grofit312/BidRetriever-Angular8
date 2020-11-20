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
import {
  mergeObjectsByKey,
  groupByTimeInterval,
  generateRandomColor,
} from "app/analytics/helpers/object-helper";
import { EChartTypes } from "app/analytics/models/dataTypes.model";

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
        // parse response into key: value
        let valueKeys = [];
        let data = v.map((el) => {
          // find the value key name
          const valueKey = Object.keys(el).find(
            (key) => typeof el[key] === "number"
          );

          // find the custom key name
          const customKey = Object.keys(el).find(
            (key) => key !== "bid_month" && key !== valueKey
          );

          valueKeys.push(customKey ? el[customKey] : valueKey);

          return {
            bid_month: el.bid_month,
            [customKey ? el[customKey] : valueKey]: el[valueKey],
          };
        });

        valueKeys = valueKeys.filter((v, i, a) => a.indexOf(v) === i);

        // group by bid month
        data = mergeObjectsByKey(data, "bid_month");

        // group by time interval
        data = groupByTimeInterval(data, this.panelData.panel_time_interval);

        data = data.sort((a, b) =>
          a.bid_month > b.bid_month ? 1 : a.bid_month < b.bid_month ? -1 : 0
        );

        switch (this.panelData.panel_chart_type) {
          case this.ChartTypes.PieChart:
            {
              const pieData = data.map((item, index) => ({
                type: item.bid_month,
                value: Object.keys(item)
                  .filter((key) => key !== "bid_month")
                  .reduce((acc, cur) => acc + item[cur], 0),
                subs: Object.keys(item)
                  .filter((key) => key !== "bid_month")
                  .map((cur) => ({
                    type: cur,
                    value: item[cur],
                  })),
                id: index,
                color: generateRandomColor(3 * index),
              }));

              this.chartConfig = {
                dataProvider: pieData,
                valueField: "value",
                titleField: "type",
                labelText: "[[title]]: [[value]]",
                balloonText: "[[title]]: [[value]]",
                pulledField: "pulled",
                colorField: "color",
                listeners: [
                  {
                    event: "clickSlice",
                    method: function (event) {
                      var chart = event.chart;
                      let selected;
                      if (event.dataItem.dataContext.id != undefined) {
                        selected = event.dataItem.dataContext.id;
                      } else {
                        selected = undefined;
                      }

                      chart.dataProvider = pieData.reduce(
                        (acc, cur, index) =>
                          index === selected
                            ? [
                                ...acc,
                                ...cur.subs.map((v) => ({
                                  ...v,
                                  pulled: true,
                                  color: cur.color,
                                })),
                              ]
                            : [...acc, cur],
                        []
                      );
                      chart.validateData();
                    },
                  },
                ],
              };
            }
            break;
          case this.ChartTypes.StackedBarChart:
          case this.ChartTypes.SeriesBarChart:
            this.chartConfig = {
              dataProvider: data,
              legend: {
                horizontalGap: 10,
                position: "bottom",
                useGraphSettings: true,
                markerSize: 10,
              },
              valueAxes: [
                this.panelData.panel_chart_type ===
                this.ChartTypes.StackedBarChart
                  ? {
                      stackType: "regular",
                      axisAlpha: 0.3,
                      gridAlpha: 0,
                    }
                  : {
                      axisAlpha: 0.3,
                      gridAlpha: 0,
                    },
              ],
              graphs: valueKeys.map((valueKey) => ({
                balloonText:
                  "<b>[[title]]</b><br/><span style='font-size:14px'>[[category]]: <b>[[value]]</b></span>",
                fillAlphas: 0.8,
                labelText: "[[value]]",
                lineAlpha: 0.3,
                title: valueKey
                  .split("_")
                  .map(
                    (word: string) =>
                      word.charAt(0).toUpperCase() + word.slice(1)
                  )
                  .join(" "),
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
              categoryField: "bid_month",
            };
            break;
        }
      });
  }

  groupByRange(
    data: { bid_month: string; [i: string]: string | number }[],
    interval: string
  ) {
    // switch (interval) {
    //   case EIntervalTypes.Month:
    //     break;
    //     case EIntervalTypes.Quarter:
    //     break;
    //     case EIntervalTypes.Year:
    //     break;
    // }
    return data.map((el) => {
      const newData = { ...el, title: el.bid_month };
      delete newData.bid_month;
      return newData;
    });
  }
}
