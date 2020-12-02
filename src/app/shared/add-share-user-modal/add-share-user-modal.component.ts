import { Component, OnInit, ElementRef, ViewChild } from "@angular/core";
import { AuthApi } from "app/providers/auth.api.service";
import { NgxSpinnerService } from "ngx-spinner";
import { UserInfoApi } from "app/customer-portal/system-settings/user-setup/user-setup.api.service";
import { CompaniesApi } from "app/customer-portal/my-companies/my-companies.api.service";
import { ViewCompanyApi } from "app/customer-portal/view-company/view-company.api.service";
import { ContactApi } from "app/customer-portal/view-company/company-employees/company-employees.component.api.service";
import { NotificationsService } from "angular2-notifications";
import * as uuid from "uuid/v1";
import { ProjectSharingApi } from "app/customer-portal/view-project/project-sharing/project-sharing.api.service";
import { DataStore } from "app/providers/datastore";

@Component({
  selector: "add-share-user-modal",
  templateUrl: "./add-share-user-modal.component.html",
  styleUrls: ["./add-share-user-modal.component.scss"],
  providers: [UserInfoApi, ProjectSharingApi, CompaniesApi, ViewCompanyApi],
})
export class AddShareUserModalComponent implements OnInit {
  @ViewChild("addShareUserModal", { static: true })
  addShareUserModal: ElementRef;

  projectIds = [];
  parent = null;

  email = "";
  firstName = "";
  lastName = "";
  companyName = "";
  phone = "";
  shareType = "";

  inputEmailStatus: EInputEmailStatus;
  EInputEmailStatus = EInputEmailStatus;

  userId = null;
  companyId = null;
  timer = null;

  contacts = [];
  companies = [];

  shareTypes = [
    {
      name: "Admin",
      value: "admin",
    },
    {
      name: "Collaborator",
      value: "collaborator",
    },
    {
      name: "Observer",
      value: "observer",
    },
    {
      name: "None",
      value: "none",
    },
  ];

  constructor(
    private authApi: AuthApi,
    private userApi: UserInfoApi,
    private companyApi: CompaniesApi,
    private contactApi: ContactApi,
    private viewCompanyApi: ViewCompanyApi,
    private spinner: NgxSpinnerService,
    private notificationService: NotificationsService,
    private projectSharingApi: ProjectSharingApi,
    public dataStore: DataStore
  ) {}

  ngOnInit() {}

  initialize(projectIds: any, parent: any) {
    this.projectIds = projectIds;
    this.parent = parent;

    this.spinner.show();

    Promise.all([
      this.companyApi.findCompaniesByCustomerId(
        this.dataStore.currentUser.customer_id,
        this.dataStore.currentCustomer["customer_timezone"] || "eastern"
      ),
      this.viewCompanyApi.findCompanyContact(
        this.dataStore.currentUser.customer_id,
        "",
        this.dataStore.currentCustomer["customer_timezone"] || "eastern"
      ),
    ]).then(([companies, contacts]) => {
      this.spinner.hide();

      this.companies = companies;
      this.contacts = contacts;
    });

    this.addShareUserModal.nativeElement.style.display = "block";
  }

  createSharedProject() {
    debugger;
    this.spinner.show();
    let requests: Promise<any>[] = [];

    if (!this.userId || !this.companyId) {
      const inputDomain = this.email.split("@")[1];
      console.log(
        "matched contactd",
        this.contacts.find((contact) => contact.contact_email === this.email)
      );
      console.log(
        "matched company",
        this.companies.find((company) => company.company_domain === inputDomain)
      );
      console.log("input email status", this.inputEmailStatus);
      this.notificationService.error("Error", "Wrong data is provided", {
        timeOut: 3000,
        showProgressBar: false,
      });
      return;
    }

    if (this.projectIds.length > 0) {
      this.projectIds.forEach((project) => {
        const params = {
          project_id: project,
          share_user_id: this.userId,
          share_company_id: this.companyId,
          share_source_company_id: this.dataStore.currentUser.customer_id,
          share_source_user_id: this.dataStore.currentUser.user_id,
          share_type: this.shareType,
        };
        Object.keys(params)
          .filter((key) => !params[key])
          .forEach((key) => delete params[key]);

        requests.push(this.projectSharingApi.createSharedProject(params));
      });
    }

    Promise.all(requests)
      .then((res) => {
        this.spinner.hide();
        this.notificationService.success(
          "Success",
          "Share user has been created",
          { timeOut: 3000, showProgressBar: false }
        );

        this.reset();
        this.addShareUserModal.nativeElement.style.display = "none";
        this.parent.onRefresh();
      })
      .catch((err) => {
        this.spinner.hide();
        this.notificationService.error("Error", err, {
          timeOut: 3000,
          showProgressBar: false,
        });
      });
  }

