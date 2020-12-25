import {
  Component,
  OnInit,
  ViewEncapsulation,
  HostListener,
  ElementRef,
  AfterViewInit,
  ViewChild,
} from "@angular/core";
import { CompaniesApi } from "./my-companies.api.service";
import { DataStore } from "app/providers/datastore";

import { NotificationsService } from "angular2-notifications";
import { ValidationService } from "app/providers/validation.service";
import { RowNode } from "ag-grid-community/dist/lib/entities/rowNode";
import { GridApi } from "ag-grid-community/dist/lib/gridApi";
import { AuthApi } from "app/providers/auth.api.service";
import { CompanyOfficeApi } from "../system-settings/company-office-setup/company-office-setup.api.service";
import { UserInfoApi } from "../system-settings/user-setup/user-setup.api.service";
import { Logger } from "app/providers/logger.service";
import {
  DxDataGridComponent,
  DxToolbarComponent,
  DxSelectBoxComponent,
} from "devextreme-angular";
import CustomStore from "devextreme/data/custom_store";
import DataSource from "devextreme/data/data_source";
import { DxiItemComponent } from "devextreme-angular/ui/nested/item-dxi";
import Swal from "sweetalert2";
import { printArray } from "app/utils/print";

const moment = require("moment-timezone");
declare var jQuery: any;

class DatePicker {
  eInput;

  init(params) {
    // create the cell
    this.eInput = document.createElement("input");

    jQuery(this.eInput).datetimepicker({
      format: "yyyy-mm-ddThh:ii:ss",
      initialDate: new Date(),
      fontAwesome: true,
    });
  }

  getGui() {
    return this.eInput;
  }

  afterGuiAttached() {
    this.eInput.focus();
    this.eInput.select();
  }

  getValue() {
    return this.eInput.value;
  }

  isPopup() {
    return false;
  }
}

@Component({
  selector: "app-my-companies",
  templateUrl: "./my-companies.component.html",
  styleUrls: ["./my-companies.component.scss"],
  encapsulation: ViewEncapsulation.None,
  providers: [CompaniesApi, CompanyOfficeApi, UserInfoApi],
})
export class MyCompaniesComponent implements OnInit, AfterViewInit {
  @ViewChild("companyContent", { static: false }) companyContent: ElementRef;

  @ViewChild("companyGrid", { static: false }) companyGrid: DxDataGridComponent;
  @ViewChild("companyToolbar", { static: false })
  companyToolbar: DxToolbarComponent;

  @ViewChild("companyToolbarViewType", { static: false })
  companyToolbarViewType: DxSelectBoxComponent;

  private PROJECT_TOOLBAR_INITIAL_VIEW =
    "BidRetriever_Company_Page_Toolbar_Initial_View";
  currentEmail: any;
  companyGridColumns: any[];
  companyGridDataSource: any;
  companyGridContent = [];
  companyGridContentLoaded = false;

  companyViewTypeSelected = null;

  companyGridEditorTemplateSource: any;

  @ViewChild("grid", { static: false }) grid;
  @ViewChild("addSubmissionModal", { static: false }) addSubmissionModal;
  @ViewChild("addCompanyModal", { static: false }) addCompanyModal;
  @ViewChild("editCompanyModal", { static: false }) editCompanyModal;
  @ViewChild("removeCompanyModal", { static: false }) removeCompanyModal;
  @ViewChild("transactionLogsModal", { static: false }) transactionLogsModal;

  companyViewMode = "my";
  searchText = "";
  currentOffice = null;

  toolbarConfig: any = {};
  toolbarUsersSelectBox: any = null;
  toolbarUsersContent = [];

  // Modal Flags
  isCompanyDataViewModalShown = false;

  selectedUserId = null;
  selectedCustomerId = null;

  get isBidRetrieverAdmin() {
    return this.dataStore.originUserEmail.includes("bidretriever.net");
  }
  get isSysAdmin() {
    return this.dataStore.originUserRole === "sys admin";
  }

