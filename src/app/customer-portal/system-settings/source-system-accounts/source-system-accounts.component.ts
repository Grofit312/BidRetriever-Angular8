import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
} from "@angular/core";
import { ICellRendererAngularComp } from "ag-grid-angular";
import { NotificationsService } from "angular2-notifications";
import { DataStore } from "../../../providers/datastore";
import { NgxSpinnerService } from "ngx-spinner";
import { MouseGuard } from "../../../providers/mouseguard";
import { SourceSystemAccountsApi } from "./source-system-accounts.api.service";
import { UserInfoApi } from "app/customer-portal/system-settings/user-setup/user-setup.api.service";
import { AmazonService } from "app/providers/amazon.service";
import { Logger } from "app/providers/logger.service";
const CircularJSON = require("circular-json");

enum EditType {
  CREATE,
  UPDATE,
}

/**
 *
 * Custom Cell For Displaying Password
 * Show password for 5 seconds on click
 *
 */
@Component({
  selector: "password-view",
  template: `
    <span (click)="onClick()" style="cursor: pointer;">{{ renderValue }}</span>
  `,
})
export class PasswordCellComponent implements ICellRendererAngularComp {
  renderValue: string;
  originValue: string;
  showPasswordTimer = null;

  @Input() value: string | number;
  @Input() rowData: any;

  agInit(params) {
    this.originValue = params.data[params.colDef.field].toString();
    this.renderValue = "*".repeat(this.originValue.length);
  }

  onClick() {
    if (this.showPasswordTimer) {
      clearInterval(this.showPasswordTimer);
    }

    this.renderValue = this.originValue;
    this.showPasswordTimer = setTimeout(() => {
      this.renderValue = "*".repeat(this.originValue.length);
    }, 5000);
  }

  refresh() {
    return false;
  }
}

@Component({
  selector: "app-customer-portal-source-system-accounts",
  templateUrl: "./source-system-accounts.component.html",
  styleUrls: ["./source-system-accounts.component.scss"],
  providers: [SourceSystemAccountsApi, UserInfoApi],
})
export class SourceSystemAccountsComponent implements OnInit {
  @ViewChild("grid", { static: true }) grid;
  @ViewChild("editModal", { static: true }) editModal: ElementRef;
  @ViewChild("removeModal", { static: true }) removeModal: ElementRef;

  editModalTitle = "";
  removeDescriptionText = "";

  editType: EditType;

  editId = "";
  editSourceSystemName = "";
  editSourceSystemType = "";
  editOtherSourceSystemUrl = "";
  editUsername = "";
  editPassword = "";
  editToken = "";

  frameworkComponents = {
    passwordRenderer: PasswordCellComponent,
  };

  columnDefs = [
    {
      width: 70,
      checkboxSelection: true,
    },
    {
      headerName: "Source System Name",
      field: "customer_source_sys_name",
      sortable: true,
      resizable: true,
      filter: true,
    },
    {
      headerName: "Type",
      field: "source_sys_type_name_value",
      tooltipField: "source_sys_type_name_tooltip",
      sortable: true,
      resizable: true,
      filter: true,
    },
    {
      headerName: "Username",
      field: "username",
      sortable: true,
      resizable: true,
      filter: true,
    },
    {
      headerName: "Password",
      field: "password",
      sortable: true,
      resizable: true,
      filter: true,
      cellRenderer: "passwordRenderer",
    },
    {
      headerName: "Token",
      field: "access_token",
      sortable: true,
      resizable: true,
      filter: true,
    },
  ];

  rowData = [];

  sourceSystemTypes: any;

  constructor(
    private notificationService: NotificationsService,
    public dataStore: DataStore,
    private spinner: NgxSpinnerService,
    private sourceSystemAccountsApi: SourceSystemAccountsApi,
    private amazonService: AmazonService,
    private userInfoApi: UserInfoApi,
    private loggerService: Logger
  ) {}

  ngOnInit() {
    if (this.dataStore.currentUser) {
      this.loadData();
    } else {
      this.dataStore.authenticationState.subscribe((value) => {
        if (value) {
          this.loadData();
        }
      });
    }
  }

  onGridReady(params): void {
    params.api.sizeColumnsToFit();
  }

