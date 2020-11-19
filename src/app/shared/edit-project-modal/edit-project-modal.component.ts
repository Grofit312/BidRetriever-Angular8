import { Component, OnInit, ViewChild, ElementRef, ViewEncapsulation } from '@angular/core';
import { DataStore } from 'app/providers/datastore';
import { NotificationsService } from 'angular2-notifications';
import { NgxSpinnerService } from 'ngx-spinner';
import { ProjectsApi } from 'app/customer-portal/my-projects/my-projects.api.service';
import { ValidationService } from 'app/providers/validation.service';
import { Logger } from 'app/providers/logger.service';
import { DatePicker } from 'angular2-datetimepicker';
import * as moment from 'moment';
import * as uuid from "uuid/v1";
import { MyCalendarApi } from 'app/customer-portal/my-calendar/my-calendar.component.api.service';
import { CompanyOfficeApi } from 'app/customer-portal/system-settings/company-office-setup/company-office-setup.api.service';
import { UserInfoApi } from 'app/customer-portal/system-settings/user-setup/user-setup.api.service';
import { CompaniesApi } from 'app/customer-portal/my-companies/my-companies.api.service';
import { ContactApi } from 'app/customer-portal/view-company/company-employees/company-employees.component.api.service';
import DataSource from 'devextreme/data/data_source';
import { SourceSystemAccountsApi } from 'app/customer-portal/system-settings/source-system-accounts/source-system-accounts.api.service';
const CircularJSON = require('circular-json');


@Component({
  selector: 'edit-project-modal',
  templateUrl: './edit-project-modal.component.html',
  styleUrls: ['./edit-project-modal.component.scss'],
  providers: [MyCalendarApi, ProjectsApi, CompanyOfficeApi, UserInfoApi],
  encapsulation: ViewEncapsulation.None
})
export class EditProjectModalComponent implements OnInit {
  @ViewChild('editProjectModal', { static: true }) editProjectModal: ElementRef;
  parent = null;


  currentProject:any = {};
  preBidDateTime:any = {};
  projectStartDateTime:any = {};
  projectFinishDateTime:any = {};
  workStartDateTime:any = {};
  workFinishDateTime:any = {};
  expectedAwardDateTime:any = {};
  awardDateTime:any = {};
  expectedContractDateTime:any = {};
  contractDateTime:any = {};
  selectedItem: any;
  viewMode = 'basic';
  offices = [];
  companyUsers = [];
  data: any;
  email_company: any;
  company_office_id: any;
  contactEmailDetail: any;
  contactFirstName:any;
  contactSecondName:any;
  companyTypeList: any;
  selectedCompanyId = 0;
  searchModeOption: string = "contains";
  searchExprOption: any = "company_name";
  searchTimeoutOption: number = 200;
  minSearchLengthOption: number = 0;
  sourceSystemTypes: any[];
  submitterEmail:any;

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
  company_website: any;
  companyData: any;
  company_email:any;
  source_sys_url:any;
  source_sys_type_id:any;
  contact_firstname:any;
  company_name: any;
  company_array: any[]=[];
  company_id: any;
  customerId: any;
  
  contactData: any;
  company_domain ="";

  constructor(
    public dataStore: DataStore,
    private notificationService: NotificationsService,
    private spinner: NgxSpinnerService,
    private apiService: ProjectsApi,
    private validationService: ValidationService,
    private loggerService: Logger,
    public calendarApi: MyCalendarApi,
    private userApiService: UserInfoApi,
    private officeApi: CompanyOfficeApi,
     private companyApi: CompaniesApi, 
    private contactApi: ContactApi,
    private sourceSystemAccountsApi: SourceSystemAccountsApi,
  ) {
    DatePicker.prototype.ngOnInit = function() {
      this.settings = Object.assign(this.defaultSettings, this.settings);
      if (this.settings.defaultOpen) {
      this.popover = true;
      }
      this.date = new Date();
      };
  }

