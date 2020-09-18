import { Routes, RouterModule } from '@angular/router';
import { ViewEmployeeComponent } from './view-employee.component';
import { EmployeeOverviewComponent } from './employee-overview/employee-overview.component';
import { ModuleWithProviders } from '@angular/core';

const routes: Routes = [
  {
    path: '',
    component: ViewEmployeeComponent,
    children: [
      {
       path: 'overview',
       component: EmployeeOverviewComponent
      },
      {
        path: '',
        redirectTo: 'overiew'

      }
    ]
  }
];
export const viewEmployeeRouting: ModuleWithProviders = RouterModule.forChild(routes);