  loadData() {
    this.sourceSystemAccountsApi
      .findSourceSystemTypes()
      .then((sourceSystemTypes: any) => {
        if (Array.isArray(sourceSystemTypes)) {
          this.sourceSystemTypes = sourceSystemTypes.sort((first, second) =>
            first.source_type_name.toLowerCase() >
            second.source_type_name.toLowerCase()
              ? 1
              : first.source_type_name.toLowerCase() <
                second.source_type_name.toLowerCase()
              ? -1
              : 0
          );
        } else {
          this.sourceSystemTypes = [sourceSystemTypes];
        }

        return this.sourceSystemAccountsApi.findSourceSystems(
          this.dataStore.currentUser.customer_id
        );
      })
      .then((sourceSystems: any) => {
        let sourceSystemsArray = Array.isArray(sourceSystems)
          ? sourceSystems
          : [sourceSystems];

        sourceSystemsArray.forEach((sourceSystem) => {
          let sourceTypeName = sourceSystem.source_sys_type_name;
          let sourceSystemType = this.sourceSystemTypes.find((systemType) => {
            return systemType.source_type_name === sourceTypeName;
          });

          sourceSystem.source_sys_type_name = `${sourceTypeName}@@@${
            !sourceSystemType || !sourceSystemType.source_type_tooltip
              ? "No Tooltip Available"
              : sourceSystemType.source_type_tooltip
          }`;

          sourceSystem.source_sys_type_name_value = sourceSystem.source_sys_type_name.split(
            "@@@"
          )[0];
          sourceSystem.source_sys_type_name_tooltip = sourceSystem.source_sys_type_name.split(
            "@@@"
          )[1];
        });

        this.rowData = sourceSystemsArray;
      })
      .catch((err) => {
        this.rowData = [];

        this.notificationService.error("Error", err, {
          timeOut: 3000,
          showProgressBar: false,
        });
      });
  }

  onAdd() {
    this.editModalTitle = `Add New Source System For ${this.dataStore.currentUser.customer_name}`;

    this.editSourceSystemName = "";
    this.editSourceSystemType = "";
    this.editOtherSourceSystemUrl = "";
    this.editUsername = "";
    this.editPassword = "";
    this.editToken = "";

    this.editModal.nativeElement.style.display = "block";
    this.editType = EditType.CREATE;
  }

  onRemove() {
    const selectedRecords = this.grid.api.getSelectedRows();

    if (selectedRecords.length) {
      const selectedSourceSystem = selectedRecords[0];
      this.removeDescriptionText = `Are You Sure You Want To Remove ${selectedSourceSystem.customer_source_sys_name}?`;
      this.removeModal.nativeElement.style.display = "block";
    } else {
      this.notificationService.error("Error", "Please select a source system", {
        timeOut: 3000,
        showProgressBar: false,
      });
    }
  }

  onEdit() {
    const selectedRecords = this.grid.api.getSelectedRows();

    if (selectedRecords.length) {
      const selectedSourceSystem = selectedRecords[0];
      this.editModalTitle = `Edit Source System For ${this.dataStore.currentUser.customer_name}`;

      this.editId = selectedSourceSystem.customer_source_sys_id;
      this.editSourceSystemName = selectedSourceSystem.customer_source_sys_name;
      this.editSourceSystemType = selectedSourceSystem.source_sys_type_name.split(
        "@@@"
      )[0];
      this.editOtherSourceSystemUrl = selectedSourceSystem.source_sys_url;
      this.editUsername = selectedSourceSystem.username;
      this.editPassword = selectedSourceSystem.password;
      this.editToken = selectedSourceSystem.access_token;

      this.editModal.nativeElement.style.display = "block";
      this.editType = EditType.UPDATE;
    } else {
      this.notificationService.error("Error", "Please select a source system", {
        timeOut: 3000,
        showProgressBar: false,
      });
    }
  }

  onCloseEditModal() {
    this.editModal.nativeElement.style.display = "none";
  }

