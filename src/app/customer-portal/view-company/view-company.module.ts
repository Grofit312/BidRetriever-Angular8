import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ViewCompanyRouter}  from "./view-company.routes";
import { ViewCompanyComponent } from "app/customer-portal/view-company/view-company.component";
import { CompanyOverviewComponent } from './company-overview/company-overview.component';
import { ViewCompanyApi } from "app/customer-portal/view-company/view-company.api.service";
import { NotesApi } from "app/customer-portal/view-company/notes.api.service";
import { SharedModule } from "app/shared/shared.module";
import { AgGridModule } from "ag-grid-angular";
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
import { CompanyNotesComponent } from './company-notes/company-notes.component';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TreeModule } from 'angular-tree-component';
import { EditorModule } from '@tinymce/tinymce-angular';
import { CompanyProjectsComponent } from './company-projects/company-projects.component';
import { MyCalendarApi } from '../my-calendar/my-calendar.component.api.service';
import { ProjectsApi } from '../my-projects/my-projects.api.service';
import { UserInfoApi } from '../system-settings/user-setup/user-setup.api.service';
import { CompanyOfficeApi } from '../system-settings/company-office-setup/company-office-setup.api.service';
import { AuthApi } from 'app/providers/auth.api.service';
import { ValidationService } from 'app/providers/validation.service';
@NgModule({
  declarations: [
    CompanyOverviewComponent,
    ViewCompanyComponent,
    CompanyNotesComponent,
    CompanyProjectsComponent
  ],
  imports: [
    ViewCompanyRouter,
    CommonModule,
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
    EditorModule,
    SharedModule,
    CKEditorModule,
    FormsModule,
    ReactiveFormsModule,
    TreeModule,
    AgGridModule.withComponents([]),
  ],
   providers: [
    ViewCompanyApi,
    NotesApi,
    MyCalendarApi,
    ProjectsApi,
    UserInfoApi,
    CompanyOfficeApi,
    AuthApi,
    ValidationService
   ],
})
export class ViewCompanyModule 
{

}