  constructor(
    public dataStore: DataStore,
    private apiService: CompaniesApi,
    private notificationService: NotificationsService,
    private validationService: ValidationService,
    private authApiService: AuthApi,
    private officeApiService: CompanyOfficeApi,
    private userInfoApiService: UserInfoApi,
    private logger: Logger
  ) {
    this.toolbarConfig = {
      companyViewType: {
        width: 250,
        dataSource: new DataSource({
          store: new CustomStore({
            key: "view_id",
            loadMode: "raw",
            load: (loadOptions) =>
              this.toolbarCompanyViewTypeLoadAction(loadOptions),
          }),
        }),
        showClearButton: true,
        valueExpr: "view_id",
        displayExpr: "view_name",
        onValueChanged: (event) => {
          if (event.value === "manage_company_views") {
            this.companyToolbarViewType.value = event.previousValue;
            this.companyViewTypeSelected = event.previousValue;
            this.isCompanyDataViewModalShown = true;
            return;
          }

          if (this.companyViewTypeSelected !== event.value) {
            this.companyViewTypeSelected = event.value;
            localStorage.setItem(
              this.PROJECT_TOOLBAR_INITIAL_VIEW,
              this.companyViewTypeSelected == null
                ? ""
                : this.companyViewTypeSelected
            );
            this.toolbarRefreshGridAction();
          }
        },
      },
      users: {
        width: 250,
        dataSource: new DataSource({
          store: new CustomStore({
            key: "user_email",
            loadMode: "raw",
            load: (loadOptions) => this.toolbarUsersLoadAction(loadOptions),
          }),
        }),
        showClearButton: false,
        valueExpr: "user_email",
        displayExpr: "user_displayname",
        searchEnabled: true,
        searchTimeout: 200,
        searchMode: "contains",
        searchExpr: "user_email",
        onValueChanged: (event: any) => {
          this.onChangeUser(event.value);
        },
        onInitialized: (args: any) => {
          this.toolbarUsersSelectBox = args.component;
          if (this.dataStore.originUserEmail) {
            this.toolbarUsersSelectBox
              .getDataSource()
              .load()
              .done((data) => {
                console.log("Users Data Loaded onInitialized");
              });
          }
        },
      },

      search: {
        placeholder: "Search",
        width: 200,
        valueChangeEvent: "keyup",
        onValueChanged: (event) => this.toolbarSearchAction(event),
      },

      viewCompany: {
        type: "normal",
        text: "View Company",
        onClick: () => this.toolbarViewCompanyAction(),
      },
      addCompany: {
        type: "normal",
        text: "Add Company",
        onClick: () => this.toolbarAddCompanyAction(),
      },

      others: {
        viewCompany: {
          type: "normal",
          text: "View Company",
          onClick: () => this.toolbarViewCompanyAction(),
        },
        addCompany: {
          type: "normal",
          text: "Add Company",
          onClick: () => this.toolbarAddCompanyAction(),
        },
        viewCompanyDocuments: {
          type: "normal",
          text: "View Company Documents",
          onClick: () => this.toolbarViewCompanyDocumentsAction(),
        },
        editCompany: {
          type: "normal",
          text: "Edit Company",
          onClick: () => this.toolbarEditCompanyAction(),
        },
        deleteCompany: {
          type: "normal",
          text: "Delete Company",
          onClick: () => this.toolbarDeleteCompanyAction(),
        },
        archiveCompany: {
          type: "normal",
          text: "Archive Company",
          onClick: () => this.toolbarArchiveCompanyAction(),
        },
        addDocumentsToCompany: {
          type: "normal",
          text: "Add Documents To Company",
          onClick: () => this.toolbarAddDocumentsToCompanyAction(),
        },
        viewPublishedCompany: {
          type: "normal",
          text: "View Published Company",
          onClick: () => this.toolbarViewPublishedCompanyAction(),
        },
        printCompanyList: {
          type: "normal",
          text: "Print Company List",
          onClick: () => this.toolbarPrintCompanyListAction(),
        },
        exportCompanyListToCsv: {
          type: "normal",
          text: "Export Company List  To CSV",
          onClick: () => this.toolbarExportCompanyListToCsvAction(),
        },
        viewTransactionLog: {
          type: "normal",
          text: "View Transaction Log",
          onClick: () => this.toolbarViewTransactionLogAction(),
        },
        refreshGrid: {
          type: "normal",
          text: "Refresh Grid",
          onClick: () => this.toolbarRefreshGridAction(),
        },
        help: {
          type: "normal",
          text: "Help",
          onClick: () => this.toolbarHelpAction(),
        },
      },
    };

    this.companyGridDataSource = new CustomStore({
      key: "company_id",
      load: (loadOptions) => this.gridCompanyLoadAction(loadOptions),
      update: (key, values) => this.gridCompanyUpdateAction(key, values),
    });

    this.companyGridEditorTemplateSource = {
      company_type: [
        { id: "Architect/Engineer", name: "Architect/Engineer" },
        { id: "General Contractor", name: "General Contractor" },
        { id: "Owner", name: "Owner" },
        { id: "Product Manufacturer", name: "Product Manufacturer" },
        { id: "Subcontractor", name: "Subcontractor" },
        { id: "Supplier", name: "Supplier" },
        { id: "Other", name: "Other" },
      ],
      status: [
        { id: "active", name: "active" },
        { id: "inactive", name: "inactive" },
        { id: "deleted", name: "deleted" },
        { id: "archived", name: "archived" },
      ],
      stage: [
        { id: "Prospect", name: "Prospect" },
        { id: "Lead", name: "Lead" },
        { id: "Opportunity", name: "Opportunity" },
        { id: "Proposal", name: "Proposal" },
        { id: "Bid", name: "Bid" },
        { id: "Awarded", name: "Awarded" },
        { id: "Contract", name: "Contract" },
        { id: "Completed", name: "Completed" },
        { id: "Not Interested", name: "Not Interested" },
        { id: "Lost", name: "Lost" },
      ],
      autoUpdateStatus: [
        { id: "active", name: "active" },
        { id: "inactive", name: "inactive" },
      ],
      timezone: [
        { id: "eastern", name: "eastern" },
        { id: "central", name: "central" },
        { id: "mountain", name: "mountain" },
        { id: "pacific", name: "pacific" },
      ],
      contractType: [
        { id: "GMP Bid", name: "GMP Bid" },
        { id: "Negotiated", name: "Negotiated" },
        { id: "Design Build", name: "Design Build" },
        { id: "Time and Materials", name: "Time and Materials" },
      ],
      segment: [
        { id: "Commercial", name: "Commercial" },
        { id: "Industrial", name: "Industrial" },
        { id: "Heavy Highway", name: "Heavy Highway" },
        { id: "Residential", name: "Residential" },
      ],
      buildingType: [
        { id: "Healthcare", name: "Healthcare" },
        { id: "Government", name: "Government" },
        { id: "Retail", name: "Retail" },
        { id: "Residential", name: "Residential" },
      ],
      laborRequirement: [
        { id: "union", name: "union" },
        { id: "open shop", name: "open shop" },
        { id: "prevailing wage", name: "prevailing wage" },
      ],
      constructionType: [
        { id: "new construction", name: "new construction" },
        { id: "remodel", name: "remodel" },
        { id: "tenant improvements", name: "tenant improvements" },
      ],
      awardStatus: [
        { id: "Preparing Proposal", name: "Preparing Proposal" },
        { id: "Bid Submitted", name: "Bid Submitted" },
        { id: "Awarded", name: "Awarded" },
        { id: "Lost", name: "Lost" },
        { id: "Suspended Bid", name: "Suspended Bid" },
      ],
    };
  }

  ngOnInit() {
    if (this.dataStore.currentUser) {
      this.load();
    } else {
      this.dataStore.authenticationState.subscribe((value) => {
        if (value) {
          this.load();
        }
      });
    }
  }

  ngAfterViewInit() {
    setTimeout(() => this.onWindowResize(null), 500);

    if (this.companyGrid && this.companyGrid.instance) {
      this.companyGrid.instance.columnOption(
        "command:select",
        "allowFixing",
        true
      );
    }
  }

  @HostListener("window:resize", ["$event"])
  onWindowResize(event) {
    if (!this.companyContent) {
      return;
    }

    this.companyGrid.height = `${this.companyContent.nativeElement.offsetHeight}px`;
  }

  findMatchedCompanyAdminUserDisplayName(email: string) {
    if (
      !this.companyGridEditorTemplateSource ||
      !this.companyGridEditorTemplateSource.adminUserEmail
    ) {
      return "";
    }

    const matchedUser = this.companyGridEditorTemplateSource.adminUserEmail.find(
      (user) => user.user_email === email
    );
    if (matchedUser) {
      return matchedUser.user_displayname;
    }
    return "";
  }

  load() {
    this.loadAllUsers();
    this.loadCurrentOffice();

    const initialDataViewSelected = localStorage.getItem(
      this.PROJECT_TOOLBAR_INITIAL_VIEW
    );
    if (initialDataViewSelected) {
      this.companyViewTypeSelected = initialDataViewSelected;

      if (
        this.companyToolbarViewType &&
        this.companyToolbarViewType.instance &&
        this.companyViewTypeSelected
      ) {
        this.companyToolbarViewType.instance
          .getDataSource()
          .reload()
          .then((data) => {
            if (this.companyToolbar.instance) {
              this.companyToolbar.instance.repaint();
            }
          });
      }
    }

    if (this.companyGrid && this.companyGrid.instance) {
      this.companyGrid.instance
        .refresh()
        .then(() => {})
        .catch((error) => {
          console.log("Grid Refresh Error", error);
        });
    }

    this.onWindowResize(null);

    this.logger.logActivity({
      activity_level: "summary",
      activity_name: "Company Dashboard",
      application_name: "Customer Portal",
      customer_id: this.dataStore.currentUser.customer_id,
      user_id: this.dataStore.currentUser.user_id,
    });
  }

