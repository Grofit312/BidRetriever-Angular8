import { Component, OnInit, ElementRef, ViewChild } from "@angular/core";
import { AuthApi } from "app/providers/auth.api.service";
import { NgxSpinnerService } from "ngx-spinner";
import { UserInfoApi } from "app/customer-portal/system-settings/user-setup/user-setup.api.service";
import { NotificationsService } from "angular2-notifications";
import * as uuid from "uuid/v1";
import { ContactApi } from "app/customer-portal/view-company/company-employees/company-employees.component.api.service";

@Component({
  selector: "add-contact-modal",
  templateUrl: "./add-contact-modal.component.html",
  styleUrls: ["./add-contact-modal.component.scss"],
  providers: [ContactApi],
})
export class AddContactModalComponent implements OnInit {
  @ViewChild("addContactModal", { static: true }) addContactModal: ElementRef;

  parent = null;
  email = "";
  firstName = "";
  lastName = "";

  mobilePhone = "";
  phone = "";
  contact_title = "";
  contact_address1 = "";
  contact_address2 = "";
  contact_city = "";
  contact_state = "";
  contact_zip = "";

  contactId: any;
  company_id: any;
  companyName = "";
  required = true;
  userId = "";

  timer = null;

  initialValues = null;

  constructor(
    private authApi: AuthApi,
    private contactApi: ContactApi,
    private spinner: NgxSpinnerService,
    private notificationService: NotificationsService
  ) {}

  ngOnInit() {}

  initialize(parent: any, initialValues?: any) {
    this.parent = parent;

    if (initialValues) {
      this.initialValues = initialValues;
    } else {
      this.initialValues = null;
    }
    this.setInitialValues();

    this.addContactModal.nativeElement.style.display = "block";
  }

  onSaveContact() {
    if (this.contactId === null) {
      this.contactId = uuid();
    }

    this.spinner.show();

    const params: any = {
      contact_id: this.contactId,
      company_id: this.parent.dataStore.currentCompany.company_id,
      company_name: this.parent.dataStore.currentCompany.company_name,
      contact_email: this.email,
      contact_firstname: this.firstName,
      contact_lastname: this.lastName,
      contact_mobile_phone: this.mobilePhone,
      contact_display_name: `${this.firstName} ${this.lastName}`,
      customer_id: this.parent.dataStore.currentCompany.customer_id,
      contact_phone: this.phone,
      contact_title: this.contact_title,
      contact_address1: this.contact_address1,
      contact_address2: this.contact_address2,
      contact_city: this.contact_city,
      contact_state: this.contact_state,
      contact_zip: this.contact_zip,
    };

    if (this.initialValues) {
      params.search_contact_id = this.contactId;
      this.contactApi
        .updateContact(params)
        .then((_) => {
          this.parent.toolbarRefreshGridAction();

          this.spinner.hide();
          this.reset();
          this.addContactModal.nativeElement.style.display = "none";
        })
        .catch((err) => {
          this.spinner.hide();
          this.notificationService.error("Error", "Failed to update user", {
            timeOut: 3000,
            showProgressBar: false,
          });
        });
    } else {
      this.contactApi
        .createContact(params)
        .then((_) => {
          this.parent.toolbarRefreshGridAction();

          this.spinner.hide();
          this.reset();
          this.addContactModal.nativeElement.style.display = "none";
        })
        .catch((err) => {
          this.spinner.hide();
          this.notificationService.error("Error", "Failed to create user", {
            timeOut: 3000,
            showProgressBar: false,
          });
        });
    }
  }

  onCancel(event) {
    event.preventDefault();

    this.reset();
    this.addContactModal.nativeElement.style.display = "none";
  }

  setInitialValues() {
    const company = this.parent.dataStore.currentCompany;
    this.company_id = company.company_id;
    this.companyName = company.company_name;

    this.contactId = this.initialValues ? this.initialValues.contact_id : null;
    this.email = this.initialValues ? this.initialValues.contact_email : "";
    this.firstName = this.initialValues
      ? this.initialValues.contact_firstname
      : "";
    this.lastName = this.initialValues
      ? this.initialValues.contact_lastname
      : "";
    this.mobilePhone = this.initialValues
      ? this.initialValues.contact_mobile_phone
      : "";
    this.phone = this.initialValues ? this.initialValues.contact_phone : "";
    this.contact_title = this.initialValues
      ? this.initialValues.contact_title
      : "";
    this.contact_address1 = this.initialValues
      ? this.initialValues.contact_address1
      : company.company_address1;
    this.contact_address2 = this.initialValues
      ? this.initialValues.contact_address2
      : company.company_address2;
    this.contact_city = this.initialValues
      ? this.initialValues.contact_city
      : company.company_city;
    this.contact_state = this.initialValues
      ? this.initialValues.contact_state
      : company.company_state;
    this.contact_zip = this.initialValues
      ? this.initialValues.contact_zip
      : company.company_zip;
  }

  reset() {
    this.email = "";
    this.firstName = "";
    this.lastName = "";
    this.mobilePhone = "";
    this.companyName = "";
    this.required = true;
    this.userId = "";
    this.phone = "";
    this.contact_title = "";
    this.contact_address1 = "";
    this.contact_address2 = "";
    this.contact_city = "";
    this.contact_state = "";
    this.contact_zip = "";
  }
}
