import { Component, OnInit, ViewChild } from "@angular/core";
import { DataStore } from "app/providers/datastore";
import { MyCalendarApi } from "app/customer-portal/my-calendar/my-calendar.component.api.service";
import { NotificationsService } from "angular2-notifications";
import { ViewCompanyApi } from "../view-company.api.service";
import { ActivatedRoute } from "@angular/router";
import { MomentPipe } from "app/shared/pipes/moment.pipe";
import { DxDataGridComponent } from 'devextreme-angular';

@Component({
  selector: 'app-company-overview',
  templateUrl: './company-overview.component.html',
  styleUrls: ['./company-overview.component.scss'],
  providers: [MyCalendarApi, MomentPipe],
})
export class CompanyOverviewComponent implements OnInit {
  @ViewChild('editCompanyModal', { static: false }) editCompanyModal;
  @ViewChild('editProjectModal', { static: false }) editProjectModal;
  @ViewChild('addContactModal', { static: false }) addContactModal;
  @ViewChild('addEventModal', { static: false }) addEventModal;
  @ViewChild('projectGrid', { static: false }) projectGrid: DxDataGridComponent;
  @ViewChild('employeeGrid', { static: false }) employeeGrid: DxDataGridComponent;
  lat = 51.678418;
  lng = 7.809007;

  noAddress = false;
  rowData: { timestamp: any; name: string; event: any }[];
  
  projectGridColumns = [
    {caption: 'project Id', dataField: 'project_id', minWidth:'100', allowEditing: false, visible: false},
    {caption: 'Project Name',dataField: 'project_name',minWidth: 200,allowEditing: false},
    {caption: 'Bid Date',dataField: 'project_bid_datetime',minWidth: 100, cellTemplate: 'dateCell', allowEditing: false},
    {caption: 'Office Assigned',dataField: 'project_assigned_office_name',minWidth: 100,allowEditing: false},
    {caption: 'Admin User',dataField: 'company_admin_displayname',minWidth: 100,allowEditing: false},
    {caption: 'Stage',dataField: 'project_stage',minWidth: 100,allowEditing: false},
    {caption: 'Value',dataField: 'project_value',minWidth: 100,allowEditing: false},
  
  ];

  employeeGridColumns = [
    { dataField: 'contact_id', dataType: 'number', caption: 'Contact Id', visible: false, allowEditing: false },
    { dataField: 'contact_last_first_name', caption: 'Name',  minWidth: 200, allowEditing: false },
    { dataField: 'contact_title', caption: 'Title', minWidth: 100, allowEditing: false },
    { dataField: 'contact_email', caption: 'Email', minWidth: 100, allowEditing: false },
    { dataField: 'contact_phone', caption: 'Phone', minWidth: 100, allowEditing: false },
    { dataField: 'contact_city_state', caption: 'Location', minWidth: 100, allowEditing: false },

  ];

  activeProjects=null;
  employees=null;

  constructor(
    private _momentPipe: MomentPipe,
    public dataStore: DataStore,
    public calendarApi: MyCalendarApi,
    private viewCompanyApi: ViewCompanyApi,

    private notificationService: NotificationsService,
    public route: ActivatedRoute
  ) {}

  ngOnInit() {
    var that = this;
    setTimeout(function () {
      that.loadMap();
    }, 3000);
    if (this.dataStore.currentCompany) {
      this.loadInfo();
      if (this.route.snapshot.queryParams["status"] === "edit") {
        this.onEditCompany();
      }
    } else {
      this.dataStore.getCompanyState.subscribe((value) => {
        if (value) {
          this.loadInfo();

          if (this.route.snapshot.queryParams["status"] === "edit") {
            this.onEditCompany();
          }
        }
      });
    }
  }