  loadAllUsers() {
    this.selectedUserId = this.dataStore.currentUser.user_id;
    this.selectedCustomerId = this.dataStore.currentCustomer.customer_id;
    this.toolbarConfig.users.value = this.dataStore.currentUser.user_email;
    if (this.toolbarUsersSelectBox) {
      this.toolbarUsersSelectBox
        .getDataSource()
        .load()
        .done((data) => {
          console.log("Users Data was loaded on Repaint");
          if (this.companyToolbar.instance) {
            this.companyToolbar.instance.repaint();
          }
        });
    }
  }

  loadCurrentOffice() {
    this.userInfoApiService
      .findUsers(this.dataStore.currentUser["customer_id"])
      .then((users: any[]) => {
        const emails = users
          .filter(({ status }) => status === "active")
          .map((user) => {
            if (!user.user_displayname) {
              user.user_displayname = `${user.user_lastname}, ${user.user_firstname}`;
            }
            return user;
          });
        this.companyGridEditorTemplateSource.adminUserEmail = emails.sort(
          (firstUser, secondUser) => {
            const firstUserEmail = firstUser.user_email
              ? firstUser.user_email.toLowerCase()
              : "";
            const secondUserEmail = secondUser.user_email
              ? secondUser.user_email.toLowerCase()
              : "";
            return firstUserEmail.localeCompare(secondUserEmail);
          }
        );

        return new Promise((resolve) => resolve(null));
      })
      .then((res) => {
        if (this.dataStore.currentUser["customer_office_id"]) {
          this.officeApiService
            .getOffice(this.dataStore.currentUser["customer_office_id"])
            .then((office) => {
              this.currentOffice = office;
            })
            .catch((err) => {
              this.notificationService.error("Error", err, {
                timeOut: 3000,
                showProgressBar: false,
              });
            });
        }
        if (this.dataStore.currentUser["customer_id"]) {
          this.officeApiService
            .findOffices(this.dataStore.currentUser["customer_id"])
            .then((offices) => {
              this.companyGridEditorTemplateSource.assignedOfficeName = offices;
            })
            .catch((err) => {
              this.notificationService.error("Error", err, {
                timeOut: 3000,
                showProgressBar: false,
              });
            });
        }
      })
      .catch((err) => {
        this.notificationService.error("Error", err, {
          timeOut: 3000,
          showProgressBar: false,
        });
      });
  }

  /* Switch Company View Mode */
  onChangeCompanyViewMode() {
    this.toolbarRefreshGridAction();
  }

  /* Switch User */
  onChangeUser(changedEmail) {
    this.searchText = "";

    if (changedEmail === "all-users") {
      this.selectedUserId = changedEmail;
      this.selectedCustomerId = null;
      this.toolbarRefreshGridAction();
      return;
    }

    this.currentOffice = null;

    this.authApiService
      .getUser(changedEmail)
      .then((res: any) => {
        this.dataStore.currentUser = res;
        this.selectedUserId = res.user_id;

        if (res["customer_id"]) {
          return this.authApiService.getCustomer(res["customer_id"]);
        } else {
          return new Promise((resolve) => resolve(null));
        }
      })
      .then((res: any) => {
        this.dataStore.currentCustomer = res;
        this.selectedCustomerId = res == null ? null : res.customer_id;

        this.toolbarRefreshGridAction();
        this.loadCurrentOffice();
      })
      .catch((err) => {
        this.notificationService.error("Error", err, {
          timeOut: 3000,
          showProgressBar: false,
        });
      });
  }

  /* Company Grid Actions */
  gridCompanyEditingStartAction(event) {
    this.currentEmail = event.data.company_email;

    if (!event.data.company_bid_datetime) {
      event.data.company_bid_datetime = null;
    }
    event.component.selectRows([event.data.company_id]);
  }

  private getGridCompanyContentByLoadOption(loadOptions) {
    let companies = this.companyGridContent;

    if (loadOptions.sort && loadOptions.sort.length > 0) {
      companies = companies.sort((first, second) => {
        const sortColumnOption = this.companyGridColumns.find(
          (column) => column.dataField === loadOptions.sort[0].selector
        );

        let firstValue = first[loadOptions.sort[0].selector];
        let secondValue = second[loadOptions.sort[0].selector];
        if (
          sortColumnOption.dataType === "date" ||
          sortColumnOption.dataType === "datetime"
        ) {
          firstValue = new Date(firstValue).getTime();
          secondValue = new Date(secondValue).getTime();
        }
        firstValue = firstValue.toString().toLowerCase();
        secondValue = secondValue.toString().toLowerCase();

        let loadOptionIndex = 0;
        while (loadOptionIndex < loadOptions.sort.length) {
          if (
            firstValue > secondValue &&
            loadOptions.sort[loadOptionIndex].desc
          ) {
            return -1;
          }
          if (
            firstValue < secondValue &&
            !loadOptions.sort[loadOptionIndex].desc
          ) {
            return -1;
          }
          if (firstValue === secondValue) {
            loadOptionIndex++;
            continue;
          }
          return 1;
        }
        return 1;
      });
    }

    if (this.searchText) {
      companies = companies.filter((company) => {
        const isMatched = Object.keys(company)
          .map((key) => company[key])
          .some((item) =>
            item.toString().toLowerCase().includes(this.searchText)
          );
        return isMatched;
      });
    }

    return companies;
  }

