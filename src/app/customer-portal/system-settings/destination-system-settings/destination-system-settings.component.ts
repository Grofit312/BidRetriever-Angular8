import { Component, OnInit, ElementRef, ViewChild } from "@angular/core";
import { DataStore } from "../../../providers/datastore";
import { NotificationsService } from "angular2-notifications";
import { ValidationService } from "app/providers/validation.service";
import { DestinationSettingsApi } from "app/customer-portal/system-settings/destination-system-settings/destination-system-settings.api.service";
import { Router, ActivatedRoute } from "@angular/router";
import { Logger } from "app/providers/logger.service";
import { split } from "lodash";
const CircularJSON = require("circular-json");

@Component({
  selector: "app-customer-portal-destination-system-settings",
  templateUrl: "./destination-system-settings.component.html",
  styleUrls: ["./destination-system-settings.component.scss"],
  providers: [DestinationSettingsApi],
})
export class DestinationSystemSettingsComponent implements OnInit {
  @ViewChild("dropboxConfirmModal", { static: false })
  dropboxConfirmModal: ElementRef;
  connectedDropboxAccount = "";

  destinationTypes = [];
  destinationSettings = {};
  readonly SHAREPOINT_DESTINATION_TYPEID = "microsoft_sharepoint";
  readonly DROPBOX_DESTINATION_TYPEID = "dropbox";

  destinationSystemName = "";
  destinationSystemType = "";

  isPasswordVisible = false;

  destinationURL = "";
  destinationSiteName = "";
  destinationLibraryName = "";
  destinationRootPath = "";

  destinationSystemUsername = "";
  destinationSystemPassword = "";
  destinationSystemPathPrefix = "";
  destinationSystemToken = "";

  settingChanged = false;

  constructor(
    public dataStore: DataStore,
    private apiService: DestinationSettingsApi,
    private notificationService: NotificationsService,
    private validationService: ValidationService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private loggerService: Logger
  ) {}

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

  ngOnDestroy() {
    if (this.settingChanged) {
      this.saveCustomerSettings()
        .then((res: string) => {
          this.notificationService.success("Saved", res, {
            timeOut: 3000,
            showProgressBar: false,
          });
          this.logTransaction(
            "Completed",
            "Successfully updated customer settings",
            "summary"
          );
        })
        .catch((err: string) => {
          this.notificationService.error("Error", err, {
            timeOut: 3000,
            showProgressBar: false,
          });
          this.logTransaction("Failed", err, "summary");
        });
    }
  }

  onChangeInput() {
    this.settingChanged = true;
    this.setSharepointCustomPanel();
  }

  setSharepointCustomPanel() {
    if (this.destinationSystemType === this.SHAREPOINT_DESTINATION_TYPEID) {
      document.getElementById("divSharePointURL").style.display = "";
      document.getElementById("divSharePointSiteName").style.display = "";
      document.getElementById("divSharePointLibraryName").style.display = "";
    } else {
      document.getElementById("divSharePointURL").style.display = "none";
      this.destinationURL = "";
      document.getElementById("divSharePointSiteName").style.display = "none";
      this.destinationSiteName = "";
      document.getElementById("divSharePointLibraryName").style.display =
        "none";
      this.destinationLibraryName = "";
    }
  }
  getDestinationAbbrev() {
    if (this.destinationSystemType === this.SHAREPOINT_DESTINATION_TYPEID) {
      return "Sharepoint";
    }
    return "Dropbox";
  }
  onDropboxLogin() {
    if (this.settingChanged) {
      this.saveCustomerSettings()
        .then((res: string) => {
          this.logTransaction(
            "Completed",
            "Successfully updated customer settings",
            "summary"
          );
          if (this.destinationSystemType === this.DROPBOX_DESTINATION_TYPEID) {
            this.dropboxLogin(false);
          }
        })
        .catch((err: string) => {
          this.notificationService.error("Error", err, {
            timeOut: 3000,
            showProgressBar: false,
          });
          this.logTransaction("Failed", err, "summary");
        });
    } else {
      this.dropboxLogin(false);
    }
  }

  onSelectNewDropboxAccount() {
    this.dropboxConfirmModal.nativeElement.style.display = "none";

    this.dropboxLogin(true);
  }

  onConfirmDropboxAccount() {
    this.dropboxConfirmModal.nativeElement.style.display = "none";
  }

  onVerifyToken() {
    this.verifyToken()
      .then((res) => {
        if (res) {
          this.notificationService.success("Valid", "This token is valid", {
            timeOut: 3000,
            showProgressBar: false,
          });
        } else {
          this.notificationService.error("Invalid", "This token is invalid", {
            timeOut: 3000,
            showProgressBar: false,
          });
        }
      })
      .catch((err) => {
        this.notificationService.error("Error", "Failed to verify token", {
          timeOut: 3000,
          showProgressBar: false,
        });
      });
  }

  dropboxLogin(reAuthenticate: boolean = false) {
    let dropboxRedirect = `${window["env"]["dropboxOAuthDomain"]}${window["env"]["dropboxOAuthPath"]}?response_type=code&client_id=${window["env"]["dropboxAppKey"]}&redirect_uri=${window["env"]["oauthRedirectURL"]}`;

    if (reAuthenticate) {
      dropboxRedirect += "&force_reauthentication=true";
    }

    window.open(dropboxRedirect, "_self");
  }

  verifyToken() {
    const token = this.destinationSystemToken;
    const destinationType = this.destinationSystemType;

    if (destinationType === "dropbox") {
      return this.apiService.verifyDropboxToken(token);
    } else {
      return new Promise((resolve) => resolve());
    }
  }

