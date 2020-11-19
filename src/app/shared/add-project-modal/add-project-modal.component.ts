import {
  Component,
  OnInit,
  ViewEncapsulation,
  ViewChild,
  ElementRef,
} from "@angular/core";
import { ProjectsApi } from "app/customer-portal/my-projects/my-projects.api.service";
import { TreeModel } from "ng2-tree";
import { DataStore } from "app/providers/datastore";
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
import { SourceSystemAccountsApi } from "app/customer-portal/system-settings/source-system-accounts/source-system-accounts.api.service";
import { CompaniesApi } from "app/customer-portal/my-companies/my-companies.api.service";
import { ContactApi } from 'app/customer-portal/view-company/company-employees/company-employees.component.api.service';
import DataSource from 'devextreme/data/data_source';
import { NotesApi } from "app/customer-portal/view-company/notes.api.service";
const CircularJSON = require("circular-json");
const moment = require("moment-timezone");

@Component({
  selector: "add-project-modal",
  templateUrl: "./add-project-modal.component.html",
  styleUrls: ["./add-project-modal.component.scss"],
  providers: [
    ProjectsApi,
    CompanyOfficeApi,
    DestinationSettingsApi,
    UserInfoApi,
    SourceSystemAccountsApi,
  ],
  encapsulation: ViewEncapsulation.None,
})
export class AddProjectModalComponent implements OnInit {
  @ViewChild("addProjectModal", { static: false }) addProjectModal: ElementRef;
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
  companyTypeList: any;
  searchModeOption: string = "contains";
  searchExprOption: any = "company_name";
  searchTimeoutOption: number = 200;
  minSearchLengthOption: number = 0;
  //Contact selection
  contactTypeList: any;
  conSearchModeOption: string = "contains";
  conSearchExprOption: any = "contact_email";
  conSearchTimeoutOption: number = 200;
  conMinSearchLengthOption: number = 0;
  
  companyId="";
  contactId="";

  searchExprOptionItems: Array<any> = [
    {
      name: "'company_name'",
      value: "company_name",
    },
    {
      name: "['company_name', 'company_id']",
      value: ["company_name", "company_id"],
    },
  ];
  
  projectName = "";
  projectDescription = "";
  projectBidDateTime = null;
  projectAdminUserId = "";
  submitterEmail = "";
  source = "";
  status = "";
  projectAddress1 = "";
  projectAddress2 = "";
  projectCity = "";
  projectState = "";
  projectZip = "";
  preBidDateTime = null;
  projectStartDateTime = null;
  projectFinishDateTime = null;
  workStartDateTime = null;
  workFinishDateTime = null;
  expectedAwardDateTime = null;
  awardDateTime = null;
  expectedContractDateTime = null;
  contractDateTime = null;
  projectNumber = "";
  contractType = "";
  projectStage = "";
  projectSegment = "";
  buildingType = "";
  laborRequirement = "";
  projectValue = "";
  projectSize = "";
  constructionType = "";
  awardStatus = "";
  projectTimezone = "";
  projectOfficeId = "";
  autoUpdateStatus = false;
  source_company_domain = "";
  source_company_id = "";
  source_sys_type_id = "";
  sourceSystemTypes: any[];
  customerId: any;
  companyData: any;
  contactData: any;
  company_email = "";
  company_domain ="";
  company_website = "";
  source_sys_url = "";
  
  email_company: any;
  company_office_id: any;
  contactEmailDetail: any;
  contactFirstName: any;
  contactSecondName: any;

  constructor(
    private _destinationSettingsApi: DestinationSettingsApi,
    public dataStore: DataStore,
    private amazonService: AmazonService,
    private notificationService: NotificationsService,
    private spinner: NgxSpinnerService,
    private apiService: ProjectsApi,
    private officeApiService: CompanyOfficeApi,
    private userApiService: UserInfoApi,
    private validationService: ValidationService,
    private loggerService: Logger,
    private sourceSystemAccountsApi: SourceSystemAccountsApi,
    private companyApi: CompaniesApi, 
    private contactApi: ContactApi
  ) {
    DatePicker.prototype.ngOnInit = function () {
      this.settings = Object.assign(this.defaultSettings, this.settings);
      if (this.settings.defaultOpen) {
        this.popover = true;
      }
      this.date = new Date();
    };
  }

  ngOnInit() {
    if (!this.dataStore.currentUser) {
      this.dataStore.authenticationState.subscribe((value) => {
        if (value) {
          this.getCompanyList();
          
          this.sourceSystemAccounts();
        }
      });
    }
    this.getCompanyList();
    this.sourceSystemAccounts();
  }