  gridCompanyLoadAction(loadOptions) {
    return new Promise((resolve, reject) => {
      if (this.companyGridContentLoaded) {
        const filteredCompanies = this.getGridCompanyContentByLoadOption(
          loadOptions
        );
        return resolve({
          data: filteredCompanies,
          totalCount: filteredCompanies.length,
        });
      }

      if (!this.dataStore.currentUser || !this.dataStore.currentCustomer) {
        this.companyGridContent = [];
        this.companyGridContentLoaded = false;

        const filteredCompanies = this.getGridCompanyContentByLoadOption(
          loadOptions
        );
        return resolve({
          data: filteredCompanies,
          totalCount: filteredCompanies.length,
        });
      }

      if (this.selectedUserId == null) {
        return resolve({
          data: [],
          totalCount: 0,
        });
      }

      const findCompanies =
        this.selectedUserId === "all-users"
          ? this.apiService.findCompaniesByCustomerId(
              this.dataStore.currentUser["customer_id"],
              this.dataStore.currentCustomer["customer_timezone"] || "eastern",
              this.companyViewTypeSelected
            )
          : this.apiService.findCompaniesByUserId(
              this.selectedUserId,
              this.selectedCustomerId,
              this.dataStore.currentCustomer["customer_timezone"] || "eastern",
              this.companyViewTypeSelected
            );

      const findDataViewFieldSettings = this.apiService.findDataViewFieldSettings(
        this.companyViewTypeSelected
      );
      const currentOfficeId = this.dataStore.currentUser["customer_office_id"];

      Promise.all([findCompanies, findDataViewFieldSettings])
        .then(([companies, dataViewFieldSettings]) => {
          this.companyGridContent = companies as any[];
          this.companyGridContentLoaded = true;

          if (!this.companyViewTypeSelected) {
            this.companyGridColumns = [
              {
                dataField: "company_id",
                dataType: "number",
                caption: "Company Id",
                width: 250,
                visible: false,
                allowEditing: false,
              },
              {
                dataField: "company_name",
                caption: "Company Name",
                width: 400,
                minWidth: 250,
                allowEditing: false,
              },
              {
                dataField: "company_city_state",
                caption: "State/City",
                width: 150,
                minWidth: 100,
                allowEditing: false,
              },
              {
                dataField: "company_domain",
                caption: "Company Domain",
                width: 200,
                minWidth: 100,
                allowEditing: true,
              },
              {
                dataField: "company_phone",
                caption: "Company Phone",
                width: 150,
                minWidth: 100,
                allowEditing: true,
              },
              {
                dataField: "company_email",
                caption: "Company email",
                width: 200,
                minWidth: 100,
                allowEditing: true,
              },
              {
                dataField: "company_type",
                caption: "Company Type",
                width: 150,
                minWidth: 100,
                allowEditing: true,
                editCellTemplate: "typeEditor",
              },
              {
                dataField: "company_admin_displayname",
                caption: "Company Admin",
                width: 150,
                minWidth: 100,
                allowEditing: false,
                cellTemplate: "companyAdminUserEmailCell",
                editCellTemplate: "companyAdminUserEmailEditor",
              },
              {
                dataField: "company_employee_number",
                caption: "Number of Employees",
                width: 250,
                minWidth: 100,
                allowEditing: true,
              },
              {
                dataField: "company_record_source",
                caption: "Record Source",
                width: 150,
                minWidth: 100,
                allowEditing: true,
              },
              {
                dataField: "company_address1",
                caption: "Company Address 1",
                width: 150,
                minWidth: 100,
                allowEditing: true,
              },
              {
                dataField: "company_address2",
                caption: "Company Address 2",
                width: 150,
                minWidth: 100,
                allowEditing: true,
              },
              {
                dataField: "company_revenue",
                caption: "Company Revenue",
                width: 150,
                minWidth: 100,
                allowEditing: true,
              },
              {
                dataField: "company_timezone",
                caption: "Company Timezone",
                width: 150,
                minWidth: 100,
                allowEditing: false,
              },
              {
                dataField: "company_website",
                caption: "Company Website",
                width: 150,
                minWidth: 100,
                allowEditing: false,
              },
              {
                dataField: "company_zip",
                caption: "Company Zipcode",
                width: 150,
                minWidth: 100,
                allowEditing: false,
              },
              // { dataField: 'company_assigned_office_name', caption: 'Office', width: 150, minWidth: 100, editCellTemplate: 'companyAssignedOfficeNameEditor', allowEditing: true },
              // { dataField: 'auto_update_status', caption: 'Automatic Updates', width: 180, minWidth: 150, allowEditing: true, editCellTemplate: 'autoUpdateStatusEditor' },
              {
                dataField: "create_datetime",
                caption: "Create Date",
                width: 180,
                minWidth: 150,
                dataType: "datetime",
                cellTemplate: "dateCell",
                allowEditing: false,
              },
              {
                dataField: "last_change_date",
                caption: "Last Change Date",
                width: 180,
                minWidth: 150,
                dataType: "datetime",
                cellTemplate: "dateCell",
                allowEditing: false,
              },
              {
                dataField: "status",
                caption: "Status",
                width: 100,
                minWidth: 100,
                allowEditing: false,
                editCellTemplate: "statusEditor",
              },
              // { dataField: 'company_notes', caption: 'Notes', minWidth: 100, allowEditing: true },
              // { dataField: 'company_process_status', caption: 'Processing Status', minWidth: 100, allowEditing: false },
              // { dataField: 'company_process_message', caption: 'Processing Message', minWidth: 100, allowEditing: false }
            ];
          } else {
            const newGridColumnList = [];
            const editingAllowedColumns = [
              "company_name",
              "company_email",
              "company_address1",
              "company_address2",
              "company_domain",
              "company_phone",
              "company_type",
              "company_employee_number",
              "company_admin_user_email",
              "company_bid_datetime",
              "auto_update_status",
              "company_notes",
              "company_stage",
              "company_timezone",
              "company_contract_type",
              "company_segment",
              "company_building_type",
              "company_labor_requirement",
              "company_value",
              "company_size",
              "company_construction_type",
              "company_award_status",
              "company_assigned_office_name",
              "company_number",
            ];
            (dataViewFieldSettings as any[]).forEach((viewFieldSetting) => {
              const newGridColumn = {
                dataField: viewFieldSetting.data_view_field_name,
                allowEditing: false,
              };
              if (viewFieldSetting.data_view_field_name.includes("datetime")) {
                newGridColumn["dataType"] = "date";
                newGridColumn["cellTemplate"] = "dateCell";
                newGridColumn["editCellTemplate"] = "dateTimeEditor";
              }
              if (viewFieldSetting.data_view_field_heading) {
                newGridColumn["caption"] =
                  viewFieldSetting.data_view_field_heading;
              }
              if (viewFieldSetting.data_view_field_width) {
                newGridColumn["width"] =
                  Number(viewFieldSetting.data_view_field_width) * 10 + 10;
              }
              if (viewFieldSetting.data_view_field_alignment) {
                newGridColumn["alignment"] =
                  viewFieldSetting.data_view_field_alignment;
              }
              if (viewFieldSetting.data_view_field_sequence) {
                newGridColumn["visibleIndex"] =
                  viewFieldSetting.data_view_field_sequence;
              }
              if (viewFieldSetting.data_view_field_sort) {
                newGridColumn[
                  "sortOrder"
                ] = viewFieldSetting.data_view_field_sort.toLowerCase();
              }
              if (viewFieldSetting.data_view_field_sort_sequence) {
                newGridColumn["sortIndex"] =
                  viewFieldSetting.data_view_field_sort_sequence;
              }
              if (viewFieldSetting.data_view_field_display) {
                newGridColumn["visible"] =
                  viewFieldSetting.data_view_field_display === "display";
              }

              if (
                editingAllowedColumns.includes(
                  viewFieldSetting.data_view_field_name
                )
              ) {
                newGridColumn["allowEditing"] = true;
              }

              switch (viewFieldSetting.data_view_field_name) {
                case "company_admin_user_email":
                  newGridColumn["cellTemplate"] = "companyAdminUserEmailCell";
                  newGridColumn["editCellTemplate"] =
                    "companyAdminUserEmailEditor";
                  break;
                case "company_assigned_office_name":
                  newGridColumn["editCellTemplate"] =
                    "companyAssignedOfficeNameEditor";
                  break;
                case "auto_update_status":
                  newGridColumn["editCellTemplate"] = "autoUpdateStatusEditor";
                  break;
                case "company_stage":
                  newGridColumn["editCellTemplate"] = "companyStageEditor";
                  break;
                case "company_timezone":
                  newGridColumn["editCellTemplate"] = "companyTimezoneEditor";
                  break;
                case "company_contract_type":
                  newGridColumn["editCellTemplate"] =
                    "companyContractTypeEditor";
                  break;
                case "company_segment":
                  newGridColumn["editCellTemplate"] = "companySegmentEditor";
                  break;
                case "company_building_type":
                  newGridColumn["editCellTemplate"] =
                    "companyBuildingTypeEditor";
                  break;
                case "company_labor_requirement":
                  newGridColumn["editCellTemplate"] =
                    "companyLaborRequirementEditor";
                  break;
                case "company_construction_type":
                  newGridColumn["editCellTemplate"] =
                    "companyConstructionTypeEditor";
                  break;
                case "company_award_status":
                  newGridColumn["editCellTemplate"] =
                    "companyAwardStatusEditor";
                  break;
              }

              newGridColumnList.push(newGridColumn);
            });

            this.companyGridColumns = newGridColumnList;
          }

          const filteredCompanies = this.getGridCompanyContentByLoadOption(
            loadOptions
          );

          return resolve({
            data: filteredCompanies,
            totalCount: filteredCompanies.length,
          });
        })
        .catch((error) => {
          console.log("Load Error", error);
          this.notificationService.error("Error", error, {
            timeOut: 3000,
            showProgressBar: false,
          });
          this.companyGridContent = [];
          this.companyGridContentLoaded = false;
          return resolve({
            data: this.companyGridContent,
            totalCount: this.companyGridContent.length,
          });
        });
    });
  }

