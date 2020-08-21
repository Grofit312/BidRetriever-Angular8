import { Routes, RouterModule } from '@angular/router';
import { ViewProjectComponent } from 'app/customer-portal/view-project/view-project.component';
import { ProjectOverviewComponent } from 'app/customer-portal/view-project/project-overview/project-overview.component';
import { ProjectFilesComponent } from 'app/customer-portal/view-project/project-files/project-files.component';
import { ProjectNotificationsComponent } from 'app/customer-portal/view-project/project-notifications/project-notifications.component';
import { ProjectAdministrationComponent } from 'app/customer-portal/view-project/project-administration/project-administration.component';
import { BidretrieverInternalComponent } from 'app/customer-portal/view-project/bidretriever-internal/bidretriever-internal.component';
import { ProjectSubmissionsComponent } from './project-submissions/project-submissions.component';
import { ProjectSourceComponent } from './project-source/project-source.component';
import { ProjectSharingComponent } from './project-sharing/project-sharing.component';
import { ProjectNotesComponent } from "./project-notes/project-notes.component";
import { ModuleWithProviders } from '@angular/core';

const routes: Routes = [
  {
    path: '',
    component: ViewProjectComponent,
    children: [
      {
        path: 'overview',
        component: ProjectOverviewComponent
      },
      {
        path: 'files',
        component: ProjectFilesComponent
      },
      {
        path: 'view-submission',
        component: ProjectSubmissionsComponent
      },
      {
        path: 'notifications',
        component: ProjectNotificationsComponent
      },
      {
        path: 'source',
        component: ProjectSourceComponent
      },
      {
        path: 'sharing',
        component: ProjectSharingComponent
      },
      {
        path: 'administration',
        component: ProjectAdministrationComponent
      },
      {
        path: 'internal',
        component: BidretrieverInternalComponent
      },
      {
        path: 'project-notes',
        component: ProjectNotesComponent
      },
      {
        path: '',
        redirectTo: 'overview'
      }
    ]
  }
];
export const viewProjectRouting: ModuleWithProviders = RouterModule.forChild(routes);