  loadInfo() {
    ;
    this.loadMap();
    this.loadDates();
    this.loadProjects();
    this.loadEmployees();
  }
loadEmployees() {
  this.employees = null;

  this.viewCompanyApi.findCompanyContact(
    this.dataStore.currentCompany.customer_id,
     this.dataStore.currentCompany.company_id,
     this.dataStore.currentCustomer ? (this.dataStore.currentCustomer['customer_timezone'] || 'eastern') : 'eastern'
     )
     .then((res: any[]) => {
      this.employees = res.sort((a, b) =>
      a.contact_last_first_name.toString().toLowerCase() > b.contact_last_first_name.toString().toLowerCase()
       ? 1 : a.contact_last_first_name.toString().toLowerCase() < b.contact_last_first_name.toString().toLowerCase() 
            ? -1 : 0);
    })
    .catch(err => {
      this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
    }); 
 
}
  loadProjects() {
    this.activeProjects = null;

    this.viewCompanyApi.findProjects(this.dataStore.currentCompany.company_id)
    .then((res: any[]) => {
      this.activeProjects = res.sort((a, b) =>
      a.project_bid_datetime > b.project_bid_datetime ? 1 : a.project_bid_datetime < b.project_bid_datetime ? -1 : 0);
    })
    .catch(err => {
      this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
    });

  }
  loadDates() {

    const companyDates = [
      {
        timestamp: this.dataStore.currentCompany["create_datetime"],
        name: "Company Created",
        event: null,
      },
      {
        timestamp: this.dataStore.currentCompany["edit_datetime"],
        name: "Company Edited",
        event: null,
      },
    ];
    const timezone = this.dataStore.currentCustomer ? (this.dataStore.currentCustomer['customer_timezone'] || 'eastern') : 'eastern';
    this.calendarApi
      .findCalendarEvents(this.dataStore.currentCompany["company_id"], null, timezone)
      .then((events: any[]) => {
        events.forEach((event) => {
          companyDates.push({
            timestamp: event.calendar_event_start_datetime,
            name: event.calendar_event_name,
            event,
          });
        });

        companyDates.sort((prev, next) => {
          if (prev.timestamp < next.timestamp) {
            return -1;
          } else {
            return 1;
          }
        });

        this.rowData = companyDates.map((companyDate) => {
          return {
            timestamp: this._momentPipe.transform(
              companyDate.timestamp,
              "YYYY-MM-DD hh:mm a z"
            ),
            name: companyDate.name,
            event: companyDate.event,
          };
        });
      })
      .catch((err) => {
        this.notificationService.error("Error", err, {
          timeOut: 3000,
          showProgressBar: false,
        });
      });
  }

  onViewDocuments() {
    
    const {
      currentUser: { user_id: userId },
    } = this.dataStore;
    window.open(
      `${window["env"].docViewerBaseUrl}?company_id=${this.dataStore.currentCompany["company_id"]}&user_id=${userId}&doc_id=unknown&folder_id=unknown&doc_type=normal`,
      "_blank"
    );
  }

  onAddCompanyEvent() {
    
    this.addEventModal.initialize(
      this,
      {
        startDate: new Date(),
        endDate: new Date(),
        company_id: this.dataStore.currentCompany['company_id'],
      }
    );
  }

  onEditCompany() {
    this.editCompanyModal.initialize(this, this.dataStore.currentCompany);
  }

  onDeleteProject() {
    //this.removeProjectModal.initialize([this.dataStore.currentProject], true, this);
  }

  loadMap() {
    try {
      const geocoder = new window["google"].maps.Geocoder();
      geocoder.geocode(
        { address: this.dataStore.currentCompany.company_address1 },
        (res, status) => {
          if (status === window["google"].maps.GeocoderStatus.OK) {
            new window["google"].maps.Map(
              document.getElementById("google_map"),
              {
                center: res[0].geometry.location,
                zoom: 16,
              }
            );
          } else {
            this.noAddress = true;
          }
        }
      );
    } catch (err) {
      this.notificationService.error("Error", err, {
        timeOut: 3000,
        showProgressBar: false,
      });
    }
  }
  onViewProject() {
    
  const { selectedRowKeys } = this.projectGrid;
  if(selectedRowKeys === null) return;

  if (selectedRowKeys.length === 0) {
    this.notificationService.error('No Selection', 'Please select one project!', { timeOut: 3000, showProgressBar: false });
    return;
  } else if (selectedRowKeys.length > 1) {
    this.notificationService.error('Multiple Selection', 'Please select a single project.', { timeOut: 3000, showProgressBar: false });
    return;
  } 
  window.open(`/customer-portal/view-project/${selectedRowKeys[0]['project_id']}`, '_blank');

  }
  