  gridCompanyUpdateAction(key, values) {
    return new Promise((resolve, reject) => {
      try {
        const updateIndex = this.companyGridContent.findIndex(
          (company) => company.company_id === key
        );
        // return reject('Failed to update.');
        if ("company_name" in values) {
          const validCompanyName = this.validationService.validateCompanyName(
            values["company_name"]
          );
          if (validCompanyName.length === 0) {
            return reject("Company name cannot be empty.");
          } else {
            this.apiService
              .updateCompany(key, {
                company_name: validCompanyName,
                company_email: this.currentEmail,
                user_id: this.dataStore.currentUser["user_id"],
                customer_id: this.dataStore.currentUser["customer_id"],
              })
              .then((res) => {
                this.notificationService.success(
                  "Success",
                  "Company has been updated",
                  { timeOut: 3000, showProgressBar: false }
                );
                this.companyGridContent[updateIndex]["company_name"] =
                  values["company_name"];
                return resolve();
              })
              .catch((error) => {
                return reject("Failed to update.");
              });
          }
        } else if ("company_record_source" in values) {
          this.apiService
            .updateCompany(key, {
              company_name: values["company_record_source"],
              user_id: this.dataStore.currentUser["user_id"],
              customer_id: this.dataStore.currentUser["customer_id"],
            })
            .then((res) => {
              this.notificationService.success(
                "Success",
                "Company Record Source has been updated",
                { timeOut: 3000, showProgressBar: false }
              );
              this.companyGridContent[updateIndex]["company_record_source"] =
                values["company_record_source"];
              return resolve();
            })
            .catch((error) => {
              return reject("Failed to update.");
            });
        }
        if ("company_domain" in values) {
          const validCompanyDomain = values["company_domain"];
          // const validCompanyEmail = this.validationService.validateCompanyName(values['company_email']);

          this.apiService
            .updateCompany(key, {
              company_domain: validCompanyDomain,
              company_email: this.currentEmail,
              user_id: this.dataStore.currentUser["user_id"],
              customer_id: this.dataStore.currentUser["customer_id"],
            })
            .then((res) => {
              this.notificationService.success(
                "Success",
                "Company Domain has been updated",
                { timeOut: 3000, showProgressBar: false }
              );
              this.companyGridContent[updateIndex]["company_domain"] =
                values["company_domain"];
              return resolve();
            })
            .catch((error) => {
              return reject("Failed to update.");
            });
        }

        if ("company_email" in values) {
          const validCompanyEmail = values["company_email"];
          // const validCompanyEmail = this.validationService.validateCompanyName(values['company_email']);

          this.apiService
            .updateCompany(key, {
              company_email: validCompanyEmail,
              user_id: this.dataStore.currentUser["user_id"],
              customer_id: this.dataStore.currentUser["customer_id"],
            })
            .then((res) => {
              this.notificationService.success(
                "Success",
                "Company  Eamil has been updated",
                { timeOut: 3000, showProgressBar: false }
              );
              this.companyGridContent[updateIndex]["company_email"] =
                values["company_email"];
              return resolve();
            })
            .catch((error) => {
              return reject("Failed to update.");
            });
        }

        if ("company_address1" in values) {
          const validCompanyEmployeeAddress = values["company_address1"];
          // const validCompanyEmail = this.validationService.validateCompanyName(values['company_email']);

          this.apiService
            .updateCompany(key, {
              company_address1: validCompanyEmployeeAddress,
              company_email: this.currentEmail,
              user_id: this.dataStore.currentUser["user_id"],
              customer_id: this.dataStore.currentUser["customer_id"],
            })
            .then((res) => {
              this.notificationService.success(
                "Success",
                "Company Address has been updated",
                { timeOut: 3000, showProgressBar: false }
              );
              this.companyGridContent[updateIndex]["company_address1"] =
                values["company_address1"];
              return resolve();
            })
            .catch((error) => {
              return reject("Failed to update.");
            });
        }

        if ("company_address2" in values) {
          const validCompanyEmployeeAddress = values["company_address2"];
          // const validCompanyEmail = this.validationService.validateCompanyName(values['company_email']);

          this.apiService
            .updateCompany(key, {
              company_address2: validCompanyEmployeeAddress,
              user_id: this.dataStore.currentUser["user_id"],
              company_email: this.currentEmail,
              customer_id: this.dataStore.currentUser["customer_id"],
            })
            .then((res) => {
              this.notificationService.success(
                "Success",
                "Company Address has been updated",
                { timeOut: 3000, showProgressBar: false }
              );
              this.companyGridContent[updateIndex]["company_address2"] =
                values["company_address2"];
              return resolve();
            })
            .catch((error) => {
              return reject("Failed to update.");
            });
        }

        if ("company_employee_number" in values) {
          const validCompanyEmployeeNumber = values["company_employee_number"];
          // const validCompanyEmail = this.validationService.validateCompanyName(values['company_email']);

          this.apiService
            .updateCompany(key, {
              company_employee_number: validCompanyEmployeeNumber,
              user_id: this.dataStore.currentUser["user_id"],
              company_email: this.currentEmail,
              customer_id: this.dataStore.currentUser["customer_id"],
            })
            .then((res) => {
              this.notificationService.success(
                "Success",
                "Number of Employees has been updated",
                { timeOut: 3000, showProgressBar: false }
              );
              this.companyGridContent[updateIndex]["company_employee_number"] =
                values["company_employee_number"];
              return resolve();
            })
            .catch((error) => {
              return reject("Failed to update.");
            });
        }

        if ("company_phone" in values) {
          const validCompanyPhone = values["company_phone"];
          // const validCompanyEmail = this.validationService.validateCompanyName(values['company_email']);

          this.apiService
            .updateCompany(key, {
              company_phone: validCompanyPhone,
              company_email: this.currentEmail,
              user_id: this.dataStore.currentUser["user_id"],
              customer_id: this.dataStore.currentUser["customer_id"],
            })
            .then((res) => {
              this.notificationService.success(
                "Success",
                "Company Phone has been updated",
                { timeOut: 3000, showProgressBar: false }
              );
              this.companyGridContent[updateIndex]["company_phone"] =
                values["company_phone"];
              return resolve();
            })
            .catch((error) => {
              return reject("Failed to update.");
            });
        }

        if ("company_revenue" in values) {
          const validCompanyRevenue = values["company_revenue"];
          // const validCompanyEmail = this.validationService.validateCompanyName(values['company_email']);

          this.apiService
            .updateCompany(key, {
              company_revenue: validCompanyRevenue,
              company_email: this.currentEmail,
              user_id: this.dataStore.currentUser["user_id"],
              customer_id: this.dataStore.currentUser["customer_id"],
            })
            .then((res) => {
              this.notificationService.success(
                "Success",
                "Company Revenue has been updated",
                { timeOut: 3000, showProgressBar: false }
              );
              this.companyGridContent[updateIndex]["company_revenue"] =
                values["company_revenue"];
              return resolve();
            })
            .catch((error) => {
              return reject("Failed to update.");
            });
        }

        if ("company_type" in values) {
          const validCompanyType = values["company_type"];
          // const validCompanyEmail = this.validationService.validateCompanyName(values['company_email']);

          this.apiService
            .updateCompany(key, {
              company_type: validCompanyType,
              company_email: this.currentEmail,
              user_id: this.dataStore.currentUser["user_id"],
              customer_id: this.dataStore.currentUser["customer_id"],
            })
            .then((res) => {
              this.notificationService.success(
                "Success",
                "Company Type has been updated",
                { timeOut: 3000, showProgressBar: false }
              );
              this.companyGridContent[updateIndex]["company_type"] =
                values["company_type"];
              return resolve();
            })
            .catch((error) => {
              return reject("Failed to update.");
            });
        }

        if ("company_website" in values) {
          const validCompanyWebsite = values["company_website"];
          // const validCompanyEmail = this.validationService.validateCompanyName(values['company_email']);
          if (validCompanyWebsite.length === 0) {
            return reject("Company Site cannot be empty.");
          } else {
            this.apiService
              .updateCompany(key, {
                company_website: validCompanyWebsite,
                user_id: this.dataStore.currentUser["user_id"],
                customer_id: this.dataStore.currentUser["customer_id"],
              })
              .then((res) => {
                this.notificationService.success(
                  "Success",
                  "Company Website has been updated",
                  { timeOut: 3000, showProgressBar: false }
                );
                this.companyGridContent[updateIndex]["company_website"] =
                  values["company_website"];
                return resolve();
              })
              .catch((error) => {
                return reject("Failed to update.");
              });
          }
        } else if ("company_zip" in values) {
          this.apiService
            .updateCompany(key, {
              company_name: values["company_zip"],
              user_id: this.dataStore.currentUser["user_id"],
              customer_id: this.dataStore.currentUser["customer_id"],
            })
            .then((res) => {
              this.notificationService.success(
                "Success",
                "Company has been updated",
                { timeOut: 3000, showProgressBar: false }
              );
              this.companyGridContent[updateIndex]["company_zip"] =
                values["company_zip"];
              return resolve();
            })
            .catch((error) => {
              return reject("Failed to update.");
            });
        } else if ("status" in values) {
          this.apiService
            .updateCompany(key, {
              company_name: values["status"],
              user_id: this.dataStore.currentUser["user_id"],
              customer_id: this.dataStore.currentUser["customer_id"],
            })
            .then((res) => {
              this.notificationService.success(
                "Success",
                "Company has been updated",
                { timeOut: 3000, showProgressBar: false }
              );
              this.companyGridContent[updateIndex]["status"] = values["status"];
              return resolve();
            })
            .catch((error) => {
              return reject("Failed to update.");
            });
        }
      } catch (error) {
        return reject("Invalid format");
      }
    });
  }

