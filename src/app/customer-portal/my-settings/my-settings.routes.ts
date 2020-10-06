import { Routes, RouterModule } from '@angular/router';
import { NotificationSettingsComponent } from './notification-settings/notification-settings.component';
import { MySettingsComponent } from './my-settings.component';

import { ModuleWithProviders } from '@angular/core';

const routes: Routes = [
  {
    path: '',
    component: MySettingsComponent,
    children: [
      {
        path: 'notification-settings',
        component: NotificationSettingsComponent
      },
      {
        path: '',
        redirectTo: 'notification-settings'
      }
    ]
  }
];
export const mySettingsRouting: ModuleWithProviders = RouterModule.forChild(routes);
