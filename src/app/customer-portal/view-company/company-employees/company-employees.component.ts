import { Component, OnInit, ViewEncapsulation, HostListener, ElementRef, AfterViewInit, ViewChild } from '@angular/core';
import { DataStore } from 'app/providers/datastore';
import { NotificationsService } from 'angular2-notifications';
import { ValidationService } from 'app/providers/validation.service';
import { AuthApi } from 'app/providers/auth.api.service';
import { Logger } from 'app/providers/logger.service';
import { DxDataGridComponent, DxToolbarComponent, DxSelectBoxComponent } from 'devextreme-angular';
import CustomStore from 'devextreme/data/custom_store';
import DataSource from 'devextreme/data/data_source';
import { ProjectsApi } from 'app/customer-portal/my-projects/my-projects.api.service';
import { CompanyOfficeApi } from 'app/customer-portal/system-settings/company-office-setup/company-office-setup.api.service';
import { UserInfoApi } from 'app/customer-portal/system-settings/user-setup/user-setup.api.service';
import { MyCalendarApi } from 'app/customer-portal/my-calendar/my-calendar.component.api.service';
const moment = require('moment-timezone');
declare var jQuery: any;


@Component({
  selector: 'app-company-employees',
  templateUrl: './company-employees.component.html',
  styleUrls: ['./company-employees.component.scss']
})
export class CompanyEmployeesComponent implements OnInit {
  @ViewChild('projectContent', { static: false }) projectContent: ElementRef;

  @ViewChild('projectGrid', { static: false }) projectGrid: DxDataGridComponent;
  @ViewChild('projectToolbar', { static: false }) projectToolbar: DxToolbarComponent;
  @ViewChild('projectToolbarViewType', { static: false }) projectToolbarViewType: DxSelectBoxComponent;

  private PROJECT_TOOLBAR_INITIAL_VIEW = 'BidRetriever_Project_Page_Toolbar_Initial_View';

  projectGridColumns: any[];
  projectGridDataSource: any;
  projectGridContent = [];
  projectGridContentLoaded = false;

  projectViewTypeSelected = null;
  @ViewChild('transactionLogsModal', { static: false }) transactionLogsModal;
  @ViewChild('addContactModal', { static: false }) addContactModal;
  
  companyId: any;
  projectViewMode = 'my';
  searchText = '';
  currentOffice = null;

  toolbarConfig: any = {};
  toolbarUsersSelectBox: any = null;
  toolbarUsersContent = [];

  // Modal Flags
  isProjectDataViewModalShown = false;

  
  selectedCustomerId = null;
  source_company_id: any;
  customer_id: any;
  detail_level: string;

  get isBidRetrieverAdmin() { return this.dataStore.originUserEmail.includes('bidretriever.net'); }
  get isSysAdmin() { return this.dataStore.originUserRole === 'sys admin'; }
  constructor( private myCalenderApi: MyCalendarApi,
    public dataStore: DataStore,
    private apiService: ProjectsApi,
    private notificationService: NotificationsService,
    private validationService: ValidationService,
    private authApiService: AuthApi,
    private officeApiService: CompanyOfficeApi,
    private userInfoApiService: UserInfoApi,
    private logger: Logger) { 
      this.toolbarConfig = {
       
        search: {
          placeholder: 'Search',
          width: 200,
          valueChangeEvent: 'keyup',
          onValueChanged: (event) => this.toolbarSearchAction(event)
        },
  
        viewContact: {
          type: 'normal',
          text: 'View Contact',
          onClick: () => this.toolbarViewContactAction()
        },
        addContact: {
          type: 'normal',
          text: 'Add Contact',
          onClick: () => this.toolbarAddContactAction()
        },
  
        others: {
         
          viewContact: {
            type: 'normal',
            text: 'View Contact',
            onClick: () => this.toolbarViewContactAction()
          },
          addContact: {
            type: 'normal',
            text: 'Add Contact',
            onClick: () => this.toolbarAddContactAction()
          },        
          viewTransactionLog: {
            type: 'normal',
            text: 'View Transaction Log',
            onClick: () => this.toolbarViewTransactionLogAction()
          },
          refreshGrid: {
            type: 'normal',
            text: 'Refresh Grid',
            onClick: () => this.toolbarRefreshGridAction()
          },
          help: {
            type: 'normal',
            text: 'Help',
            onClick: () => this.toolbarHelpAction()
          }
        }
      };
  
      this.projectGridDataSource = new CustomStore({
        key: 'contact_id',
        load: (loadOptions) => this.gridProjectLoadAction(loadOptions),
        
      });
    }
     
 
  ngOnInit() {
  }
  
  
  /* Switch Project View Mode */
  onChangeProjectViewMode() {
    this.toolbarRefreshGridAction();
  }
 