  /* Popup Actions */
  popupDataViewHidingAction(event) {
    if (this.companyToolbarViewType.instance) {
      this.companyToolbarViewType.instance.getDataSource().reload();
    }
  }

  /** Toolbar Actions **/
  /* Toolbar Company ViewType SelectBox Action */
  toolbarCompanyViewTypeLoadAction(loadOptions) {
    return new Promise((resolve, reject) => {
      let customerId = null;
      if (
        this.dataStore.currentCustomer &&
        this.dataStore.currentCustomer.customer_id
      ) {
        customerId = this.dataStore.currentCustomer.customer_id;
      }
      this.apiService
        .findDataViews("companies", customerId)
        .then((viewTypes: any[]) => {
          viewTypes.push({
            view_id: "manage_company_views",
            view_name: "Manage Company Views",
          });
          return resolve(viewTypes);
        })
        .catch((error) => {
          this.notificationService.error("Error", error, {
            timeOut: 3000,
            showProgressBar: false,
          });
          return resolve([]);
        });
    });
  }

  /* Toolbar Users SelectBox Action */
  toolbarUsersLoadAction(loadOptions) {
    return new Promise((resolve, reject) => {
      if (this.isBidRetrieverAdmin) {
        if (this.toolbarUsersContent.length === 0) {
          this.userInfoApiService
            .findUsers()
            .then((res: any[]) => {
              res = res.map((item) => {
                item.user_email = item.user_email.toLowerCase();
                if (!item.user_displayname) {
                  if (!item.user_firstname && !item.user_lastname) {
                    item.user_displayname = item.user_email;
                  } else {
                    item.user_displayname = `${
                      item.user_lastname ? item.user_lastname + ", " : ""
                    }${item.user_firstname}`;
                  }
                }
                return item;
              });
              this.toolbarUsersContent = res.sort((prev, next) =>
                prev.user_displayname < next.user_displayname ? -1 : 1
              );
              return resolve(res);
            })
            .catch((err) => {
              this.notificationService.error("Error", err, {
                timeOut: 3000,
                showProgressBar: false,
              });
              this.toolbarUsersContent = [];
              return resolve(this.toolbarUsersContent);
            });
        } else {
          return resolve(this.toolbarUsersContent);
        }
      } else if (
        this.dataStore &&
        this.dataStore.currentCustomer &&
        this.dataStore.currentCustomer.customer_id
      ) {
        if (this.toolbarUsersContent.length === 0) {
          this.userInfoApiService
            .findUsers(this.dataStore.currentCustomer.customer_id)
            .then((res: any[]) => {
              res = res.map((item) => {
                item.user_email = item.user_email.toLowerCase();
                if (!item.user_displayname) {
                  item.user_displayname = `${
                    item.user_lastname ? item.user_lastname + ", " : ""
                  }${item.user_firstname}`;
                }
                return item;
              });
              this.toolbarUsersContent = res.sort((prev, next) =>
                prev.user_displayname < next.user_displayname ? -1 : 1
              );
              this.toolbarUsersContent.unshift({
                user_displayname: "All Users",
                user_email: "all-users",
              });
              return resolve(res);
            })
            .catch((err) => {
              this.notificationService.error("Error", err, {
                timeOut: 3000,
                showProgressBar: false,
              });
              this.toolbarUsersContent = [];
              return resolve(this.toolbarUsersContent);
            });
        } else {
          return resolve(this.toolbarUsersContent);
        }
      } else {
        return resolve([]);
      }
    });
  }