  ngOnInit() {
    
    if (!this.dataStore.currentUser) {
      this.dataStore.authenticationState.subscribe(value => {
        if(value){
          this.getCompanyList();
          this.sourceSystemAccounts();
        }
      });
    }
    this.getCompanyList();
    if(this.currentProject.source_company_id)
    {
      this.getContactList(this.currentProject.source_company_id);
    }
    this.sourceSystemAccounts();
}
  fillSourceCompanyFields(project: any) {
    debugger;

    this.apiService.getProject(project.project_id)
    .then(res => {
      if(res['source_company_id']) {
        //#region  Load Company Fields 
        this.companyId = res['source_company_id'];
        this.getContactList(this.companyId);
        this.contactId = res['source_company_contact_id'];
      
       return this.companyApi.getCompany(this.companyId, 'eastern');
      }
    })
        .then(com => {
            this.company_website = com[0]['company_website'];
           return this.contactApi.getEmployee(this.contactId, 'eastern');

        })
        .then(con => {
            this.contactFirstName = con[0]['contact_firstname'];
            this.contactSecondName = con[0]['contact_lastname'];
        })
        .catch(err => {
          console.log(err);
          this.companyId="";
          this.contactId="";
        });
        //#endregion
      
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
        this.dataStore.currentCustomer.customer_id
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
      this.companyApi.findCompaniesByCustomerId(
          this.dataStore.currentCustomer["customer_id"],
          this.dataStore.currentCustomer["customer_timezone"] || "eastern",
          null
        )
        .then((res: any) => {
          this.companyTypeList = new DataSource({store: {data:  res, type:'array', key: 'company_id'}});
        });
    }
  }
  getContactList(company_id:any) {
    
    if (this.dataStore.currentCustomer != null ) {
      this.contactApi
        .findCompanyContact(this.dataStore.currentCustomer["customer_id"], company_id, this.dataStore.currentCustomer["customer_timezone"] || "eastern")
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
    this.hasNewCompany = "true";
    event.customItem = newItem;
    this.companyData = newItem;
 }
  hasNewContact ="";
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
    this.data = event.itemData;
    this.company_website = event.itemData["company_website"];
    this.company_domain = event.itemData["company_domain"];
    this.companyData = event.itemData;
    this.companyId =  event.itemData["company_id"];
    this.getContactList(event.itemData["company_id"]);
  }
  
  onContactSelected(event) {
    this.hasNewContact = "";
    this.data = event.itemData;
    this.contactFirstName = event.itemData["contact_firstname"];
    this.contactSecondName = event.itemData["contact_lastname"];
this.contactId = event.itemData["contact_id"];
    this.contactData = event.itemData;
  }
  onEmailDetail(email) {
    ;
    const params: any = {
      contact_email: email.component["_changedValue"],
      contact_firstname: this.contactFirstName,
      contact_lastname: this.contactSecondName,
      customer_id: this.offices[0].customer_id,  
    };
    this.sourceSystemAccountsApi.createContactEmail(params).then((res: any) => {
      
      this.contactEmailDetail =  res.data;   
      if(res.data){
        this.notificationService.success(
          "Success",
          "New contact is created",
          { timeOut: 3000, showProgressBar: false }
        );
      }
    });
  }

  initialize(parent: any, project: any) {
    this.parent = parent;
    this.editProjectModal.nativeElement.style.display = 'block';
    const timezone = this.dataStore.currentCustomer ? (this.dataStore.currentCustomer['customer_timezone'] || 'eastern') : 'eastern';
    this.currentProject = project;
    this.fillSourceCompanyFields(this.currentProject);
    this.currentProject['project_auto_update_status'] = project['auto_update_status'] === 'active';
    this.currentProject['project_bid_datetime'] = project['project_bid_datetime'] === 'Invalid date' ? null : project['project_bid_datetime'];
    this.company_name=this.currentProject['source_company_name'];

    this.userApiService.findUsers(this.dataStore.currentUser['customer_id'])
      .then((users: any[]) => {
        this.companyUsers = users.filter(({ status }) => status === 'active');
        this.companyUsers = this.companyUsers.sort((firstUser, secondUser) => {
          const firstUserEmail = firstUser.user_email ? firstUser.user_email.toLowerCase() : '';
          const secondUserEmail = secondUser.user_email ? secondUser.user_email.toLowerCase() : '';
          return firstUserEmail.localeCompare(secondUserEmail);
        });
        return this.calendarApi.findCalendarEvents(null, this.currentProject['project_id'], timezone);
      })
      .then((res: any[]) => {
        this.preBidDateTime = res.find(event => event.calendar_event_type === 'project_prebid_mtg_datetime') || {};
        this.projectStartDateTime = res.find(event => event.calendar_event_type === 'project_start_datetime') || {};
        this.projectFinishDateTime = res.find(event => event.calendar_event_type === 'project_complete_datetime') || {};
        this.workStartDateTime = res.find(event => event.calendar_event_type === 'project_work_start_datetime') || {};
        this.workFinishDateTime = res.find(event => event.calendar_event_type === 'project_work_end_datetime') || {};
        this.expectedAwardDateTime = res.find(event => event.calendar_event_type === 'project_expected_award_datetime') || {};
        this.awardDateTime = res.find(event => event.calendar_event_type === 'project_award_datetime') || {};
        this.expectedContractDateTime = res.find(event => event.calendar_event_type === 'project_expected_contract_datetime') || {};
        this.contractDateTime = res.find(event => event.calendar_event_type === 'project_contract_datetime') || {};

        return this.officeApi.findOffices(this.dataStore.currentUser['customer_id']);
      })
      .then((offices: any[]) => {
        this.offices = offices;
      })
      .catch(err => {
        this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
      });
  }

  onClickTab(_: any, index: number) {
    if (index === 1) {
      this.viewMode = 'basic';
    } else if (index === 2) {
      this.viewMode = 'date';
    } else if (index === 3) {
      this.viewMode = 'detail';
    } else if (index === 4) {
      this.viewMode = 'source'
    }else {
      this.viewMode = 'basic';
    }
  }

  onSaveProject() {
    
    if (!this.currentProject['project_name'] || !this.currentProject['project_name'].trim()) {
      return this.notificationService.error('Error', 'Please input project name', { timeOut: 3000, showProgressBar: false });
    }

    const projectName = this.validationService.validateProjectName(this.currentProject['project_name']);

    if (projectName.length === 0) {
      this.notificationService.error('Error', 'Project name cannot be empty', { timeOut: 3000, showProgressBar: false });
      return;
    }

    const projectOffice = this.offices.find(office => office['company_office_id'] === this.currentProject['project_assigned_office_id']);
    
    if(this.hasNewCompany){
      this.companyId="";
      this.companyId = uuid();
    
      this.companyApi.createCompany({
        company_id: this.companyId,
        company_name: this.companyData["company_name"],
        user_id: this.dataStore.currentUser.user_id,
        company_website: this.company_website,
        company_domain: this.company_domain,
        customer_id: this.dataStore.currentUser['customer_id'],
      }).then(res => {
        this.companyId = res['company_id'];
      })
      .catch(err => {
        console.log(err);
        this.companyId="";
      });
  
    }
    
    if(this.hasNewContact){
      this.contactId="";
      this.contactId = uuid();
      const params: any = {
        contact_id: this.contactId,
        company_id: this.companyId? this.companyId : (this.data && this.data.company_id) ? this.data.company_id : null,
        contact_email: this.contactData["contact_email"]  ,
        contact_firstname: this.contactFirstName,
        contact_lastname: this.contactSecondName,
        contact_display_name: `${this.contactFirstName} ${this.contactSecondName}`,   
        customer_id: this.offices[0].customer_id,
      };
  
      this.contactApi.createContact(params)
      .then(res => {
        this.contactId = res['contact_id'];
      })
      .catch(err => {
        console.log(err);
        this.contactId="";
      });
    }
            
    const params = Object.assign(
      {},
      this.currentProject,
      { project_name: projectName },     
      { source_company_id: this.companyId? this.companyId : (this.data && this.data.company_id) ? this.data.company_id : this.currentProject.source_company_id },
      { source_company_contact_id: this.contactId? this.contactId : this.contactEmailDetail ? this.contactEmailDetail.contact_id : ""},     
      { company_website: this.company_website?this.company_website:""},
      { project_bid_datetime: this.currentProject['project_bid_datetime'] ? this.formatDateTime(this.currentProject['project_bid_datetime']) : "NULL" },
      { project_assigned_office_name: projectOffice ? projectOffice['company_office_name'] : '' },
      { auto_update_status: this.currentProject['project_auto_update_status'] ? 'active' : 'inactive' }, 
      { source_sys_type_id : this.source_sys_type_id}
    );
    this.spinner.show();
    this.apiService.updateProject(this.currentProject['project_id'], params).then(res => this.updateProjectEvents())
    .then(res => {
      this.spinner.hide();
      this.notificationService.success('Updated', 'Project has been updated', { timeOut: 3000, showProgressBar: false });

      this.reset();
      this.editProjectModal.nativeElement.style.display = 'none';
      this.parent.onRefresh();

      this.logTransaction('Edit Project', 'Completed', `Successfully updated project`, this.currentProject['project_id'], '', 'summary');
    }).catch(err => {
      this.spinner.hide();
      this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });

      this.logTransaction('Edit Project', 'Failed', CircularJSON.stringify(err), '', '', 'detail');
    });
    this.companyId="";
    this.contactId="";
  }

  updateProjectEvents() {
    const tasks = [];
    tasks.push(this.updateProjectEvent(this.preBidDateTime, 'Prebid Meeting Date', 'project_prebid_mtg_datetime'));
    tasks.push(this.updateProjectEvent(this.projectStartDateTime, 'Start Date', 'project_start_datetime'));
    tasks.push(this.updateProjectEvent(this.projectFinishDateTime, 'Finish Date', 'project_complete_datetime'));
    tasks.push(this.updateProjectEvent(this.workStartDateTime, 'Work Start Date', 'project_work_start_datetime'));
    tasks.push(this.updateProjectEvent(this.workFinishDateTime, 'Work Finish Date', 'project_work_end_datetime'));
    tasks.push(this.updateProjectEvent(this.expectedAwardDateTime, 'Expected Award Date', 'project_expected_award_datetime'));
    tasks.push(this.updateProjectEvent(this.awardDateTime, 'Award Date', 'project_award_datetime'));
    tasks.push(this.updateProjectEvent(this.expectedContractDateTime, 'Expected Contract Date', 'project_expected_contract_datetime'));
    tasks.push(this.updateProjectEvent(this.contractDateTime, 'Contract Date', 'project_contract_datetime'));
    return Promise.all(tasks);
    }  
 
  updateProjectEvent(eventData: any, event_name: string, event_type: string) {
    const customerId = this.currentProject['project_customer_id'] || this.dataStore.currentUser['customer_id'];
    const projectName = this.currentProject['project_name'];
    const projectId = this.currentProject['project_id'];
    const userId = this.currentProject['project_admin_user_id'] || this.dataStore.currentUser['user_id'];

    if (eventData['calendar_event_start_datetime']) {
      if (eventData['calendar_event_id']) {
        return this.calendarApi.updateCalendarEvent(
          eventData['calendar_event_id'],
          {calendar_event_start_datetime: this.formatDateTime(eventData['calendar_event_start_datetime'])}
        );
      } else {
        return this.calendarApi.createCalendarEvent({
          project_id: projectId,
          calendar_event_company_id: customerId,
          calendar_event_name: `${projectName} - ${event_name}`,
          calendar_event_organizer_company_id: customerId,
          calendar_event_organizer_user_id: userId,
          calendar_event_start_datetime: this.formatDateTime(eventData['calendar_event_start_datetime']),
          calendar_event_status: 'scheduled',
          calendar_event_type: event_type,
          calendar_event_company_office_id: this.currentProject['project_assigned_office_id'] || '',
        });
      }
    } else {
      return new Promise((resolve) => resolve());
    }
  }

  onCancel(event) {
    event.preventDefault();
    this.reset();
    this.editProjectModal.nativeElement.style.display = 'none';
  }

  logTransaction(operation: string, status: string, description: string, project_id: string = '', submission_id: string = '', transaction_level: string) {
    this.loggerService.logAppTransaction({
      routine_name: 'Customer Portal',
      function_name: 'Edit Project',
      user_id: this.dataStore.currentUser['user_id'],
      customer_id: this.dataStore.currentCustomer['customer_id'],
      operation_name: operation,
      operation_status: status,
      operation_status_desc: description,
      project_id: project_id,
      submission_id: submission_id,
      transaction_level: transaction_level,
    });
  }

  formatDateTime(timestamp: string) {
    return moment(timestamp).utc().format('YYYY-MM-DDTHH:mm:ss.SSSSSS') + 'Z';
  }

  reset() {
    this.currentProject = {};
    this.preBidDateTime = {};
    this.projectStartDateTime = {};
    this.projectFinishDateTime = {};
    this.workStartDateTime = {};
    this.workFinishDateTime = {};
    this.expectedAwardDateTime = {};
    this.awardDateTime = {};
    this.expectedContractDateTime = {};
    this.contractDateTime = {};
    this.viewMode = 'basic';
  }

  onClickDatePicker(event: any) {
    event.stopPropagation();
    event.preventDefault();
  }
}