  sourceSystemAccounts(){
    if(this.dataStore.currentCustomer){
      this.sourceSystemAccountsApi
      .findSourceSystemTypes()
      .then((sourceSystemTypes: any) => {
        if (Array.isArray(sourceSystemTypes)) {
          this.sourceSystemTypes = sourceSystemTypes;
        } else {
          this.sourceSystemTypes = [sourceSystemTypes];
        }

        return this.sourceSystemAccountsApi.findSourceSystems(
          this.dataStore.currentUser.customer_id
        );
      })
      .catch((err) => {
        this.notificationService.error("Error", err, {
          timeOut: 3000,
          showProgressBar: false,
        });
      });
    }
  }

  getCompanyList() {
    
    if (this.dataStore.currentCustomer != null) {
      this.companyApi
        .findCompaniesByCustomerId(
          this.dataStore.currentCustomer["customer_id"],
          this.dataStore.currentCustomer["customer_timezone"] || "eastern",
          null
        )
        .then((res: any) => {
          this.companyTypeList = new DataSource({store: {data:  res, type:'array', key: 'company_id'}})
          
        });
    }
  }
  
  getContactList(company_id:any) {
    
    if (this.dataStore.currentCustomer != null ) {
      this.contactApi
        .findCompanyContact(this.dataStore.currentCustomer["customer_id"], company_id, this.projectTimezone)
        .then((res: any) => {
          this.contactTypeList = new DataSource({store: {data:  res, type:'array', key: 'contact_id'}});
        });
    }
  }
  hasNewCompany ="";

  onNewCompanyEntry(event){
    if(!event.text)
    {
      event.customItem =null;
      return;
    }
    const newItem = {
      company_name: event.text,
      company_id: uuid()


    };
    this.companyTypeList.store().insert(newItem);
    this.companyTypeList.load();
    this.hasNewCompany = 'true';
    event.customItem = newItem;
    this.companyData = newItem;

    this.company_domain = '';
    this.company_website = '';
    this.contactId = '';
    this.contactFirstName = '';
    this.contactSecondName = '';

    this.getContactList(this.companyData.company_id);
 }
  hasNewContact ='';
  onNewContactEntry(event){
        if(!event.text)
    {
      event.customItem =null;
      return;
    }
    const newItem = {
      contact_email: event.text,
      contact_id: uuid()
    };
    this.contactTypeList.store().insert(newItem);
    this.contactTypeList.load();
    this.hasNewContact = "true";
    event.customItem = newItem;
    this.contactData = newItem;
  }
  onCompanySelected(event) {
    this.hasNewCompany = "";
    
    this.company_website = event.itemData["company_website"];
    this.company_domain = event.itemData["company_domain"];
    this.companyData = event.itemData;

    this.getContactList(event.itemData["company_id"]);
    
    this.contactId = '';
    this.contactFirstName = '';
    this.contactSecondName = '';

  }
  onContactSelected(event) {
    this.hasNewContact = "";
    
    this.contactFirstName = event.itemData["contact_firstname"];
    this.contactSecondName = event.itemData["contact_lastname"];

    this.contactData = event.itemData;
  }
  onEmailDetail(event: any) {
    const params: any = {
      contact_email: event.target.value,
      contact_firstname: this.contactFirstName,
      contact_lastname: this.contactSecondName,
      contact_display_name: `${this.contactFirstName} ${this.contactSecondName}`,   
      customer_id: this.offices[0].customer_id,
    };
    this.sourceSystemAccountsApi.createContactEmail(params).then((res: any) => {
      this.contactEmailDetail = res.data;
      if (res.data) {
        this.notificationService.success(
          "Success",
          "New contact is created",
          { timeOut: 3000, showProgressBar: false }
        );
      }
    });
  }

