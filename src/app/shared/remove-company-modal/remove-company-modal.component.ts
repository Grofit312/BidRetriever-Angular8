import { Component, OnInit, ViewChild, ElementRef } from "@angular/core";
import { CompaniesApi } from "app/customer-portal/my-companies/my-companies.api.service";

import { NotificationsService } from "angular2-notifications";
import { Logger } from "app/providers/logger.service";
import { DataStore } from "app/providers/datastore";

@Component({
  selector: "remove-company-modal",
  templateUrl: "./remove-company-modal.component.html",
  styleUrls: ["./remove-company-modal.component.scss"],
})
export class RemoveCompanyModalComponent implements OnInit {
  @ViewChild("removeCompanyModal", { static: false })
  removeCompanyModal: ElementRef;

  parent = null;
  selectedCompanies = [];
  isDeleting = true;
  modalTitle = "";

  constructor(
    private companiesApi: CompaniesApi,
    private notificationService: NotificationsService,
    private loggerService: Logger,
    public dataStore: DataStore
  ) {}

  ngOnInit() {}

  initialize(selectedCompanies: any[], isDeleting: boolean, parent: any) {
    this.parent = parent;
    this.selectedCompanies = selectedCompanies;
    this.isDeleting = isDeleting;

    const companyNames = selectedCompanies
      .map((company) => company["company_name"])
      .join(", ");

    this.modalTitle = `Are you sure you want to ${
      isDeleting ? "delete" : "archive"
    } the following company(s): ${companyNames}`;

    this.removeCompanyModal.nativeElement.style.display = "block";
  }

  onCancel() {
    this.removeCompanyModal.nativeElement.style.display = "none";
  }

  onYes() {
    const status = this.isDeleting ? "deleted" : "archived";
    const companyRemoveTasks = this.selectedCompanies.map((company) =>
      this.companiesApi.updateCompany(company["company_id"], { status: status })
    );

    Promise.all(companyRemoveTasks)
      .then((res) => {
        this.removeCompanyModal.nativeElement.style.display = "none";
        this.parent.onRefresh();

        this.notificationService.success(
          this.isDeleting ? "Delete Company" : "Archive Company",
          `Successfully ${status} ${this.selectedCompanies.length} company(s).`,
          { timeOut: 3000, showProgressBar: false }
        );

        // Log transaction
        this.logTransaction("Completed", "summary");
      })
      .catch((err) => {
        this.removeCompanyModal.nativeElement.style.display = "none";
        this.parent.onRefresh();

        this.notificationService.success(
          this.isDeleting ? "Delete Company" : "Archive Company",
          `Failed to update company status.`,
          { timeOut: 3000, showProgressBar: false }
        );

        // Log transaction
        this.logTransaction("Failed", "summary");
      });
  }

  logTransaction(status: string, transaction_level: string) {
    const operationName = `${this.isDeleting ? "Delete" : "Archive"} Company`;

    this.loggerService.logAppTransaction({
      routine_name: "Customer Portal",
      function_name: operationName,
      user_id: this.dataStore.currentUser["user_id"],
      customer_id: this.dataStore.currentCustomer["customer_id"],
      operation_name: operationName,
      operation_status: status,
      operation_status_desc: this.selectedCompanies
        .map((company) => company["company_name"])
        .join(", "),
      transaction_level: transaction_level,
    });
  }
}
