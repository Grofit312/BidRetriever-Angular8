import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AddProjectModalComponent } from "./add-project-modal/add-project-modal.component";
import { AddCompanyModalComponent } from "./add-company-modal/add-company-modal.component";
import { AddSubmissionModalComponent } from "./add-submission-modal/add-submission-modal.component";
import { TransactionLogsModalComponent } from "./transaction-logs-modal/transaction-logs-modal.component";
import { SubmissionDetailModalComponent } from "./submission-detail-modal/submission-detail-modal.component";
import { DocumentDetailModalComponent } from "./document-detail-modal/document-detail-modal.component";
import { RemoveProjectModalComponent } from "./remove-project-modal/remove-project-modal.component";
import { RemoveCompanyModalComponent } from "./remove-company-modal/remove-company-modal.component";
import { AngularDateTimePickerModule } from "angular2-datetimepicker";
import { AgGridModule } from "ag-grid-angular";
import { FormsModule } from "@angular/forms";
import { TreeModule } from "ng2-tree";
import { SubmissionTransactionLogsModalComponent } from "./submission-transaction-logs-modal/submission-transaction-logs-modal.component";
import { CompanyTransactionLogsModalComponent } from "./company-transaction-logs-modal/company-transaction-logs-modal.component";
import { RemoveSubmissionModalComponent } from "./remove-submission-modal/remove-submission-modal.component";
import { EditProjectModalComponent } from "./edit-project-modal/edit-project-modal.component";
import { EditCompanyModalComponent } from "./edit-company-modal/edit-company-modal.component";
import { AddEventModalComponent } from "./add-event-modal/add-event-modal.component";
import { AddAttendeeModalComponent } from "./add-attendee-modal/add-attendee-modal.component";
import { RemoveAttendeeModalComponent } from "./remove-attendee-modal/remove-attendee-modal.component";
import { EditEventModalComponent } from "./edit-event-modal/edit-event-modal.component";
import { RemoveEventModalComponent } from "./remove-event-modal/remove-event-modal.component";
import { EditDocumentModalComponent } from "./edit-document-modal/edit-document-modal.component";
import { AddShareUserModalComponent } from "./add-share-user-modal/add-share-user-modal.component";
import { PublicShareModalComponent } from "./public-share-modal/public-share-modal.component";
import { RemoveShareModalComponent } from "./remove-share-modal/remove-share-modal.component";
import { AddProjectSourceModalComponent } from "./add-project-source-modal/add-project-source-modal.component";
import {
  DxButtonModule,
  DxTemplateModule,
  DxPopupModule,
  DxPopoverModule,
  DxTabPanelModule,
  DxTextBoxModule,
  DxSelectBoxModule,
  DxResponsiveBoxModule,
  DxScrollViewModule,
  DxDataGridModule,
  DxDateBoxModule,
  DxToolbarModule,
  DxValidatorModule,
  DxNumberBoxModule,
  DxTextAreaModule,
  DxLookupModule,
  DxLoadPanelModule,
} from "devextreme-angular";
import { MomentPipe } from "./pipes/moment.pipe";
import { TimeTillBidPipe } from "./pipes/time-till-bid.pipe";
import { CustomDatetimeComponent } from "./custom-datetime/custom-datetime.component";
import { ProjectDataViewModalComponent } from "./project-data-view-modal/project-data-view-modal.component";
import { ProjectDataViewDetailsModalComponent } from "./project-data-view-details-modal/project-data-view-details-modal.component";
import { ProjectSourceModalComponent } from "./project-source-modal/project-source-modal.component";
import { CompanyDataViewModalComponent } from "./company-data-view-modal/company-data-view-modal.component";
import { CompanyDataViewDetailsModalComponent } from "./company-data-view-details-modal/company-data-view-details-modal.component";
import { CompaniesApi } from "app/customer-portal/my-companies/my-companies.api.service";
import { ContactApi } from "app/customer-portal/view-company/company-employees/company-employees.component.api.service";
import { SourceSystemAccountsApi } from "app/customer-portal/system-settings/source-system-accounts/source-system-accounts.api.service";
import { RecordLogsComponent } from "./record-logs/record-logs.component";
import { AddContactModalComponent } from "./add-contact-modal/add-contact-modal.component";
import { ViewCompanyApi } from "app/customer-portal/view-company/view-company.api.service";
import { ContextMenuModule } from "ngx-contextmenu";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TreeModule,
    ContextMenuModule,
    AgGridModule.withComponents([]),
    AngularDateTimePickerModule,

    DxButtonModule,
    DxDataGridModule,
    DxDateBoxModule,
    DxLookupModule,
    DxNumberBoxModule,
    DxTemplateModule,
    DxPopupModule,
    DxPopoverModule,
    DxResponsiveBoxModule,
    DxScrollViewModule,
    DxSelectBoxModule,
    DxTabPanelModule,
    DxTextAreaModule,
    DxTextBoxModule,
    DxToolbarModule,
    DxValidatorModule,
    DxLoadPanelModule,
  ],
  declarations: [
    AddProjectModalComponent,
    AddCompanyModalComponent,
    AddSubmissionModalComponent,
    TransactionLogsModalComponent,
    SubmissionDetailModalComponent,
    DocumentDetailModalComponent,
    RemoveProjectModalComponent,
    RemoveCompanyModalComponent,
    SubmissionTransactionLogsModalComponent,
    CompanyTransactionLogsModalComponent,
    RemoveSubmissionModalComponent,
    EditProjectModalComponent,
    EditCompanyModalComponent,
    AddEventModalComponent,
    AddAttendeeModalComponent,
    RemoveAttendeeModalComponent,
    EditEventModalComponent,
    RemoveEventModalComponent,
    EditDocumentModalComponent,
    AddShareUserModalComponent,
    PublicShareModalComponent,
    RemoveShareModalComponent,
    AddProjectSourceModalComponent,
    MomentPipe,
    TimeTillBidPipe,
    CustomDatetimeComponent,
    ProjectDataViewModalComponent,
    ProjectDataViewDetailsModalComponent,
    ProjectSourceModalComponent,
    CompanyDataViewModalComponent,
    CompanyDataViewDetailsModalComponent,
    RecordLogsComponent,
    AddContactModalComponent,
  ],
  exports: [
    AddProjectModalComponent,
    AddSubmissionModalComponent,
    TransactionLogsModalComponent,
    SubmissionDetailModalComponent,
    DocumentDetailModalComponent,
    RemoveProjectModalComponent,
    RemoveCompanyModalComponent,
    SubmissionTransactionLogsModalComponent,
    CompanyTransactionLogsModalComponent,
    RemoveSubmissionModalComponent,
    EditProjectModalComponent,
    EditCompanyModalComponent,
    AddEventModalComponent,
    AddAttendeeModalComponent,
    RemoveAttendeeModalComponent,
    EditEventModalComponent,
    RemoveEventModalComponent,
    EditDocumentModalComponent,
    AddShareUserModalComponent,
    PublicShareModalComponent,
    RemoveShareModalComponent,
    AddProjectSourceModalComponent,
    AddContactModalComponent,
    AddCompanyModalComponent,
    MomentPipe,
    TimeTillBidPipe,
    CustomDatetimeComponent,
    ProjectDataViewModalComponent,
    ProjectSourceModalComponent,
    CompanyDataViewModalComponent,
    CompanyDataViewDetailsModalComponent,
    RecordLogsComponent,

    ContextMenuModule,
  ],
  providers: [
    CompaniesApi,
    ViewCompanyApi,
    ContactApi,
    SourceSystemAccountsApi,
  ],
})
export class SharedModule {}