  onEmailChange(event: any) {
    if (this.timer) {
      clearTimeout(this.timer);
    }

    this.timer = setTimeout(() => {
      this.spinner.show();

      // is email address existing user?
      const inputDomain = this.email.split("@")[1];

      this.authApi
        .getUser(this.email)
        .then((user: any) => {
          // user already exists
          this.firstName = user.user_firstname;
          this.lastName = user.user_lastname;
          this.companyName = user.customer_name;
          this.phone = user.user_phone;

          this.userId = user.user_id;
          this.companyId = user.customer_id;
          return EInputEmailStatus.ExistingUser;
        })
        .catch(() => {
          return null;
        })
        .then((res) => {
          if (res === null) {
            // check if email match logged in customer domain
            if (
              inputDomain === this.dataStore.currentCustomer.customer_domain
            ) {
              this.companyName = this.dataStore.currentUser.customer_name;
              this.companyId = this.dataStore.currentUser.customer_id;
              return EInputEmailStatus.MatchedWithCustomerDomain;
            }
            return null;
          } else {
            return res;
          }
        })
        .then((res) => {
          if (res === null) {
            // check if email match existing contact associated with this customer
            const matchedContact = this.contacts.find(
              (contact) => contact.contact_email === this.email
            );
            if (matchedContact) {
              this.firstName = matchedContact.contact_firstname;
              this.lastName = matchedContact.contact_lastname;
              this.phone = matchedContact.contact_phone;
              this.companyName = matchedContact.company_name;

              this.userId = matchedContact.contact_id;
              this.companyId = matchedContact.company_id;
              return EInputEmailStatus.MatchedWithExistingContact;
            }
            return null;
          } else {
            return res;
          }
        })
        .then((res) => {
          if (res === null) {
            // check if email domain match exisitng company
            const matchedCompany = this.companies.find(
              (company) => company.company_domain === inputDomain
            );
            if (matchedCompany) {
              this.firstName = "";
              this.lastName = "";
              this.phone = "";
              this.companyName = matchedCompany.company_name;

              this.companyId = matchedCompany.company_id;
              this.userId = null;
              return EInputEmailStatus.MatchedWithExistingCompany;
            } else {
              this.firstName = "";
              this.lastName = "";
              this.phone = "";
              this.companyName = "";

              this.companyId = null;
              this.userId = null;
              return EInputEmailStatus.None;
            }
          } else {
            return res;
          }
        })
        .then((res) => {
          this.inputEmailStatus = res;
          this.spinner.hide();
        });
    }, 1500);
  }

  onSaveShareUser() {
    const inputDomain = this.email.split("@")[1];

    switch (this.inputEmailStatus) {
      case EInputEmailStatus.ExistingUser:
      case EInputEmailStatus.MatchedWithExistingContact:
        this.createSharedProject();
        break;

      case EInputEmailStatus.MatchedWithCustomerDomain:
        // create new user
        this.userId = uuid();
        this.userApi
          .createUser({
            user_id: this.userId,
            user_email: this.email,
            user_firstname: this.firstName,
            user_lastname: this.lastName,
            user_phone: this.phone,
            user_role: "submitter",
            customer_id: this.dataStore.currentUser.customer_id,
            user_password: "",
          })
          .then((res) => {
            // create shared project
            this.createSharedProject();
          })
          .catch((err) => {
            this.notificationService.error("Error", err, {
              timeOut: 3000,
              showProgressBar: false,
            });
          });
        break;

      case EInputEmailStatus.MatchedWithExistingCompany:
        this.contactApi
          .createContact({
            customer_id: this.dataStore.currentUser.customer_id,
            company_id: this.companyId,
            company_name: this.companyName,
            contact_email: this.email,
            contact_firstname: this.firstName,
            contact_lastname: this.lastName,
            contact_phone: this.phone,
          })
          .then((res: any) => {
            this.userId = res.data.contact_id;
            return this.createSharedProject();
          })
          .catch((err) => {
            this.notificationService.error("Error", err, {
              timeOut: 3000,
              showProgressBar: false,
            });
          });
        break;

      case EInputEmailStatus.None:
        this.companyId = uuid();

        this.companyApi
          .createCompany({
            company_id: this.companyId,
            company_domain: inputDomain,
            company_name: this.companyName,
            user_id: this.dataStore.currentUser.user_id,
            customer_id: this.dataStore.currentUser.customer_id,
          })
          .then((res: any) => {
            this.companyId = res.company_id;

            this.contactApi
              .createContact({
                customer_id: this.dataStore.currentUser.customer_id,
                company_id: this.companyId,
                company_name: this.companyName,
                contact_email: this.email,
                contact_firstname: this.firstName,
                contact_lastname: this.lastName,
                contact_phone: this.phone,
              })
              .then((res: any) => {
                this.userId = res.data.contact_id;
                this.createSharedProject();
              });
          })
          .catch((err) => {
            this.notificationService.error("Error", err, {
              timeOut: 3000,
              showProgressBar: false,
            });
          });
        break;
    }

    this.parent.onRefresh();
  }

  onCancel(event) {
    event.preventDefault();

    this.reset();
    this.addShareUserModal.nativeElement.style.display = "none";
  }

  reset() {
    this.email = "";
    this.firstName = "";
    this.lastName = "";
    this.companyName = "";
    this.phone = "";
    this.userId = null;
    this.companyId = null;
    this.projectIds = [];
  }
}

enum EInputEmailStatus {
  ExistingUser,
  MatchedWithCustomerDomain,
  MatchedWithExistingContact,
  MatchedWithExistingCompany,
  None,
}
