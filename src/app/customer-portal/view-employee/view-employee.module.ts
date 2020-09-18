import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { viewEmployeeRouting } from "app/customer-portal/view-employee/view-employee.routes";
import { ViewEmployeeApi } from "app/customer-portal/view-employee/view-employee.api.service";
import { EmployeeOverviewComponent } from './employee-overview/employee-overview.component';


@NgModule({
  declarations: [EmployeeOverviewComponent],
  imports: [
    viewEmployeeRouting,
    CommonModule
  ],
  providers: [
    ViewEmployeeApi
  ],
})

export class ViewEmployeeModule { 

}
