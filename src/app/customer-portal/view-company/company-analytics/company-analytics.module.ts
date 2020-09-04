import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";

import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { NgSelectModule } from "@ng-select/ng-select";
import { NgxSpinnerModule } from "ngx-spinner";
import { AmChartsModule } from "@amcharts/amcharts3-angular";

import { CompanyAnalyticsRoutingModule } from "./company-analytics-routing.module";
import { DashboardComponent } from "./components/dashboard/dashboard.component";
import { ChartCardComponent } from "./components/chart-card/chart-card.component";
import { ManageDashboardComponent } from "./modals/manage-dashboard/manage-dashboard.component";
import { ManageDashboardPanelComponent } from "./modals/manage-dashboard-panel/manage-dashboard-panel.component";
import { AreaChartComponent } from "./components/charts/area-chart/area-chart.component";
import { PieChartComponent } from "./components/charts/pie-chart/pie-chart.component";
import { BarChartComponent } from "./components/charts/bar-chart/bar-chart.component";

@NgModule({
  declarations: [
    DashboardComponent,
    ChartCardComponent,
    ManageDashboardComponent,
    ManageDashboardPanelComponent,

    AreaChartComponent,
    PieChartComponent,
    BarChartComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,

    NgbModule,
    NgSelectModule,
    NgxSpinnerModule,
    AmChartsModule,

    CompanyAnalyticsRoutingModule,
  ],
})
export class CompanyAnalyticsModule {}
