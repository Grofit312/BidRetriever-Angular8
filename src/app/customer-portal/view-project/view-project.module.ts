import { ViewProjectComponent } from "app/customer-portal/view-project/view-project.component";
import { TabsComponent } from "app/customer-portal/view-project/tabs/tabs.component";
import { viewProjectRouting } from "app/customer-portal/view-project/view-project.routes";
import { FormsModule } from "@angular/forms";
import { AgGridModule } from "ag-grid-angular";
import { ProjectOverviewComponent } from "app/customer-portal/view-project/project-overview/project-overview.component";
import { ProjectFilesComponent } from "app/customer-portal/view-project/project-files/project-files.component";
import { ProjectNotificationsComponent } from "app/customer-portal/view-project/project-notifications/project-notifications.component";
import { ProjectAdministrationComponent } from "app/customer-portal/view-project/project-administration/project-administration.component";
import { BidretrieverInternalComponent } from "app/customer-portal/view-project/bidretriever-internal/bidretriever-internal.component";
import { ViewProjectApi } from "app/customer-portal/view-project/view-project.api.service";
import { ProjectsApi } from "app/customer-portal/my-projects/my-projects.api.service";
import { ProjectSubmissionsComponent } from "./project-submissions/project-submissions.component";
import { SharedModule } from "app/shared/shared.module";
import { TreeModule } from 'angular-tree-component';
import { ProjectFilesApi } from "./project-files/project-files.api.service";
import { ProjectSourceComponent } from "./project-source/project-source.component";
import { ProjectSharingComponent } from "./project-sharing/project-sharing.component";

import {
  DxButtonModule,
  DxDataGridModule,
  DxTextBoxModule,
  DxDropDownBoxModule,
  DxToolbarModule,
  DxLookupModule,
  DxSelectBoxModule,
  DxPopupModule,
  DxPopoverModule,
  DxTemplateModule,
  DxTabPanelModule,
  DxScrollViewModule,
} from "devextreme-angular";
import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

@NgModule({
  declarations: [
    ViewProjectComponent,
    TabsComponent,
    ProjectOverviewComponent,
    ProjectFilesComponent,
    ProjectSubmissionsComponent,
    ProjectNotificationsComponent,
    ProjectAdministrationComponent,
    ProjectSourceComponent,
    ProjectSharingComponent,
    BidretrieverInternalComponent,
  ],
  imports: [
    viewProjectRouting,
    CommonModule,
    FormsModule,
    AgGridModule.withComponents([]),
    SharedModule,
    TreeModule,

    DxButtonModule,
    DxDataGridModule,
    DxDropDownBoxModule,
    DxLookupModule,
    DxPopupModule,
    DxPopoverModule,
    DxScrollViewModule,
    DxSelectBoxModule,
    DxTabPanelModule,
    DxTemplateModule,
    DxTextBoxModule,
    DxToolbarModule,
  ],
  providers: [
    ViewProjectApi,
    ProjectsApi,
    ProjectFilesApi
  ],
})

export class ViewProjectModule {
}
