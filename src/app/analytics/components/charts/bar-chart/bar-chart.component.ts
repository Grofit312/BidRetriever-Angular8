import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  AfterViewInit,
  Input,
} from "@angular/core";

import { AmChartsService, AmChart } from "@amcharts/amcharts3-angular";

@Component({
  selector: "app-bar-chart",
  templateUrl: "./bar-chart.component.html",
  styleUrls: ["./bar-chart.component.css"],
})
export class BarChartComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild("chart", { static: true }) chartRef: ElementRef;
  @Input() chartConfig;
  chart: AmChart;

  constructor(private chartsService: AmChartsService) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.chart = this.chartsService.makeChart(this.chartRef.nativeElement, {
      type: "serial",
      theme: "light",
      ...this.chartConfig,
    });
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chartsService.destroyChart(this.chart);
    }
  }
}
