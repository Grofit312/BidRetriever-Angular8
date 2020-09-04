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
  selector: "app-area-chart",
  templateUrl: "./area-chart.component.html",
  styleUrls: ["./area-chart.component.css"],
})
export class AreaChartComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild("chart", { static: true }) chartRef: ElementRef;
  chart: AmChart;

  constructor(private chartsService: AmChartsService) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.chart = this.chartsService.makeChart(this.chartRef.nativeElement, {
      type: "serial",
      theme: "light",
      legend: {
        align: "center",
        equalWidths: false,
        periodValueText: "total: [[value.sum]]",
        valueAlign: "left",
        valueText: "[[value]] ([[percents]]%)",
        valueWidth: 100,
      },
      dataProvider: [
        {
          year: "2000",
          cars: 1587,
          motorcycles: 650,
          bicycles: 121,
        },
        {
          year: "1995",
          cars: 1567,
          motorcycles: 683,
          bicycles: 146,
        },
        {
          year: "1996",
          cars: 1617,
          motorcycles: 691,
          bicycles: 138,
        },
        {
          year: "1997",
          cars: 1630,
          motorcycles: 642,
          bicycles: 127,
        },
        {
          year: "1998",
          cars: 1660,
          motorcycles: 699,
          bicycles: 105,
        },
        {
          year: "1999",
          cars: 1683,
          motorcycles: 721,
          bicycles: 109,
        },
        {
          year: "2000",
          cars: 1691,
          motorcycles: 737,
          bicycles: 112,
        },
        {
          year: "2001",
          cars: 1298,
          motorcycles: 680,
          bicycles: 101,
        },
        {
          year: "2002",
          cars: 1275,
          motorcycles: 664,
          bicycles: 97,
        },
        {
          year: "2003",
          cars: 1246,
          motorcycles: 648,
          bicycles: 93,
        },
        {
          year: "2004",
          cars: 1218,
          motorcycles: 637,
          bicycles: 101,
        },
        {
          year: "2005",
          cars: 1213,
          motorcycles: 633,
          bicycles: 87,
        },
        {
          year: "2006",
          cars: 1199,
          motorcycles: 621,
          bicycles: 79,
        },
        {
          year: "2007",
          cars: 1110,
          motorcycles: 210,
          bicycles: 81,
        },
        {
          year: "2008",
          cars: 1165,
          motorcycles: 232,
          bicycles: 75,
        },
        {
          year: "2009",
          cars: 1145,
          motorcycles: 219,
          bicycles: 88,
        },
        {
          year: "2010",
          cars: 1163,
          motorcycles: 201,
          bicycles: 82,
        },
        {
          year: "2011",
          cars: 1180,
          motorcycles: 285,
          bicycles: 87,
        },
        {
          year: "2012",
          cars: 1159,
          motorcycles: 277,
          bicycles: 71,
        },
      ],
      valueAxes: [
        {
          stackType: "regular",
          gridAlpha: 0.07,
          position: "left",
          title: "percent",
        },
      ],
      graphs: [
        {
          fillAlphas: 0.5,
          lineAlpha: 0.5,
          title: "Cars",
          valueField: "cars",
          index: 2,
        },
        {
          fillAlphas: 0.5,
          lineAlpha: 0.5,
          title: "Motorcycles",
          valueField: "motorcycles",
          index: 3,
        },
        {
          fillAlphas: 0.5,
          lineAlpha: 0.5,
          title: "Bicycles",
          valueField: "bicycles",
          index: 1,
        },
      ],
      plotAreaBorderAlpha: 0,
      marginLeft: 0,
      marginBottom: 0,
      chartCursor: {
        cursorAlpha: 0,
        zoomable: false,
      },
      categoryField: "year",
      categoryAxis: {
        startOnAxis: true,
        axisColor: "#DADADA",
        gridAlpha: 0.07,
      },
    });
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chartsService.destroyChart(this.chart);
    }
  }
}
