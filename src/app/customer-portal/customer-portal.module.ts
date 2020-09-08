import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

import { AgGridModule } from "ag-grid-angular";
import { AngularDateTimePickerModule } from "angular2-datetimepicker";
import { TreeModule } from "angular-tree-component";
import {
  DxSchedulerModule,
  DxButtonModule,
  DxDataGridModule,
  DxDropDownBoxModule,
  DxLookupModule,
  DxSelectBoxModule,
  DxTextBoxModule,
  DxToolbarModule,
  DxPopupModule,
  DxPopoverModule,
  DxTemplateModule,
  DxTabsModule,
  DxTabPanelModule,
  DxMenuModule,
} from "devextreme-angular";
import { SplitPaneModule } from "ng2-split-pane/lib/ng2-split-pane";

import { CustomerPortalComponent } from "app/customer-portal/customer-portal.component";
import { customerPortalRouting } from "app/customer-portal/customer-portal.routes";
import { MyProjectsComponent } from "app/customer-portal/my-projects/my-projects.component";
import { MyCompaniesComponent } from "app/customer-portal/my-companies/my-companies.component";
import { MySettingsComponent } from "app/customer-portal/my-settings/my-settings.component";
import { TabsComponent } from "app/customer-portal/tabs/tabs.component";
import { ValidationService } from "app/providers/validation.service";
import { NotificationViewerComponent } from "app/customer-portal/notification-viewer/notification-viewer.component";
import { SubmissionsComponent } from "app/customer-portal/submissions/submissions.component";
import { SharedModule } from "app/shared/shared.module";
import { AnalyticsModule } from "app/analytics/analytics.module";

import { DocViewerComponent } from "./doc-viewer/doc-viewer.component";
import { MyCalendarComponent } from "./my-calendar/my-calendar.component";
import { SharedProjectsComponent } from "./shared-projects/shared-projects.component";
import { SystemAnalyticsComponent } from "./system-analytics/system-analytics.component";

@NgModule({
  declarations: [
    CustomerPortalComponent,
    TabsComponent,
    MySettingsComponent,
    MyProjectsComponent,
    MyCompaniesComponent,
    NotificationViewerComponent,
    SubmissionsComponent,
    DocViewerComponent,
    MyCalendarComponent,
    SharedProjectsComponent,
    SystemAnalyticsComponent,
  ],
  imports: [
    customerPortalRouting,
    CommonModule,
    FormsModule,
    AgGridModule.withComponents([]),
    AngularDateTimePickerModule,
    SharedModule,
    TreeModule,
    DxSchedulerModule,
    SplitPaneModule,
    DxButtonModule,
    DxDropDownBoxModule,
    DxDataGridModule,
    DxLookupModule,
    DxMenuModule,
    DxSelectBoxModule,
    DxTextBoxModule,
    DxToolbarModule,
    DxPopupModule,
    DxPopoverModule,
    DxTabsModule,
    DxTabPanelModule,
    DxTemplateModule,
    AnalyticsModule,
  ],
  providers: [ValidationService],
})
export class CustomerPortalModule {}
