import {
  Component,
  OnInit,
  ViewEncapsulation,
  ViewChild,
  ElementRef,
} from "@angular/core";
import { CompaniesApi } from "app/customer-portal/my-companies/my-companies.api.service";
import { TreeModel } from "ng2-tree";

import { AmazonService } from "app/providers/amazon.service";

import { NotificationsService } from "angular2-notifications";
import { NgxSpinnerService } from "ngx-spinner";
import { ValidationService } from "app/providers/validation.service";
import { FoldingType } from "ng2-tree/src/tree.types";
import * as uuid from "uuid/v1";
import { DatePicker } from "angular2-datetimepicker";
import { Logger } from "app/providers/logger.service";
import { CompanyOfficeApi } from "app/customer-portal/system-settings/company-office-setup/company-office-setup.api.service";
import { UserInfoApi } from "app/customer-portal/system-settings/user-setup/user-setup.api.service";
import { DestinationSettingsApi } from "app/customer-portal/system-settings/destination-system-settings/destination-system-settings.api.service";
const CircularJSON = require("circular-json");
const moment = require("moment-timezone");

import { DataStore } from "app/providers/datastore";

@Component({
  selector: "edit-company-modal",
  templateUrl: "./edit-company-modal.component.html",
  styleUrls: ["./edit-company-modal.component.scss"],
  providers: [
    CompaniesApi,
    CompanyOfficeApi,
    DestinationSettingsApi,
    UserInfoApi,
  ],
  encapsulation: ViewEncapsulation.None,
})
export class EditCompanyModalComponent implements OnInit {
  @ViewChild("addCompanyModal", { static: false }) addCompanyModal: ElementRef;
  @ViewChild("dropZone", { static: false }) dropZone: ElementRef;
  @ViewChild("treeZone", { static: false }) treeZone: ElementRef;

  viewMode = "basic";

  fileTree: TreeModel = {
    value: "",
  };
  droppedFiles = [];
  parent = null;
  offices = [];
  companyUsers = [];
  companyName = "";
  companyEmail = "";
  companyPhone = "";
  companyRecordSource = "";
  companyServiceArea = "";
  companyStatus = null;
  companyWebsite = "";
  companyRevenue = "";
  companyDomain = "";
  companyEmployeeNumber = "";
  companyType = null;
  companyAdminUserId = "";
  companyAddress1 = "";
  companyAddress2 = "";
  companyCity = "";
  companyState = "";
  companyCountry = "";
  companyZip = "";
  companyTimezone = "";
  company_id = "";
  constructor(
    private _destinationSettingsApi: DestinationSettingsApi,
    public dataStore: DataStore,
    private amazonService: AmazonService,
    private notificationService: NotificationsService,
    private spinner: NgxSpinnerService,
    private apiService: CompaniesApi,
    private officeApiService: CompanyOfficeApi,
    private userApiService: UserInfoApi,
    private validationService: ValidationService,
    private loggerService: Logger
  ) {
    DatePicker.prototype.ngOnInit = function () {
      this.settings = Object.assign(this.defaultSettings, this.settings);
      if (this.settings.defaultOpen) {
        this.popover = true;
      }
      this.date = new Date();
    };
  }

  ngOnInit() {}