  /* Toolbar Search Action */
  toolbarSearchAction(event) {
    this.searchText = event.value.toLowerCase();
    if (this.companyGrid && this.companyGrid.instance) {
      this.companyGrid.instance.refresh();
    }
  }

  /* Create Company */
  toolbarAddCompanyAction() {
    this.addCompanyModal.initialize(this);
  }

  /* View company details */
  toolbarViewCompanyAction() {
    const { selectedRowKeys } = this.companyGrid;
    if (selectedRowKeys.length === 0) {
      this.notificationService.error(
        "No Selection",
        "Please select one company!",
        { timeOut: 3000, showProgressBar: false }
      );
      return;
    } else if (selectedRowKeys.length == 1) {
      const selectedRows = this.companyGridContent.filter(
        ({ company_id: companyId }) => selectedRowKeys.includes(companyId)
      );

      window.open(
        `/customer-portal/view-company/${selectedRows[0].company_id}/overview`,
        "_blank"
      );
    } else if (selectedRowKeys.length > 1 && selectedRowKeys.length <= 20) {
      Swal.fire({
        title:
          "You have selected " +
          selectedRowKeys.length +
          " companies and selected the view option",
        text: "Do you want to open tabs for all of the selected companies?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes",
        cancelButtonText: "No",
      }).then((result) => {
        if (result.value) {
          for (let i = 0; i <= selectedRowKeys.length; i++) {
            const selectedRows = this.companyGridContent.filter(
              ({ company_id: companyId }) =>
                selectedRowKeys[i].includes(companyId)
            );

            window.open(
              `/customer-portal/view-company/${selectedRows[0].company_id}/overview`,
              "_blank"
            );
          }
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          Swal.fire("Cancelled", "Your Data default display)");
        }
      });
    } else if (selectedRowKeys.length >= 20) {
      this.notificationService.error(
        "Multiple Selection",
        "you have selected more than 20 companies. The system can only display 20 at a time. Please select less companies and try again.",
        { timeOut: 3000, showProgressBar: false }
      );
      return;
    }
  }
  /* View Company Documents through doc viewer */
  toolbarViewCompanyDocumentsAction() {
    const { selectedRowKeys } = this.companyGrid;
    if (selectedRowKeys.length === 0) {
      this.notificationService.error(
        "No Selection",
        "Please select one company!",
        { timeOut: 3000, showProgressBar: false }
      );
      return;
    } else if (selectedRowKeys.length > 1) {
      this.notificationService.error(
        "Multiple Selection",
        "Please select just one company!",
        { timeOut: 3000, showProgressBar: false }
      );
      return;
    }

    const selectedRows = this.companyGridContent.filter(
      ({ company_id: companyId }) => selectedRowKeys.includes(companyId)
    );
    const {
      currentUser: { user_id: userId },
    } = this.dataStore;
    window.open(
      `${window["env"].docViewerBaseUrl}?company_id=${selectedRows[0].company_id}&user_id=${userId}`,
      "_blank"
    );
  }

  /* Edit Company */
  toolbarEditCompanyAction() {
    const { selectedRowKeys } = this.companyGrid;
    if (selectedRowKeys.length === 0) {
      this.notificationService.error(
        "No Selection",
        "Please select one company!",
        { timeOut: 3000, showProgressBar: false }
      );
      return;
    } else if (selectedRowKeys.length > 1) {
      this.notificationService.error(
        "Multiple Selection",
        "Please select just one company!",
        { timeOut: 3000, showProgressBar: false }
      );
      return;
    }
    const selectedRows = this.companyGridContent.filter(
      ({ company_id: companyId }) => selectedRowKeys.includes(companyId)
    );
    this.editCompanyModal.initialize(this, selectedRows[0]);
  }

  /* Delete Company(s) */
  toolbarDeleteCompanyAction() {
    const { selectedRowKeys } = this.companyGrid;
    if (selectedRowKeys.length === 0) {
      this.notificationService.error(
        "No Selection",
        "Please select at least one company!",
        { timeOut: 3000, showProgressBar: false }
      );
      return;
    }

    const selectedRows = this.companyGridContent.filter(
      ({ company_id: companyId }) => selectedRowKeys.includes(companyId)
    );
    const selectedCompanies = selectedRows.filter(
      (company) => company.status !== "deleted" && company.status !== "archived"
    );

    this.removeCompanyModal.initialize(selectedCompanies, true, this);
  }

  /* Archive Company(s) */
  toolbarArchiveCompanyAction() {
    const { selectedRowKeys } = this.companyGrid;
    if (selectedRowKeys.length === 0) {
      this.notificationService.error(
        "No Selection",
        "Please select at least one company!",
        { timeOut: 3000, showProgressBar: false }
      );
      return;
    }

    const selectedRows = this.companyGridContent.filter(
      ({ company_id: companyId }) => selectedRowKeys.includes(companyId)
    );
    const selectedCompanies = selectedRows.filter(
      (company) => company.status !== "deleted" && company.status !== "archived"
    );

    this.removeCompanyModal.initialize(selectedCompanies, false, this);
  }

