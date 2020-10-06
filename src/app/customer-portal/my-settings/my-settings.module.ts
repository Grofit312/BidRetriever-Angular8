
import { MySettingsMenuComponent } from './my-settings-menu/my-settings-menu.component';
import { customerPortalRouting } from "app/customer-portal/customer-portal.routes";
import { mySettingsRouting } from 'app/customer-portal/my-settings/my-settings.routes';
import { MySettingsComponent } from "app/customer-portal/my-settings/my-settings.component";

import { FormsModule } from "@angular/forms";
import { NotificationSettingsComponent } from "app/customer-portal/my-settings/notification-settings/notification-settings.component";
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';



@NgModule({
  declarations: [
    MySettingsComponent,
    MySettingsMenuComponent,
    NotificationSettingsComponent,

 ],
  imports: [
    CommonModule, 
    FormsModule,
    mySettingsRouting,

  ],
  providers :[]
})
export class MySettingsModule { }