  initialize(parent: any, company: any) {
    // let myCompany = this.dataStore.currentCompany;
    let myCompany = company;
    this.parent = parent;
    this.company_id = company.company_id;
    this.companyName = myCompany.company_name;
    this.companyPhone = myCompany.company_phone;
    this.companyRecordSource = myCompany.company_record_source;
    this.companyServiceArea = myCompany.company_service_area;
    this.companyWebsite = myCompany.company_website;
    this.companyStatus = myCompany.company_status;
    this.companyType = myCompany.company_type;
    this.companyRevenue = myCompany.company_revenue;
    this.companyEmail = myCompany.company_email;
    this.companyDomain = myCompany.company_domain;
    this.companyEmployeeNumber = myCompany.company_employee_number;

    this.companyAddress1 = myCompany.company_address1;
    this.companyAddress2 = myCompany.company_address2;
    this.companyCity = myCompany.company_city;
    this.companyState = myCompany.company_state;
    this.companyCountry = myCompany.company_country;
    this.companyZip = myCompany.company_zip;
    this.companyAdminUserId = this.dataStore.currentUser.user_id;
    this.companyTimezone = myCompany.company_timezone;
    this.droppedFiles = [];
    this.treeZone.nativeElement.style.display = "none";
    this.dropZone.nativeElement.style.display = "block";
    this.addCompanyModal.nativeElement.style.display = "block";

    this.userApiService
      .findUsers(this.dataStore.currentUser["customer_id"])
      .then((users: any[]) => {
        this.companyUsers = users.filter(({ status }) => status === "active");
        return this.officeApiService.findOffices(
          this.dataStore.currentUser["customer_id"]
        );
      })
      .then((offices: any[]) => {
        this.offices = offices;
      })
      .catch((err) => {
        this.notificationService.error("Error", err, {
          timeOut: 3000,
          showProgressBar: false,
        });
      });
  }

  onClickTab(_: any, index: number) {
    if (index === 1) {
      this.viewMode = "basic";
    } else if (index === 2) {
      this.viewMode = "date";
    } else if (index === 3) {
      this.viewMode = "detail";
    } else {
      this.viewMode = "basic";
    }
  }

  onSaveCompany() {
    // validation check
    if (!this.companyName || !this.companyName.trim()) {
      return this.notificationService.error(
        "Error",
        "Please input company name",
        { timeOut: 3000, showProgressBar: false }
      );
    }

    // if (!this.companyEmail || !this.companyEmail.trim()) {
    //   return this.notificationService.error('Error', 'Please input company email', { timeOut: 3000, showProgressBar: false });
    // }

    if (!this.companyDomain || !this.companyDomain.trim()) {
      return this.notificationService.error(
        "Error",
        "Please input company domain",
        { timeOut: 3000, showProgressBar: false }
      );
    }

    // if (this.droppedFiles.length === 0) {
    //   return this.notificationService.error('No Files', 'Please upload files', { timeOut: 3000, showProgressBar: false });
    // }

    const companyName = this.validationService.validateCompanyName(
      this.companyName
    );

    if (companyName.length === 0) {
      this.notificationService.error("Error", "Company name cannot be empty", {
        timeOut: 3000,
        showProgressBar: false,
      });
      return;
    }

    // create company
    const companyId = uuid();
    const companyCrmId = uuid();
    const companyDunsNumber = uuid();
    const companyLogoId = uuid();
    const submissionDateTime =
      moment().utc().format("YYYY-MM-DDTHH:mm:ss.SSSSSS") + "Z";
    const submissionName = this.convertTimeString(submissionDateTime);
    let hashValues = [];
    let docIDs = [];
    this.spinner.show();
    this.apiService
      .updateCompany(this.company_id, {
        //company_id: companyId,
        //company_crm_id: companyCrmId,

        company_duns_number: companyDunsNumber,
        company_admin_user_id: this.companyAdminUserId,
        company_name: companyName,
        user_id: this.dataStore.currentUser.user_id,
        company_email: this.companyEmail,
        company_phone: this.companyPhone,
        company_record_source: this.companyRecordSource,
        company_service_area: this.companyServiceArea,
        company_revenue: this.companyRevenue,
        company_type: this.companyType,
        company_status: this.companyStatus,
        company_website: this.companyWebsite,
        company_domain: this.companyDomain,
        company_employee_number: this.companyEmployeeNumber,
        company_address1: this.companyAddress1,
        company_address2: this.companyAddress2,
        company_city: this.companyCity,
        company_state: this.companyState,
        company_country: this.companyCountry,
        company_zip: this.companyZip,
        customer_id: this.dataStore.currentUser["customer_id"],
        company_timezone: this.companyTimezone,
        // company_logo_id : companyLogoId,
      })
      .then(
        (data) => {
          this.spinner.hide();
          this.notificationService.success(
            "Updated",
            "Company has been updated",
            { timeOut: 3000, showProgressBar: false }
          );

          this.reset();
          this.addCompanyModal.nativeElement.style.display = "none";

          this.logTransaction(
            "Edit Company",
            "Completed",
            `Successfully updated company`,
            this.company_id,
            "",
            "summary"
          );

          this.parent.onRefresh();
        },
        (error) => {
          this.spinner.hide();
          this.notificationService.error("Error", error, {
            timeOut: 3000,
            showProgressBar: false,
          });
          this.logTransaction(
            "Add Company",
            "Failed",
            CircularJSON.stringify(error),
            "",
            "",
            "detail"
          );
        }
      );
  }