  private getGridProjectContentByLoadOption(loadOptions) {
    
    let projects = this.projectGridContent;
    if (loadOptions.sort && loadOptions.sort.length > 0) {
      projects = projects.sort((first, second) => {
        const sortColumnOption = this.projectGridColumns.find((column) => column.dataField === loadOptions.sort[0].selector);

        let firstValue = first[loadOptions.sort[0].selector];
        let secondValue = second[loadOptions.sort[0].selector];

        if (sortColumnOption) {
          if (sortColumnOption.dataType === 'date' || sortColumnOption.dataType === 'datetime') {
            firstValue = new Date(firstValue).getTime();
            secondValue = new Date(secondValue).getTime();
            firstValue = firstValue.toString().toLowerCase();
            secondValue = secondValue.toString().toLowerCase();
          }
        }
        let loadOptionIndex = 0;
        while (loadOptionIndex < loadOptions.sort.length) {
          if (firstValue > secondValue && loadOptions.sort[loadOptionIndex].desc) {
            return -1;
          }
          if (firstValue < secondValue && !loadOptions.sort[loadOptionIndex].desc) {
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
      projects = projects.filter((project) => {
        const isMatched = Object.keys(project).map(key => project[key]).some(item =>  (item?item:'').toString().toLowerCase().includes(this.searchText));
        return isMatched;
      });
    }

    return projects;
  }

  gridProjectLoadAction(loadOptions) {
    return new Promise((resolve, reject) => {
      if (this.projectGridContentLoaded) {
        const filteredProjects = this.getGridProjectContentByLoadOption(loadOptions);
        return resolve({
          data: filteredProjects,
          totalCount: filteredProjects.length
        });
      }

    
      
      this.customer_id =this.dataStore.currentCompany.customer_id;

      const findProjects= this.myCalenderApi.findCompanyContact(this.customer_id, this.dataStore.currentCompany.company_id); 
      Promise.all([findProjects])
        .then(([projects, dataViewFieldSettings]) =>  {
          this.projectGridContent = projects as any[];
          this.projectGridContentLoaded = true;
          if (!this.projectViewTypeSelected) {
            this.projectGridColumns = [
              { dataField: 'contact_id', dataType: 'number', caption: 'Contact Id', width: 250, visible: false, allowEditing: false },
              { dataField: 'contact_display_name', caption: 'Name', width: 400, minWidth: 250, allowEditing: true },              
              { dataField: 'contact_title', caption: 'Title', width: 400, minWidth: 250, allowEditing: true },
              { dataField: 'contact_city', caption: 'City', width: 400, minWidth: 250, allowEditing: true },
              { dataField: 'contact_mobile_phone', caption: 'Mobile', width: 400, minWidth: 250, allowEditing: true },
              { dataField: 'contact_email', caption: 'Email', width: 400, minWidth: 250, allowEditing: true },
              { dataField: 'contact_phone', caption: 'Office Phone', width: 400, minWidth: 250, allowEditing: true },    
              { dataField: 'edit_datetime', caption: 'Last Activity Date', width: 400, minWidth: 250, allowEditing: true },    
              { dataField: 'contact_status', caption: 'Lead Status', width: 400, minWidth: 250, allowEditing: true },                    
            ];
          } else {
            const newGridColumnList = [];
            const editingAllowedColumns = [
              'contact_firstname', 'project_number'
              
            ];
            if(dataViewFieldSettings != undefined && dataViewFieldSettings != null ){
              
            (dataViewFieldSettings as any[]).forEach((viewFieldSetting) => {
              const newGridColumn = {
                dataField: viewFieldSetting.data_view_field_name,
                allowEditing: false
              };
              if (viewFieldSetting.data_view_field_name.includes('datetime')) {
                newGridColumn['dataType'] = 'date';
                newGridColumn['cellTemplate'] = 'dateCell';
                newGridColumn['editCellTemplate'] = 'dateTimeEditor';
              }
              if (viewFieldSetting.data_view_field_heading) {
                newGridColumn['caption'] = viewFieldSetting.data_view_field_heading;
              }
              if (viewFieldSetting.data_view_field_width) {
                newGridColumn['width'] = Number(viewFieldSetting.data_view_field_width) * 10 + 10;
              }
              if (viewFieldSetting.data_view_field_alignment) {
                newGridColumn['alignment'] = viewFieldSetting.data_view_field_alignment;
              }
              if (viewFieldSetting.data_view_field_sequence) {
                newGridColumn['visibleIndex'] = viewFieldSetting.data_view_field_sequence;
              }
              if (viewFieldSetting.data_view_field_sort) {
                newGridColumn['sortOrder'] = viewFieldSetting.data_view_field_sort.toLowerCase();
              }
              if (viewFieldSetting.data_view_field_sort_sequence) {
                newGridColumn['sortIndex'] = viewFieldSetting.data_view_field_sort_sequence;
              }
              if (viewFieldSetting.data_view_field_display) {
                newGridColumn['visible'] = viewFieldSetting.data_view_field_display === 'display';
              }

              if (editingAllowedColumns.includes(viewFieldSetting.data_view_field_name)) {
                newGridColumn['allowEditing'] = true;
              }

              switch (viewFieldSetting.data_view_field_name) {
                case 'project_admin_user_email':
                  newGridColumn['cellTemplate'] = 'projectAdminUserEmailCell';
                  newGridColumn['editCellTemplate'] = 'projectAdminUserEmailEditor';
                  break;
              }

              newGridColumnList.push(newGridColumn);
            });
            
          }

            this.projectGridColumns = newGridColumnList;
          }

          const filteredProjects = this.getGridProjectContentByLoadOption(loadOptions);
          return resolve({
            data: filteredProjects,
            totalCount: filteredProjects.length
          });
        })
        .catch((error) => {
          console.log('Load Error', error);
          this.notificationService.error('Error fgd', error, { timeOut: 3000, showProgressBar: false });
          this.projectGridContent = [];
          this.projectGridContentLoaded = false;
          return resolve({
            data: this.projectGridContent,
            totalCount: this.projectGridContent.length
          });
        });
    });
  }

  
  /** Toolbar Actions **/
  /* Toolbar Project ViewType SelectBox Action */
  toolbarProjectViewTypeLoadAction(loadOptions) {
    return new Promise((resolve, reject) => {
      let customerId = null;
      if (this.dataStore.currentCustomer && this.dataStore.currentCustomer.customer_id) {
        customerId = this.dataStore.currentCustomer.customer_id;
      }
      this.apiService.findDataViews('projects', customerId)
        .then((viewTypes: any[]) => {
          viewTypes.push({
            view_id: 'manage_project_views',
            view_name: 'Manage Project Views'
          });
          return resolve(viewTypes);
        })
        .catch((error) => {
          this.notificationService.error('Error', error, { timeOut: 3000, showProgressBar: false });
          return resolve([]);
        })
    });
  }



  toolbarSearchAction(event) {
    this.searchText = event.value.toLowerCase();
    if (this.projectGrid && this.projectGrid.instance) {
      this.projectGrid.instance.refresh();
    }
  }



toolbarAddContactAction() {
    this.addContactModal.initialize(this);
  }

  

  toolbarViewContactAction() {
    const { selectedRowKeys } = this.projectGrid;
    if (selectedRowKeys.length === 0) {
      this.notificationService.error('No Selection', 'Please select one Contact!', { timeOut: 3000, showProgressBar: false });
      return;
    } else if (selectedRowKeys.length > 1) {
      this.notificationService.error('Multiple Selection', 'Please select just one Contact!', { timeOut: 3000, showProgressBar: false });
      return;
    }
    const selectedRows = this.projectGridContent.filter(({ contact_id: contactId }) => selectedRowKeys.includes(contactId));
    window.open(`/customer-portal/view-employee/${selectedRows[0].contact_id}/overview`, '_blank');
  }

  
  /* View Transaction Log */
  toolbarViewTransactionLogAction() {
    const { selectedRowKeys } = this.projectGrid;
    if (selectedRowKeys.length === 0) {
      this.notificationService.error('No Selection', 'Please select one project!', { timeOut: 3000, showProgressBar: false });
      return;
    } else if (selectedRowKeys.length > 1) {
      this.notificationService.error('Multiple Selection', 'Please select just one project!', { timeOut: 3000, showProgressBar: false });
      return;
    }

    const selectedRows = this.projectGridContent.filter(({ contact_id: projectId }) => selectedRowKeys.includes(projectId));
    this.transactionLogsModal.initialize(selectedRows[0]);
  }

  toolbarRefreshGridAction() {
    this.projectGridContentLoaded = false;
    if (this.projectGrid && this.projectGrid.instance) {
      this.projectGrid.instance.refresh();
    }
  }

  toolbarHelpAction() {
  }

 
  addProjectGridMenuItems(e) {
;
    if (!e.row) { return; }

    if (!e.row.data.project_bid_datetime) {
      e.row.data.project_bid_datetime = null;
    }

    e.component.selectRows([e.row.data.contact_id]);

    if (e.row && e.row.rowType === 'data') {   // e.items can be undefined
      if (!e.items) { e.items = []; }

      // Add a custom menu item
      e.items.push(
        {
          type: 'normal',
          text: 'View Contact',
          onClick: () => this.toolbarViewContactAction()
        },
        {
          type: 'normal',
          text: 'Add Contact',
          onClick: () => this.toolbarAddContactAction()
        }, 
        {
          type: 'normal',
          text: 'View Transaction Log',
          onItemClick: () => this.toolbarViewTransactionLogAction()
        },
        {
          type: 'normal',
          text: 'Refresh Grid',
          onItemClick: () => this.toolbarRefreshGridAction()
        },
        {
          type: 'normal',
          text: 'Help',
          onItemClick: () => this.toolbarHelpAction()
        }
      );
    }
    return e;
  }


}