  load() {
    this.loadCustomerSettings();

    this.activatedRoute.queryParams.subscribe((params) => {
      const code = params["code"];

      if (code) {
        this.apiService
          .retrieveDropboxToken(code)
          .then((token: string) => {
            this.destinationSystemToken = token;
            return this.apiService.retrieveDropboxAccount(token);
          })
          .then((accountEmail: string) => {
            this.connectedDropboxAccount = accountEmail;
            this.settingChanged = true;

            this.router.navigate([
              "/customer-portal/system-settings/destination-system-settings",
            ]);
            this.dropboxConfirmModal.nativeElement.style.display = "block";
          })
          .catch((err) => {
            this.notificationService.error(
              "Error",
              "Failed to retrieve token",
              { timeOut: 3000, showProgressBar: false }
            );
          });
      }
    });
  }

  loadCustomerSettings() {
    this.apiService
      .findDestinationTypes()
      .then((res: any[]) => {
        this.destinationTypes = res;
        return this.apiService.findCustomerDestination(
          this.dataStore.currentUser["customer_id"]
        );
      })
      .then((res) => {
        this.destinationSettings = res;
        this.destinationSystemName = res["destination_name"];
        this.destinationSystemType = res["destination_type_id"];
        this.destinationSystemUsername = res["destination_username"];
        this.destinationSystemPassword = res["destination_password"];
        this.destinationURL = res["destination_url"];

        if (this.destinationSystemType === this.SHAREPOINT_DESTINATION_TYPEID) {
          let threeParts = [];

          threeParts = split(res["destination_root_path"], "\\");

          if (threeParts.length === 3) {
            this.destinationSiteName = threeParts[0];
            this.destinationLibraryName = threeParts[1];
            this.destinationSystemPathPrefix = threeParts[2];
          }
        } else {
          this.destinationSystemPathPrefix = res["destination_root_path"];
        }
        this.setSharepointCustomPanel();

        this.destinationSystemToken = res["destination_access_token"];
      })
      .catch((err) => {
        if (!window.location.href.includes("code=")) {
          this.notificationService.error("Error", err, {
            timeOut: 3000,
            showProgressBar: false,
          });
        }
      });
  }

  saveCustomerSettings() {
    return new Promise((resolve, reject) => {
      if (!this.destinationSystemType) {
        return reject("Please select destination type");
      }

      const destinationType = this.destinationTypes.find(
        (type) => type.destination_type_id === this.destinationSystemType
      );

      let params = {
        customer_id: this.dataStore.currentUser["customer_id"],
        destination_type_id: destinationType["destination_type_id"],
        destination_url: destinationType["destination_type_domain"],
        destination_name: this.destinationSystemName.trim(),
        destination_password: this.destinationSystemPassword.trim(),
        destination_type_name: destinationType["destination_type_name"],
        destination_username: this.destinationSystemUsername.trim(),
      };

      if (this.destinationSettings["destination_id"]) {
        params["destination_id"] = this.destinationSettings["destination_id"];
      }

      const destinationPathPrefix = this.validationService.validateDestinationPath(
        this.destinationSystemPathPrefix,
        true
      );

      if (destinationPathPrefix.length > 50) {
        this.notificationService.error(
          "Error",
          "Failed to save destination path, longer than 50 letters",
          { timeOut: 3000, showProgressBar: false }
        );
      } else if (destinationPathPrefix.length === 0) {
        this.notificationService.error(
          "Error",
          "Failed to save destination path, cannot be empty string",
          { timeOut: 3000, showProgressBar: false }
        );
      } else {
        if (this.destinationSystemType === this.SHAREPOINT_DESTINATION_TYPEID) {
          let threeParts = [];
          params["destination_url"] = this.destinationURL;
          threeParts[0] = this.destinationSiteName;
          threeParts[1] = this.destinationLibraryName;
          params["destination_root_path"] =
            threeParts[0] + "\\" + threeParts[1] + "\\" + destinationPathPrefix;
        } else {
          params["destination_root_path"] = destinationPathPrefix;
        }
      }

      this.destinationSystemToken = this.destinationSystemToken.trim();

      if (
        this.destinationSystemToken &&
        this.destinationSystemType === this.DROPBOX_DESTINATION_TYPEID
      ) {
        this.verifyToken()
          .then((res) => {
            if (res) {
              params["destination_access_token"] = this.destinationSystemToken;
            } else {
              reject("Access token is invalid");
            }
            return this.apiService.updateDestinationSettings(params);
          })
          .then((res) => {
            resolve("Destination Settings Saved");
          })
          .catch((err) => {
            reject(
              "Failed to save destination settings: " +
                CircularJSON.stringify(err)
            );
          });
      } else {
        this.apiService
          .updateDestinationSettings(params)
          .then((res) => {
            resolve("Destination Settings Saved");
          })
          .catch((err) => {
            reject(
              "Failed to save destination settings: " +
                CircularJSON.stringify(err)
            );
          });
      }
    });
  }

  logTransaction(
    status: string,
    description: string,
    transaction_level: string
  ) {
    this.loggerService.logAppTransaction({
      routine_name: "Customer Portal",
      operation_name: "Update Destination System Settings",
      user_id: this.dataStore.currentUser["user_id"],
      customer_id: this.dataStore.currentUser["customer_id"],
      function_name: "Update Destination System Settings",
      operation_status: status,
      operation_status_desc: description,
      transaction_level: transaction_level,
    });
  }

  togglePasswordVisible() {
    this.isPasswordVisible = !this.isPasswordVisible;
  }
}