  onCancel(event) {
    event.preventDefault();
    this.reset();
    this.addCompanyModal.nativeElement.style.display = "none";
  }

  /* Drag And Drop */
  public onDragOverDropZone(event) {
    event.stopPropagation();
    event.preventDefault();
  }

  public onDropFiles(event) {
    event.preventDefault();

    var items = event.dataTransfer.items;
    var itemsCount = items.length;
    var processedItemsCount = 0;
    for (var i = 0; i < itemsCount; i++) {
      var item = items[i].webkitGetAsEntry();
      if (item) {
        this.traverseFileTree(item, null, () => {
          processedItemsCount++;
          if (processedItemsCount === itemsCount) {
            this.fileTree = this.buildFileTree();
            this.dropZone.nativeElement.style.display = "none";
            this.treeZone.nativeElement.style.display = "block";
          }
        });
      } else {
        this.notificationService.error("Error", "Failed to read file entry", {
          timeOut: 3000,
          showProgressBar: false,
        });
      }
    }
  }

  private traverseFileTree(item, path = null, callback) {
    path = path || "";
    if (item.isFile) {
      // actually ignore .DS_Store from MAC
      if (item.name !== ".DS_Store") {
        item.path = path || "";
        item.filepath =
          item.path.length > 0
            ? item.path.substring(0, item.path.length - 1)
            : ".";
        this.droppedFiles.push(item);
      }
      callback();
    } else if (item.isDirectory) {
      // Get folder contents
      var dirReader = item.createReader();

      this.readAllEntries(dirReader, (entries) => {
        if (entries.length === 0) {
          callback();
        } else {
          var count = 0;
          for (var i = 0; i < entries.length; i++) {
            this.traverseFileTree(entries[i], path + item.name + "/", () => {
              count++;
              if (count === entries.length) {
                callback();
              }
            });
          }
        }
      });
    } else {
      callback();
    }
  }

  private readAllEntries = (dirReader, callback, allEntries = []) => {
    dirReader.readEntries((entries) => {
      if (entries.length === 0) {
        callback(allEntries);
      } else {
        allEntries = allEntries.concat(entries);
        this.readAllEntries(dirReader, callback, allEntries);
      }
    });
  };

  private buildFileTree() {
    var tree: TreeModel = {
      value: "[Root]",
      children: [],
    };

    this.droppedFiles.forEach((droppedFile) => {
      if (droppedFile.filepath === ".") {
        tree.children.push({
          value: droppedFile.name,
        });
      } else {
        let filePaths = droppedFile.filepath.split("/");
        var parentDirectory = tree;

        for (var index = 0; index < filePaths.length; index++) {
          var directory: TreeModel = {
            value: filePaths[index],
            children: [],
            _foldingType: FoldingType.Collapsed,
          };

          var childsWithSameDirectoryName = parentDirectory.children.filter(
            (child) => {
              return child.value === directory.value;
            }
          );

          if (childsWithSameDirectoryName.length === 0) {
            parentDirectory.children.push(directory);
            parentDirectory = directory;
          } else {
            parentDirectory = childsWithSameDirectoryName[0];
          }
        }

        parentDirectory.children.push({
          value: droppedFile.name,
        });
      }
    });

    return tree;
  }

  private uploadDroppedFiles(submission_id) {
    return new Promise((resolve, reject) => {
      this.droppedFiles
        .reduce((p, item) => {
          return p
            .then(() => this.uploadDroppedFile(item, submission_id))
            .catch((err) => Promise.reject(err));
        }, Promise.resolve())
        .then((res) => {
          resolve();
        })
        .catch((err) => {
          this.droppedFiles = [];
          reject(err);
        });
    });
  }

