import { Routes, RouterModule } from '@angular/router';
import { UserSetupComponent } from 'app/customer-portal/system-settings/user-setup/user-setup.component';
import { CustomerInformationComponent } from 'app/customer-portal/system-settings/customer-information/customer-information.component';
import { DocumentSettingsComponent } from 'app/customer-portal/system-settings/document-settings/document-settings.component';
import { DestinationSystemSettingsComponent } from 'app/customer-portal/system-settings/destination-system-settings/destination-system-settings.component';
import { SourceSystemAccountsComponent } from 'app/customer-portal/system-settings/source-system-accounts/source-system-accounts.component';
import { NotificationSettingsComponent } from 'app/customer-portal/system-settings/notification-settings/notification-settings.component';
import { SubscriptionSettingsComponent } from 'app/customer-portal/system-settings/subscription-settings/subscription-settings.component';
import { SystemSettingsComponent } from 'app/customer-portal/system-settings/system-settings.component';
import { CompanyOfficeSetupComponent } from './company-office-setup/company-office-setup.component';
import { ModuleWithProviders } from '@angular/core';

const routes: Routes = [
  {
    path: '',
    component: SystemSettingsComponent,
    children: [
      {
        path: 'user-setup',
        component: UserSetupComponent
      },
      {
        path: 'customer-information',
        component: CustomerInformationComponent
      },
      {
        path: 'company-office-setup',
        component: CompanyOfficeSetupComponent
      },
      {
        path: 'document-settings',
        component: DocumentSettingsComponent
      },
      {
        path: 'destination-system-settings',
        component: DestinationSystemSettingsComponent
      },
      {
        path: 'source-system-accounts',
        component: SourceSystemAccountsComponent
      },
      {
        path: 'notification-settings',
        component: NotificationSettingsComponent
      },
      {
        path: 'subscription-settings',
        component: SubscriptionSettingsComponent
      },
      {
        path: '',
        redirectTo: 'user-setup'
      }
    ]
  }
];
export const systemSettingsRouting: ModuleWithProviders = RouterModule.forChild(routes);