  /* Add Documents To Company */
  toolbarAddDocumentsToCompanyAction() {
    // const selectedCompanies = this.grid.api.getSelectedRows();
    const { selectedRowKeys } = this.companyGrid;
    if (selectedRowKeys.length === 0) {
      this.notificationService.error(
        "No Selection",
        "Please select one company!",
        { timeOut: 3000, showProgressBar: false }
      );
      return;
    } else if (selectedRowKeys.length > 1) {
      this.notificationService.error(
        "Multiple Selection",
        "Please select just one company!",
        { timeOut: 3000, showProgressBar: false }
      );
      return;
    }

    const selectedRows = this.companyGridContent.filter(
      ({ company_id: companyId }) => selectedRowKeys.includes(companyId)
    );
    if (
      selectedRows[0].status === "deleted" ||
      selectedRows[0].status === "archived"
    ) {
      this.notificationService.error(
        "Error",
        "You cannot add submission to deleted/archived company!",
        { timeOut: 3000, showProgressBar: false }
      );
      return;
    }

    this.addSubmissionModal.initialize(selectedRows[0], this);
  }

  /* Toolbar "View Published Company" Action */
  toolbarViewPublishedCompanyAction() {
    const { selectedRowKeys } = this.companyGrid;
    if (selectedRowKeys.length === 0) {
      this.notificationService.error(
        "No Selection",
        "Please select one company!",
        { timeOut: 3000, showProgressBar: false }
      );
      return;
    } else if (selectedRowKeys.length > 1) {
      this.notificationService.error(
        "Multiple Selection",
        "Please select just one company!",
        { timeOut: 3000, showProgressBar: false }
      );
      return;
    }

    const selectedRows = this.companyGridContent.filter(
      ({ company_id: companyId }) => selectedRowKeys.includes(companyId)
    );
    this.apiService
      .getPublishedLink(selectedRows[0].company_id)
      .then((url: string) => {
        window.open(url, "_blank");
      })
      .catch((err) => {
        this.notificationService.error("Error", err, {
          timeOut: 3000,
          showProgressBar: false,
        });
      });
  }

  /* Print */
  toolbarPrintCompanyListAction() {
    printArray(
      this.companyGridColumns.map((column) => column.dataField),
      this.companyGrid.instance.getDataSource().items()
    );
  }

  /* Toolbar "Export Company List to Csv" Action */
  toolbarExportCompanyListToCsvAction() {
    if (this.companyGrid && this.companyGrid.instance) {
      this.companyGrid.instance.exportToExcel(false);
    }
  }

  /* View Transaction Log */
  toolbarViewTransactionLogAction() {
    const { selectedRowKeys } = this.companyGrid;
    if (selectedRowKeys.length === 0) {
      this.notificationService.error(
        "No Selection",
        "Please select one company!",
        { timeOut: 3000, showProgressBar: false }
      );
      return;
    } else if (selectedRowKeys.length > 1) {
      this.notificationService.error(
        "Multiple Selection",
        "Please select just one company!",
        { timeOut: 3000, showProgressBar: false }
      );
      return;
    }

    const selectedRows = this.companyGridContent.filter(
      ({ company_id: companyId }) => selectedRowKeys.includes(companyId)
    );
    this.transactionLogsModal.initialize(selectedRows[0]);
  }

  toolbarRefreshGridAction() {
    this.companyGridContentLoaded = false;
    if (this.companyGrid && this.companyGrid.instance) {
      this.companyGrid.instance.refresh();
    }
  }

  toolbarHelpAction() {}

  /* Table Event: Cell Changed */
  onCellValueChanged(event: any) {
    if (event["newValue"] === event["oldValue"] || !event["newValue"]) {
      return;
    }

    const columnName = event["colDef"]["field"];
    const companyId = event["data"]["company_id"];
    const newValue = event["newValue"];

    // update company
    this.apiService
      .updateCompany(companyId, { [columnName]: newValue })
      .then((res) => {
        this.notificationService.success(
          "Success",
          "Company has been updated",
          { timeOut: 3000, showProgressBar: false }
        );
      })
      .catch((err) => {
        this.notificationService.error("Error", err, {
          timeOut: 3000,
          showProgressBar: false,
        });
      });
  }

  /**
   * Table Event: Row double clicked
   * @param event
   */
  onRowDoubleClicked(event: any) {
    window.open(
      `/customer-portal/view-company/${event["data"]["company_id"]}`,
      "_blank"
    );
  }

  onRefresh() {
    this.toolbarRefreshGridAction();
  }

  companyAdminUserEmailEditorContentReady(event) {
    setTimeout(() => {
      event.component.content().parentElement.style.width = "350px";
    });
  }

  addCompanyGridMenuItems(e) {
    if (!e.row) {
      return;
    }

    if (!e.row.data.company_bid_datetime) {
      e.row.data.company_bid_datetime = null;
    }

    e.component.selectRows([e.row.data.company_id]);

    if (e.row && e.row.rowType === "data") {
      // e.items can be undefined
      if (!e.items) {
        e.items = [];
      }

      // Add a custom menu item
      e.items.push(
        {
          type: "normal",
          text: "View Company",
          onItemClick: () => this.toolbarViewCompanyAction(),
        },
        {
          type: "normal",
          text: "Add Company",
          onItemClick: () => this.toolbarAddCompanyAction(),
        },
        {
          type: "normal",
          text: "View Company Documents",
          onItemClick: () => this.toolbarViewCompanyDocumentsAction(),
        },
        {
          type: "normal",
          text: "Edit Company",
          onItemClick: () => this.toolbarEditCompanyAction(),
        },
        {
          type: "normal",
          text: "Delete Company",
          onItemClick: () => this.toolbarDeleteCompanyAction(),
        },
        {
          type: "normal",
          text: "Archive Company",
          onItemClick: () => this.toolbarArchiveCompanyAction(),
        },
        {
          type: "normal",
          text: "Add Documents To Company",
          onItemClick: () => this.toolbarAddDocumentsToCompanyAction(),
        },
        {
          type: "normal",
          text: "View Published Company",
          onItemClick: () => this.toolbarViewPublishedCompanyAction(),
        },
        {
          type: "normal",
          text: "Print Company List",
          onItemClick: () => this.toolbarPrintCompanyListAction(),
        },
        {
          type: "normal",
          text: "Export Company List  To CSV",
          onItemClick: () => this.toolbarExportCompanyListToCsvAction(),
        },
        {
          type: "normal",
          text: "View Transaction Log",
          onItemClick: () => this.toolbarViewTransactionLogAction(),
        },
        {
          type: "normal",
          text: "Refresh Grid",
          onItemClick: () => this.toolbarRefreshGridAction(),
        },
        {
          type: "normal",
          text: "Help",
          onItemClick: () => this.toolbarHelpAction(),
        }
      );
    }
    return e;
  }
}