  addEmployeeGridMenuItems(e) {
    if (!e.row) { return; }
 
    if (e.row && e.row.rowType === 'data') {   // e.items can be undefined
      if (!e.items) { e.items = []; }
  
      e.items.push(
        {
          type: 'normal',
          text: 'View Contact',
          onItemClick: () => this.onViewContact()
        },
        // {
        //   type: 'normal',
        //   text: 'Edit Contact',
        //   onItemClick: () => this.onEditContact()
        // },
        {
          type: 'normal',
          text: 'Add Contact',
          onItemClick: () => this.onAddContact()
        },
        {
          type: 'normal',
          text: 'Call Contact',
          onItemClick: () => this.onCallContact()
        },
      
      );
  }
  }
  onCallContact() {
    const { selectedRowKeys } = this.employeeGrid;
    if(selectedRowKeys === null) return;

    if (selectedRowKeys.length === 0) {
      this.notificationService.error('No Selection', 'Please select one contact!', { timeOut: 3000, showProgressBar: false });
      return;
    } else if (selectedRowKeys.length > 1) {
      this.notificationService.error('Multiple Selection', 'Please select a single contact.', { timeOut: 3000, showProgressBar: false });
      return;
    }

    window.open('tel:' + selectedRowKeys[0]['contact_phone']);
  }
  toolbarRefreshGridAction() {
    this.loadEmployees();
  }
  onViewContact(){
    const { selectedRowKeys } = this.employeeGrid;
    if(selectedRowKeys === null) return;

    if (selectedRowKeys.length === 0) {
      this.notificationService.error('No Selection', 'Please select one contact!', { timeOut: 3000, showProgressBar: false });
      return;
    } else if (selectedRowKeys.length > 1) {
      this.notificationService.error('Multiple Selection', 'Please select a single contact.', { timeOut: 3000, showProgressBar: false });
      return;
    }
    window.open(`/customer-portal/view-employee/${selectedRowKeys[0]['contact_id']}/overview`, '_blank');
  }
  onAddContact() {
    this.addContactModal.initialize(this);
  }
  onEditContact() {
    throw new Error("Method not implemented.");
  }
  addProjectGridMenuItems(e) {
    if (!e.row) { return; }
 
    if (e.row && e.row.rowType === 'data') {   // e.items can be undefined
      if (!e.items) { e.items = []; }
  
      e.items.push(
        {
          type: 'normal',
          text: 'View Project',
          onItemClick: () => this.onViewProject()
        },
        {
          type: 'normal',
          text: 'Edit Project',
          onItemClick: () => this.onEditProjectAction()
        },
        {
          type: 'normal',
          text: 'View Project Documents',
          onItemClick: () => this.onViewProjectDocumentAction()
        },
      );
  }
}
  onEditProjectAction() {
    const { selectedRowKeys } = this.projectGrid;
    if(selectedRowKeys === null) return;
  
    if (selectedRowKeys.length === 0) {
      this.notificationService.error('No Selection', 'Please select one project!', { timeOut: 3000, showProgressBar: false });
      return;
    } else if (selectedRowKeys.length > 1) {
      this.notificationService.error('Multiple Selection', 'Please select a single project.', { timeOut: 3000, showProgressBar: false });
      return;
    } 
    const selectedRows = this.activeProjects.filter(({ project_id: projectId }) => selectedRowKeys.includes(projectId));
    
    this.editProjectModal.initialize(this, selectedRowKeys[0]);
     
  }
  onViewProjectDocumentAction() {
    const { selectedRowKeys } = this.projectGrid;
    if (selectedRowKeys.length === 0) {
      this.notificationService.error('No Selection', 'Please select one project!', { timeOut: 3000, showProgressBar: false });
      return;
    } else if (selectedRowKeys.length > 1) {
      this.notificationService.error('Multiple Selection', 'Please select just one project!', { timeOut: 3000, showProgressBar: false });
      return;
    }
    const { currentUser: { user_id: userId } } = this.dataStore;
    window.open(`${window['env'].docViewerBaseUrl}?project_id=${selectedRowKeys[0]['project_id']}&user_id=${userId}`, '_blank');
  }
  onRefresh() {
    window.location.reload();
  }

  onGridReady(params): void {
    params.api.sizeColumnsToFit();
  }
}