  initialize(parent: any) {
    this.parent = parent;
    this.projectName = "";
    this.projectDescription = "";
    this.source = "";
    this.status = "";
    this.projectAddress1 = "";
    this.projectAddress2 = "";
    this.projectCity = "";
    this.projectState = "";
    this.projectZip = "";
    this.submitterEmail = this.dataStore.currentUser.user_email;
    this.projectAdminUserId = this.dataStore.currentUser.user_id;
    this.projectBidDateTime = null;
    this.droppedFiles = [];
    this.projectTimezone = this.dataStore.currentCustomer
      ? this.dataStore.currentCustomer["customer_timezone"] || "eastern"
      : "eastern";
    this.projectOfficeId = "";

    this.treeZone.nativeElement.style.display = "none";
    this.dropZone.nativeElement.style.display = "block";
    this.addProjectModal.nativeElement.style.display = "block";
    if (this.dataStore.currentUser != null) {
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
  }

  onClickTab(_: any, index: number) {
    if (index === 1) {
      this.viewMode = "basic";
    } else if (index === 2) {
      this.viewMode = "date";
    } else if (index === 3) {
      this.viewMode = "detail";
    } else if (index === 4) {
      this.viewMode = "source";
    } else {
      this.viewMode = "basic";
    }
  }

  onSaveProject() {
    if (!this.projectName || !this.projectName.trim()) {
      return this.notificationService.error(
        "Error",
        "Please input project name",
        { timeOut: 3000, showProgressBar: false }
      );
    }

    if (!this.submitterEmail || !this.submitterEmail.trim()) {
      return this.notificationService.error(
        "Error",
        "Please input submitter email",
        { timeOut: 3000, showProgressBar: false }
      );
    }

    // if (this.droppedFiles.length === 0) {
    //   return this.notificationService.error('No Files', 'Please upload files', { timeOut: 3000, showProgressBar: false });
    // }

    const projectName = this.validationService.validateProjectName(
      this.projectName
    );

    if (projectName.length === 0) {
      this.notificationService.error("Error", "Project name cannot be empty", {
        timeOut: 3000,
        showProgressBar: false,
      });
      return;
    }

    // create project
    const projectId = uuid();
    const submissionId = uuid();
    const bidDateTime = this.formatDateTime(this.projectBidDateTime);
    const submissionDateTime =
      moment().utc().format("YYYY-MM-DDTHH:mm:ss.SSSSSS") + "Z";
    const submissionName = this.convertTimeString(submissionDateTime);
    let hashValues = [];
    let docIDs = [];

    this.spinner.show();

    this.uploadDroppedFiles(submissionId)
    .then((res) => {
      this.logTransaction(
        "Add Project",
        "Completed",
        `Successfully created project`,
        projectId,
        submissionId,
        "summary"
      );
     if(this.hasNewCompany){

      this.companyId = uuid();
      return this.companyApi.createCompany({
            company_id: this.companyId,
            company_name: this.companyData["company_name"],
            user_id: this.dataStore.currentUser.user_id,
            company_website: this.company_website,
            company_domain: this.company_domain,
            customer_id: this.dataStore.currentUser['customer_id'],
          })
        }
    })
    .then((res) => {
      this.logTransaction(
        "Add Company",
        "Completed",
        `Successfully created company`,
        projectId,
        submissionId,
        "summary"
      );
      if(this.hasNewContact){

        this.contactId = uuid();
        const params: any = {
          contact_id: this.contactId,
          company_id: this.companyId? this.companyId : (this.companyData && this.companyData.company_id) ? this.companyData.company_id : null,
          contact_email: this.contactData["contact_email"]  ,
          contact_firstname: this.contactFirstName,
          contact_lastname: this.contactSecondName,
          contact_display_name: `${this.contactFirstName} ${this.contactSecondName}`,   
          customer_id: this.offices[0].customer_id,
        };
    
        return this.contactApi.createContact(params);
      }
      
    })
      .then((res) => {
        this.logTransaction(
          "Upload project files",
          "Completed",
          `Uploaded ${this.droppedFiles.length} files`,
          projectId,
          submissionId,
          "detail"
        );
        const projectOffice = this.offices.find(
          (office) => office["company_office_id"] === this.projectOfficeId
        );

        return this.apiService.createProject({
          project_id: projectId,
          project_admin_user_id: this.projectAdminUserId,
          project_name: projectName,
          project_address1: this.projectAddress1,
          project_address2: this.projectAddress2,
          project_city: this.projectCity,
          project_state: this.projectState,
          project_zip: this.projectZip,
          project_desc: this.projectDescription,
          project_bid_datetime: bidDateTime,
          project_customer_id: this.dataStore.currentUser["customer_id"],
          status: this.status || "active",
          project_timezone: this.projectTimezone,
          source_url: this.source,
          project_prebid_mtg_datetime: this.preBidDateTime
            ? this.formatDateTime(this.preBidDateTime)
            : "",
          project_start_datetime: this.projectStartDateTime
            ? this.formatDateTime(this.projectStartDateTime)
            : "",
          project_complete_datetime: this.projectFinishDateTime
            ? this.formatDateTime(this.projectFinishDateTime)
            : "",
          project_work_start_datetime: this.workStartDateTime
            ? this.formatDateTime(this.workStartDateTime)
            : "",
          project_work_end_datetime: this.workFinishDateTime
            ? this.formatDateTime(this.workFinishDateTime)
            : "",
          project_expected_award_datetime: this.expectedAwardDateTime
            ? this.formatDateTime(this.expectedAwardDateTime)
            : "",
          project_award_datetime: this.awardDateTime
            ? this.formatDateTime(this.awardDateTime)
            : "",
          project_expected_contract_datetime: this.expectedContractDateTime
            ? this.formatDateTime(this.expectedContractDateTime)
            : "",
          project_contract_datetime: this.contractDateTime
            ? this.formatDateTime(this.contractDateTime)
            : "",
          project_number: this.projectNumber,
          project_contract_type: this.contractType,
          project_stage: this.projectStage,
          project_segment: this.projectSegment,
          project_building_type: this.buildingType,
          project_labor_requirement: this.laborRequirement,
          project_value: this.projectValue
            ? parseInt(this.projectValue, 10)
            : "",
          project_size: this.projectSize,
          source_company_id: this.companyId? this.companyId :
           (this.companyData && this.companyData.company_id) ? this.companyData.company_id : null,
          project_construction_type: this.constructionType,
          project_award_status: this.awardStatus,
          project_assigned_office_id: projectOffice
            ? projectOffice["company_office_id"]
            : "",
          project_assigned_office_name: projectOffice
            ? projectOffice["company_office_name"] : "",

          auto_update_status: this.autoUpdateStatus ? "active" : "inactive",
          company_website: this.company_website ? this.company_website : "",
          source_company_contact_id: this.contactId? this.contactId : this.contactEmailDetail
            ? this.contactEmailDetail.contact_id
            : null,
        });
      })
      .then((res) => {
        this.logTransaction(
          "Create project record",
          "Completed",
          `Created project record`,
          projectId,
          submissionId,
          "detail"
        );

        return this.apiService.createProjectSubmission({
          user_id: this.dataStore.currentUser["user_id"],
          submitter_email: this.submitterEmail,
          submission_id: submissionId,
          submission_name: submissionName,
          project_id: projectId,
          project_name: projectName,
          customer_id: this.dataStore.currentUser["customer_id"],
          received_datetime: submissionDateTime,
          user_timezone: this.projectTimezone,
          submission_type: "user",
        });
      })
      .then((res) => {
        this.logTransaction(
          "Create project submission record",
          "Completed",
          `Created project submission record`,
          projectId,
          submissionId,
          "detail"
        );

        return this.apiService.updateProjectStatus(
          projectId,
          submissionId,
          "Processing",
          "Created"
        );
      })
      .then((res) => {
        return this.amazonService.createPublishJobRecord({
          submission_id: submissionId,
          process_status: "queued",
          project_id: projectId,
          project_name: projectName,
          submission_type: "user",
          submitter_email: this.submitterEmail,
          user_timezone: this.projectTimezone,
          process_attempts: 0,
          publish_datetime: submissionDateTime,
        });
      })
      .then((res) => {
        this.logTransaction(
          "Create publish job record",
          "Completed",
          `Created 960 WIP table record`,
          projectId,
          submissionId,
          "detail"
        );

        return new Promise((resolve, reject) => {
          this._destinationSettingsApi
            .findCustomerDestination(this.dataStore.currentUser.customer_id)
            .then((res) => {
              return resolve(res);
            })
            .catch((err) => {
              this._destinationSettingsApi
                .findCustomerDestination("TrialUser")
                .then((trialRes) => {
                  return resolve(trialRes);
                })
                .catch((error) => {
                  return reject(error);
                });
            });
        });
      })
      .then((res) => {
        this.logTransaction(
          "Create project document records",
          "Completed",
          `Created ${this.droppedFiles.length} project_documents records`,
          projectId,
          submissionId,
          "detail"
        );

        let tasks = [];

        this.droppedFiles.forEach((droppedFile, index) => {
          let params = {
            customer_id: this.dataStore.currentCustomer.customer_id,
            // customer_source_sys_id: this._selectedProject.customer_source_sys_id,
            destination_id: res["destination_id"],
            destination_path: res["destination_root_path"],
            destination_sys_type: res["destination_type_name"],
            email_file_key: "",
            // file_original_create_datetime: '',
            file_original_filename: droppedFile.filename,
            // file_original_modified_datetime: '',
            // message_id: '',
            original_filepath: droppedFile.filepath,
            process_attempts: 0,
            // process_end_datetime: '',
            process_status: "queued",
            // process_start_datetime: '',
            project_id: projectId,
            project_name: projectName,
            project_number: this.projectNumber,
            // source_company_id: this._selectedProject.source_company_id,
            // source_company_name: this._selectedProject.source_company_name,
            // source_company_url: '',
            // source_contact_email: '',
            // source_contact_firstname: '',
            // source_contact_lastname: '',
            // source_contact_id: '',
            // source_contact_phone: '',
            // source_password: this._selectedProject.source_password,
            // source_sys_type_id: this._selectedProject.source_sys_type_id,
            // source_sys_type_name: this._selectedProject.source_sys_type_name,
            // source_token: this._selectedProject.source_token,
            source_url: this.source,
            // source_username: this._selectedProject.source_username,
            submission_datetime: submissionDateTime,
            submission_id: submissionId,
            submission_name: submissionName,
            submission_type: "user",
            // submitter_device_ip: '',
            submitter_email: this.submitterEmail,
            // submitter_ip: '',
            temp_bucket_name: this.amazonService.tempBucketName,
            temp_vault_key: droppedFile.filekey,
            // to_email_address: '',
            user_id: this.dataStore.currentUser.user_id,
            user_timezone: this.projectTimezone,
            create_user_id: this.dataStore.currentUser.user_id,
            edit_user_id: this.dataStore.currentUser.user_id,
            id_922: uuid(),
            event_type: "INSERT",
            processing_type: "lambda",
          };

          tasks.push(this.amazonService.createFilePreprocessingRecord(params));
        });

        return Promise.all(tasks);
      })
      .then((res) => {
        this.logTransaction(
          "Create file preprocessing records",
          "Completed",
          `Created 922 WIP table records`,
          projectId,
          submissionId,
          "detail"
        );
        return this.apiService.updateProjectStatus(
          projectId,
          submissionId,
          "Processing",
          "Processing"
        );
      })
      .then((res) => {
        this.logTransaction(
          "Add Project",
          "Completed",
          `Successfully created project`,
          projectId,
          submissionId,
          "summary"
        );

        this.spinner.hide();
        this.reset();
        this.addProjectModal.nativeElement.style.display = "none";
        this.parent.onRefresh();
        this.notificationService.success(
          "Success",
          "Project has been created",
          { timeOut: 3000, showProgressBar: false }
        );
      })
      .catch((err) => {
        this.spinner.hide();
        this.notificationService.error("Error", err, {
          timeOut: 3000,
          showProgressBar: false,
        });
        this.logTransaction(
          "Add Project",
          "Failed",
          CircularJSON.stringify(err),
          "",
          "",
          "detail"
        );
      });

      this.companyId="";
      this.contactId="";
  }

  onCancel(event) {
    event.preventDefault();
    localStorage.removeItem("project-source");
    this.reset();
    this.addProjectModal.nativeElement.style.display = "none";
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
    project_id: string = "",
    submission_id: string = "",
    transaction_level: string
  ) {
    this.loggerService.logAppTransaction({
      routine_name: "Customer Portal",
      function_name: "Add Project",
      user_id: this.dataStore.currentUser["user_id"],
      customer_id: this.dataStore.currentCustomer["customer_id"],
      operation_name: operation,
      operation_status: status,
      operation_status_desc: description,
      project_id: project_id,
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
    this.projectName = "";
    this.projectDescription = "";
    this.projectBidDateTime = null;
    this.submitterEmail = "";
    this.projectAdminUserId = "";
    this.source = "";
    this.status = "";
    this.projectAddress1 = "";
    this.projectAddress2 = "";
    this.projectCity = "";
    this.projectState = "";
    this.projectZip = "";
    this.preBidDateTime = null;
    this.projectStartDateTime = null;
    this.projectFinishDateTime = null;
    this.workStartDateTime = null;
    this.workFinishDateTime = null;
    this.expectedAwardDateTime = null;
    this.awardDateTime = null;
    this.expectedContractDateTime = null;
    this.contractDateTime = null;
    this.projectNumber = "";
    this.contractType = "";
    this.projectStage = "";
    this.projectSegment = "";
    this.buildingType = "";
    this.laborRequirement = "";
    this.projectValue = "";
    this.projectSize = "";
    this.constructionType = "";
    this.awardStatus = "";
    this.autoUpdateStatus = false;
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
