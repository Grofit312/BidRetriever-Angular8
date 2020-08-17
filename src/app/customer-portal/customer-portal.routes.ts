import { Routes, RouterModule } from '@angular/router';
import { CustomerPortalComponent } from 'app/customer-portal/customer-portal.component';
import { AuthenticationGuard } from 'app/providers/auth.guard';
import { MySettingsComponent } from 'app/customer-portal/my-settings/my-settings.component';
import { MyProjectsComponent } from 'app/customer-portal/my-projects/my-projects.component';
import { MyCompaniesComponent } from 'app/customer-portal/my-companies/my-companies.component';
import { NotificationViewerComponent } from 'app/customer-portal/notification-viewer/notification-viewer.component';
import { SubmissionsComponent } from 'app/customer-portal/submissions/submissions.component';
import { DocViewerComponent } from './doc-viewer/doc-viewer.component';
import { MyCalendarComponent } from './my-calendar/my-calendar.component';
import { SharedProjectsComponent } from './shared-projects/shared-projects.component';
import { ModuleWithProviders } from '@angular/core';
const routes: Routes = [
  {
    path: '',
    component: CustomerPortalComponent,
    children: [
      {
        path: 'my-projects',
        component: MyProjectsComponent
      },
      {
        path: 'my-companies',
        component: MyCompaniesComponent
      },
      {
        path: 'shared-projects',
        component: SharedProjectsComponent
      },
      {
        path: 'my-calendar',
        component: MyCalendarComponent
      },
      {
        path: 'my-settings',
        component: MySettingsComponent
      },
      {
        path: 'system-settings',
        loadChildren: () => import('./system-settings/system-settings.module').then(m => m.SystemSettingsModule)
      },
      {
        path: 'all-submissions',
        component: SubmissionsComponent,
      },
      {
        path: 'view-project/:project_id',
        loadChildren: () => import('./view-project/view-project.module').then(m => m.ViewProjectModule)
      },
      {
        path: 'view-company/:company_id',
        loadChildren: () => import('./view-company/view-company.module').then(m => m.ViewCompanyModule)
      },
      {
        path: 'notification-viewer',
        component: NotificationViewerComponent
      },
      {
        path: 'doc-viewer/:project_id/:folder_id/:doc_id/:comparison',
        component: DocViewerComponent
      },
      
      {
        path: '',
        redirectTo: 'my-projects'
      },
     

    ]
  }
];
export const customerPortalRouting: ModuleWithProviders = RouterModule.forChild(routes);