  private uploadDroppedFile = (item, submission_id) => {
    return new Promise((resolve, reject) => {
      item.file(
        (file) => {
          var reader = new FileReader();
          reader.onload = ((theFile) => (e) => {
            const s3Key = `${submission_id}/${item.path}${this.timestamp()}_${
              file.name
            }`;

            item.filename = file.name;
            item.filepath =
              item.path.length > 0
                ? item.path.substring(0, item.path.length - 1)
                : ".";
            item.filekey = s3Key;
            item.size = file.size;

            this.amazonService
              .uploadFile(e.target.result, s3Key)
              .then((res) => {
                resolve();
              })
              .catch((err) => {
                this.logTransaction(
                  "Upload dropped file",
                  "Failed",
                  `${item.filename} - ${CircularJSON.stringify(err)}`,
                  "",
                  "",
                  "detail"
                );
                reject(err);
              });
          })(file);

          reader.onerror = (e) => {
            console.log(e);
            this.notificationService.error(
              "Error",
              "Failed to read dropped file",
              { timeOut: 3000, showProgressBar: false }
            );

            reader.abort();
            reject(e);
          };

          reader.readAsArrayBuffer(file);
        },
        (err) => {
          console.log(err.toString());
          this.notificationService.error(
            "Error",
            "Failed to read dropped file",
            { timeOut: 3000, showProgressBar: false }
          );

          this.droppedFiles = this.droppedFiles.slice(
            0,
            this.droppedFiles.indexOf(item)
          );

          reject(err);
        }
      );
    });
  };

  logTransaction(
    operation: string,
    status: string,
    description: string,
    company_id: string = "",
    submission_id: string = "",
    transaction_level: string
  ) {
    this.loggerService.logAppTransaction({
      routine_name: "Customer Portal",
      function_name: "Add Company",
      user_id: this.dataStore.currentUser["user_id"],
      customer_id: this.dataStore.currentCustomer["customer_id"],
      operation_name: operation,
      operation_status: status,
      operation_status_desc: description,
      company_id: company_id,
      submission_id: submission_id,
      transaction_level: transaction_level,
    });
  }

  isArchiveFile(filename: string) {
    const lastIndex = filename.lastIndexOf(".");

    if (lastIndex) {
      const extension = filename.substring(lastIndex + 1).toLowerCase();
      return ["zip", "7-zip", "rar", "7z"].includes(extension);
    } else {
      return false;
    }
  }

  formatDateTime(timestamp) {
    return moment(timestamp).utc().format("YYYY-MM-DDTHH:mm:ss.SSSSSS") + "Z";
  }

  timestamp() {
    return moment().utc().format("YYYYMMDDHHmmssSSSSSS");
  }

  reset() {
    this.companyName = "";
    this.companyEmail = "";
    this.companyPhone = "";
    this.companyRevenue = "";
    this.companyRecordSource = "";
    this.companyServiceArea = "";
    this.companyStatus = null;
    this.companyWebsite = "";
    this.companyType = null;
    this.companyAdminUserId = "";
    this.companyAddress1 = "";
    this.companyAddress2 = "";
    this.companyCity = "";
    this.companyState = "";
    this.companyCountry = "";
    this.companyZip = "";
    this.droppedFiles = [];
    this.viewMode = "basic";
  }

  onClickDatePicker(event: any) {
    event.stopPropagation();
    event.preventDefault();
  }

  convertTimeString(timestamp: string) {
    return this.convertToUserTimeZone(timestamp).format("YYYY-MM-DD_HH-mm");
  }

  convertToUserTimeZone(utcDateTime) {
    const timezone =
      (this.dataStore.currentCustomer
        ? this.dataStore.currentCustomer["customer_timezone"]
        : "eastern") || "eastern";
    const datetime = moment(utcDateTime);

    switch (timezone) {
      case "eastern":
        return datetime.tz("America/New_York");
      case "central":
        return datetime.tz("America/Chicago");
      case "mountain":
        return datetime.tz("America/Denver");
      case "pacific":
        return datetime.tz("America/Los_Angeles");
      case "Non US Timezone":
        return datetime.utc();
      case "utc":
        return datetime.utc();
      default:
        return datetime.utc();
    }
  }
}
