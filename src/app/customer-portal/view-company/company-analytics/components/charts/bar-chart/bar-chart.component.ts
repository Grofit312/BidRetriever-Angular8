import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from "@angular/core";

import { AmChartsService, AmChart } from "@amcharts/amcharts3-angular";

@Component({
  selector: "app-bar-chart",
  templateUrl: "./bar-chart.component.html",
  styleUrls: ["./bar-chart.component.css"],
})
export class BarChartComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild("chart", { static: true }) chartRef: ElementRef;
  chart: AmChart;

  constructor(private chartsService: AmChartsService) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.chart = this.chartsService.makeChart(this.chartRef.nativeElement, {
      type: "serial",
      theme: "light",
      dataProvider: [
        {
          country: "USA",
          visits: 2025,
        },
        {
          country: "China",
          visits: 1882,
        },
        {
          country: "Japan",
          visits: 1809,
        },
        {
          country: "Germany",
          visits: 1322,
        },
        {
          country: "UK",
          visits: 1122,
        },
        {
          country: "France",
          visits: 1114,
        },
        {
          country: "India",
          visits: 984,
        },
        {
          country: "Spain",
          visits: 711,
        },
        {
          country: "Netherlands",
          visits: 665,
        },
        {
          country: "Russia",
          visits: 580,
        },
        {
          country: "South Korea",
          visits: 443,
        },
        {
          country: "Canada",
          visits: 441,
        },
        {
          country: "Brazil",
          visits: 395,
        },
      ],
      graphs: [
        {
          fillAlphas: 0.9,
          lineAlpha: 0.2,
          type: "column",
          valueField: "visits",
        },
      ],
      categoryField: "country",
      chartCursor: {
        fullWidth: true,
        cursorAlpha: 0.1,
        listeners: [
          {
            event: "changed",
            method: (ev) => {
              // Log last cursor position
              ev.chart.lastCursorPosition = ev.index;
            },
          },
        ],
      },
    });
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chartsService.destroyChart(this.chart);
    }
  }
}
