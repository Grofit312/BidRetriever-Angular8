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
@NgModule({
  declarations: [
    CompanyOverviewComponent,
    ViewCompanyComponent,
    CompanyNotesComponent
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
    SharedModule,
    CKEditorModule,
    FormsModule,
    ReactiveFormsModule,
    TreeModule,
    AgGridModule.withComponents([]),

  ],
   providers: [
    ViewCompanyApi,
    NotesApi
   ],
})
export class ViewCompanyModule 
{

}
