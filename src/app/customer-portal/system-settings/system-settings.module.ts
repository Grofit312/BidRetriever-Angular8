import { MenuComponent } from "app/customer-portal/system-settings/menu/menu.component";
import { customerPortalRouting } from "app/customer-portal/customer-portal.routes";
import { UserSetupComponent } from "app/customer-portal/system-settings/user-setup/user-setup.component";
import { CustomerInformationComponent } from "app/customer-portal/system-settings/customer-information/customer-information.component";
import { DocumentSettingsComponent } from "app/customer-portal/system-settings/document-settings/document-settings.component";
import { DestinationSystemSettingsComponent } from "app/customer-portal/system-settings/destination-system-settings/destination-system-settings.component";
import {
  SourceSystemAccountsComponent,
  PasswordCellComponent,
} from "app/customer-portal/system-settings/source-system-accounts/source-system-accounts.component";
import { Ng2SmartTableModule } from "ng2-smart-table";
import { AgGridModule } from "ag-grid-angular";
import { NotificationSettingsComponent } from "app/customer-portal/system-settings/notification-settings/notification-settings.component";
import { SubscriptionSettingsComponent } from "app/customer-portal/system-settings/subscription-settings/subscription-settings.component";
import { systemSettingsRouting } from "app/customer-portal/system-settings/system-settings.routes";
import { SystemSettingsComponent } from "app/customer-portal/system-settings/system-settings.component";
import { FormsModule } from "@angular/forms";
import { CompanyOfficeSetupComponent } from "./company-office-setup/company-office-setup.component";
import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";

@NgModule({
  declarations: [
    SystemSettingsComponent,
    MenuComponent,
    UserSetupComponent,
    CustomerInformationComponent,
    CompanyOfficeSetupComponent,
    DocumentSettingsComponent,
    DestinationSystemSettingsComponent,
    SourceSystemAccountsComponent,
    NotificationSettingsComponent,
    SubscriptionSettingsComponent,
    PasswordCellComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    systemSettingsRouting,
    Ng2SmartTableModule,
    AgGridModule.withComponents([]),
  ],
  providers: [],
  entryComponents: [PasswordCellComponent],
})
export class SystemSettingsModule {}
