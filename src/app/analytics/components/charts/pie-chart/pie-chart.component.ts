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
  selector: "app-pie-chart",
  templateUrl: "./pie-chart.component.html",
  styleUrls: ["./pie-chart.component.css"],
})
export class PieChartComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild("chart", { static: true }) chartRef: ElementRef;
  @Input() chartConfig;
  chart: AmChart;

  constructor(private chartsService: AmChartsService) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.chart = this.chartsService.makeChart(this.chartRef.nativeElement, {
      type: "pie",
      theme: "light",
      balloon: {
        fixedPosition: true,
      },
      export: {
        enabled: true,
        menu: [],
      },
      ...this.chartConfig,
    });
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chartsService.destroyChart(this.chart);
    }
  }
}
