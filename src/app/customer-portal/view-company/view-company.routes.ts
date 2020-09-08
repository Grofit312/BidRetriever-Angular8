import { Routes, RouterModule } from "@angular/router";
import { ModuleWithProviders } from "@angular/core";
import { ViewCompanyComponent } from "app/customer-portal/view-company/view-company.component";
import { CompanyOverviewComponent } from "./company-overview/company-overview.component";
import { CompanyNotesComponent } from "./company-notes/company-notes.component";
import { CompanyProjectsComponent } from "./company-projects/company-projects.component";
import { CompanyAnalyticsComponent } from "./company-analytics/company-analytics.component";
import { CompanyEmployeesComponent } from "./company-employees/company-employees.component";

const routes: Routes = [
  {
    path: "",
    component: ViewCompanyComponent,
    children: [
      {
        path: "overview",
        component: CompanyOverviewComponent,
      },
      {
        path: "notes",
        component: CompanyNotesComponent,
      },
      {
        path: "projects",
        component: CompanyProjectsComponent,
      },
      {
        path: "employees",
        component: CompanyEmployeesComponent,
      },
      {
        path: "analytics",
        component: CompanyAnalyticsComponent,
      },
    ],
  },
];
export const ViewCompanyRouter: ModuleWithProviders = RouterModule.forChild(
  routes
);