  onSave() {
    let selectedSourceSystemType = this.sourceSystemTypes.find(
      (sourceSystemType) => {
        return sourceSystemType.source_type_name === this.editSourceSystemType;
      }
    );

    let params: any = {
      customer_source_sys_name: this.editSourceSystemName,
      source_sys_type_id: selectedSourceSystemType
        ? selectedSourceSystemType.source_sys_type_id
        : "",
      source_sys_url:
        this.editSourceSystemType === "googledrive"
          ? this.editOtherSourceSystemUrl
          : "",
      username: this.editUsername,
      password: this.editPassword,
      access_token: this.editToken,
    };

    this.spinner.show();

    if (this.editType === EditType.CREATE) {
      params.customer_id = this.dataStore.currentUser.customer_id;

      this.sourceSystemAccountsApi
        .createSourceSystem(params)
        .then((res) => {
          this.spinner.hide();
          this.editModal.nativeElement.style.display = "none";
          this.notificationService.success(
            "Sucess",
            "Source system has been created",
            { timeOut: 3000, showProgressBar: false }
          );
          this.logTransaction(
            "Create source system",
            "Completed",
            `Created a source system - ${params.customer_source_sys_name}`,
            "summary"
          );

          this.loadData();
        })
        .catch((err) => {
          this.spinner.hide();
          this.notificationService.error("Error", err, {
            timeOut: 3000,
            showProgressBar: false,
          });
          this.logTransaction(
            "Create source system",
            "Failed",
            CircularJSON.stringify(err),
            "summary"
          );
        });
    } else {
      params.search_customer_source_sys_id = this.editId;

      this.sourceSystemAccountsApi
        .updateSourceSystem(params)
        .then((res) => {
          this.spinner.hide();
          this.notificationService.success(
            "Sucess",
            "Source system has been updated",
            { timeOut: 3000, showProgressBar: false }
          );
          this.editModal.nativeElement.style.display = "none";

          this.loadData();

          // check 920 table and set auth-failed records status to pending (only for current company users)
          // first, get company users
          return this.userInfoApi.findUsers(
            this.dataStore.currentUser["customer_id"]
          );
        })
        .then((users: any[]) => {
          const userIdArray = users.map((user) => user["user_id"]);
          return this.amazonService.updateProjectRetrievalRecords(
            userIdArray,
            params.source_sys_type_id
          );
        })
        .then((res) => {
          this.logTransaction(
            "Update source system",
            "Completed",
            `Updated source system - ${params.customer_source_sys_name}`,
            "summary"
          );
        })
        .catch((err) => {
          this.spinner.hide();
          this.notificationService.error("Error", err, {
            timeOut: 3000,
            showProgressBar: false,
          });
          this.logTransaction(
            "Update source system",
            "Failed",
            CircularJSON.stringify(err),
            "summary"
          );
        });
    }
  }

  onCloseRemoveModal() {
    this.removeModal.nativeElement.style.display = "none";
  }

  onConfirmRemove() {
    const selectedRecords = this.grid.api.getSelectedRows();

    if (selectedRecords) {
      const selectedSourceSystem = selectedRecords[0];
      let customer_source_sys_id = selectedSourceSystem.customer_source_sys_id;

      this.sourceSystemAccountsApi
        .removeSourceSystem(customer_source_sys_id)
        .then((res) => {
          this.removeModal.nativeElement.style.display = "none";
          this.notificationService.success(
            "Sucess",
            "Source system has been removed",
            { timeOut: 3000, showProgressBar: false }
          );
          this.logTransaction(
            "Remove Source System",
            "Completed",
            `Successfully removed source system - ${selectedSourceSystem.customer_source_sys_name}`,
            "summary"
          );

          this.loadData();
        })
        .catch((err) => {
          this.notificationService.error("Error", err, {
            timeOut: 3000,
            showProgressBar: false,
          });
          this.logTransaction(
            "Remove Source System",
            "Failed",
            CircularJSON.stringify(err),
            "summary"
          );
        });
    }
  }

  onUserRowSelected(event) {
    if (MouseGuard.isDoubleClick()) {
      this.onEdit();
    }
  }

  logTransaction(
    operation: string,
    status: string,
    description: string,
    transaction_level: string
  ) {
    this.loggerService.logAppTransaction({
      routine_name: "Customer Portal",
      operation_name: operation,
      user_id: this.dataStore.currentUser["user_id"],
      customer_id: this.dataStore.currentUser["customer_id"],
      function_name: operation,
      operation_status: status,
      operation_status_desc: description,
      transaction_level: transaction_level,
    });
  }
}
