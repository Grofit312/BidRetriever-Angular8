import { Component, OnInit, ViewEncapsulation, HostListener, ElementRef, AfterViewInit, ViewChild } from '@angular/core';
import { ProjectsApi } from './my-projects.api.service';
import { DataStore } from 'app/providers/datastore';
import { NotificationsService } from 'angular2-notifications';
import { ValidationService } from 'app/providers/validation.service';
import { RowNode } from 'ag-grid-community/dist/lib/entities/rowNode';
import { GridApi } from 'ag-grid-community/dist/lib/gridApi';
import { AuthApi } from 'app/providers/auth.api.service';
import { CompanyOfficeApi } from '../system-settings/company-office-setup/company-office-setup.api.service';
import { UserInfoApi } from '../system-settings/user-setup/user-setup.api.service';
import { Logger } from 'app/providers/logger.service';
import { DxDataGridComponent, DxToolbarComponent, DxSelectBoxComponent } from 'devextreme-angular';
import CustomStore from 'devextreme/data/custom_store';
import DataSource from 'devextreme/data/data_source';
import { DxiItemComponent } from 'devextreme-angular/ui/nested/item-dxi';
const moment = require('moment-timezone');
declare var jQuery: any;

class DatePicker {
  eInput;

  init(params) {
    // create the cell
    this.eInput = document.createElement('input');

    jQuery(this.eInput).datetimepicker({
      format: 'yyyy-mm-ddThh:ii:ss',
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
  selector: 'app-my-projects',
  templateUrl: './my-projects.component.html',
  styleUrls: ['./my-projects.component.scss'],
  encapsulation: ViewEncapsulation.None,
  providers: [ProjectsApi, CompanyOfficeApi, UserInfoApi]
})
export class MyProjectsComponent implements OnInit, AfterViewInit {
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

  projectGridEditorTemplateSource: any;

  @ViewChild('grid', { static: false }) grid;
  @ViewChild('addSubmissionModal', { static: false }) addSubmissionModal;
  @ViewChild('addProjectModal', { static: false }) addProjectModal;
  @ViewChild('editProjectModal', { static: false }) editProjectModal;
  @ViewChild('removeProjectModal', { static: false }) removeProjectModal;
  @ViewChild('transactionLogsModal', { static: false }) transactionLogsModal;

  projectViewMode = 'my';
  searchText = '';
  currentOffice = null;

  toolbarConfig: any = {};
  toolbarUsersSelectBox: any = null;
  toolbarUsersContent = [];
  sortName:any
  // Modal Flags
  isProjectDataViewModalShown = false;

  selectedUserId = null;
  selectedCustomerId = null;

  get isBidRetrieverAdmin() { return this.dataStore.originUserEmail.includes('bidretriever.net'); }
  get isSysAdmin() { return this.dataStore.originUserRole === 'sys admin'; }

  constructor(
    public dataStore: DataStore,
    private apiService: ProjectsApi,
    private notificationService: NotificationsService,
    private validationService: ValidationService,
    private authApiService: AuthApi,
    private officeApiService: CompanyOfficeApi,
    private userInfoApiService: UserInfoApi,
    private logger: Logger
  ) {
    this.toolbarConfig = {
      projectViewType: {
        width: 250,
        dataSource: new DataSource({
          store: new CustomStore({
            key: 'view_id',
            loadMode: 'raw',
            load: (loadOptions) => this.toolbarProjectViewTypeLoadAction(loadOptions)
          })
        }),
        showClearButton: true,
        valueExpr: 'view_id',
        displayExpr: 'view_name',
        onValueChanged: (event) => {
          if (event.value === 'manage_project_views') {
            this.projectToolbarViewType.value = event.previousValue;
            this.projectViewTypeSelected = event.previousValue;
            this.isProjectDataViewModalShown = true;
            return;
          }

          if (this.projectViewTypeSelected !== event.value) {
            this.projectViewTypeSelected = event.value;
            localStorage.setItem(this.PROJECT_TOOLBAR_INITIAL_VIEW, this.projectViewTypeSelected == null ? '' : this.projectViewTypeSelected);
            this.toolbarRefreshGridAction();
          }
        }
      },
      users: {
        width: 250,
        dataSource: new DataSource({
          store: new CustomStore({
            key: 'user_email',
            loadMode: 'raw',
            load: (loadOptions) => this.toolbarUsersLoadAction(loadOptions)
          })
        }),
        showClearButton: false,
        valueExpr: 'user_email',
        displayExpr: 'user_displayname',
        searchEnabled: true,
        searchTimeout: 200,
        searchMode: 'contains',
        searchExpr: 'user_email',
        onValueChanged: (event: any) => {
          this.onChangeUser(event.value);
        },
        onInitialized: (args: any) => {
          this.toolbarUsersSelectBox = args.component;
          if (this.dataStore.originUserEmail) {
            this.toolbarUsersSelectBox.getDataSource().load()
            .done((data) => {
              console.log('Users Data Loaded onInitialized');
            });
          }
        }
      },

      search: {
        placeholder: 'Search',
        width: 200,
        valueChangeEvent: 'keyup',
        onValueChanged: (event) => this.toolbarSearchAction(event)
      },

      viewProject: {
        type: 'normal',
        text: 'View Project',
        onClick: () => this.toolbarViewProjectAction()
      },
      addProject: {
        type: 'normal',
        text: 'Add Project',
        onClick: () => this.toolbarAddProjectAction()
      },

      others: {
        viewSourceProject: {
          type: 'normal',
          text: 'View Source Project',
          onClick: () => this.onViewProjectSourceSystem()
        },
        viewProject: {
          type: 'normal',
          text: 'View Project',
          onClick: () => this.toolbarViewProjectAction()
        },
        addProject: {
          type: 'normal',
          text: 'Add Project',
          onClick: () => this.toolbarAddProjectAction()
        },
        viewProjectDocuments: {
          type: 'normal',
          text: 'View Project Documents',
          onClick: () => this.toolbarViewProjectDocumentsAction()
        },
        editProject: {
          type: 'normal',
          text: 'Edit Project',
          onClick: () => this.toolbarEditProjectAction()
        },
        deleteProject: {
          type: 'normal',
          text: 'Delete Project',
          onClick: () => this.toolbarDeleteProjectAction()
        },
        archiveProject: {
          type: 'normal',
          text: 'Archive Project',
          onClick: () => this.toolbarArchiveProjectAction()
        },
        addDocumentsToProject: {
          type: 'normal',
          text: 'Add Documents To Project',
          onClick: () => this.toolbarAddDocumentsToProjectAction()
        },
        viewPublishedProject: {
          type: 'normal',
          text: 'View Published Project',
          onClick: () => this.toolbarViewPublishedProjectAction()
        },
        printProjectList: {
          type: 'normal',
          text: 'Print Project List',
          onClick: () => this.toolbarPrintProjectListAction()
        },
        exportProjectListToCsv: {
          type: 'normal',
          text: 'Export Project List  To CSV',
          onClick: () => this.toolbarExportProjectListToCsvAction()
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
      key: 'project_id',
      load: (loadOptions) => this.gridProjectLoadAction(loadOptions),
      update: (key, values) => this.gridProjectUpdateAction(key, values)
    });

    this.projectGridEditorTemplateSource = {
      status: [
        { id: 'active', name: 'active' },
        { id: 'inactive', name: 'inactive' },
        { id: 'deleted', name: 'deleted' },
        { id: 'archived', name: 'archived' }
      ],
      UpdateStatus: [
        { id: 'active', name: 'active' },
        { id: 'inactive', name: 'inactive' },       
      ],
      stage: [
        { id: 'Prospect', name: 'Prospect' },
        { id: 'Lead', name: 'Lead' },
        { id: 'Opportunity', name: 'Opportunity' },
        { id: 'Proposal', name: 'Proposal' },
        { id: 'Bid', name: 'Bid' },
        { id: 'Awarded', name: 'Awarded' },
        { id: 'Contract', name: 'Contract' },
        { id: 'Completed', name: 'Completed' },
        { id: 'Not Interested', name: 'Not Interested' },
        { id: 'Lost', name: 'Lost' }
      ],
      autoUpdateStatus: [
        { id: 'active', name: 'active' },
        { id: 'inactive', name: 'inactive' }
      ],
      timezone: [
        { id: 'eastern', name: 'eastern' },
        { id: 'central', name: 'central' },
        { id: 'mountain', name: 'mountain' },
        { id: 'pacific', name: 'pacific' }
      ],
      contractType: [
        { id: 'GMP Bid', name: 'GMP Bid' },
        { id: 'Negotiated', name: 'Negotiated' },
        { id: 'Design Build', name: 'Design Build' },
        { id: 'Time and Materials', name: 'Time and Materials' }
      ],
      segment: [
        { id: 'Commercial', name: 'Commercial' },
        { id: 'Industrial', name: 'Industrial' },
        { id: 'Heavy Highway', name: 'Heavy Highway' },
        { id: 'Residential', name: 'Residential' }
      ],
      buildingType: [
        { id: 'Healthcare', name: 'Healthcare' },
        { id: 'Government', name: 'Government' },
        { id: 'Retail', name: 'Retail' },
        { id: 'Residential', name: 'Residential' }
      ],
      laborRequirement: [
        { id: 'union', name: 'union' },
        { id: 'open shop', name: 'open shop' },
        { id: 'prevailing wage', name: 'prevailing wage' }
      ],
      constructionType: [
        { id: 'new construction', name: 'new construction' },
        { id: 'remodel', name: 'remodel' },
        { id: 'tenant improvements', name: 'tenant improvements' }
      ],
      awardStatus: [
        { id: 'Preparing Proposal', name: 'Preparing Proposal' },
        { id: 'Bid Submitted', name: 'Bid Submitted' },
        { id: 'Awarded', name: 'Awarded' },
        { id: 'Lost', name: 'Lost' },
        { id: 'Suspended Bid', name: 'Suspended Bid' }
      ]
    };
  }

  ngOnInit() {
    if (this.dataStore.currentUser) {
      this.load();
    } else {
      this.dataStore.authenticationState.subscribe(value => {
        if (value) {
          this.load();
        }
      });
    }
  }

  ngAfterViewInit() {
    setTimeout(() => this.onWindowResize(null), 500);

    if (this.projectGrid && this.projectGrid.instance) {
      this.projectGrid.instance.columnOption('command:select', 'allowFixing', true);
    }
  }

  @HostListener('window:resize', ['$event'])
  onWindowResize(event) {

    if (!this.projectContent) {
      return;
    }

    this.projectGrid.height = `${this.projectContent.nativeElement.offsetHeight}px`;
  }

  findMatchedProjectAdminUserDisplayName(email: string) {
    if (!this.projectGridEditorTemplateSource || !this.projectGridEditorTemplateSource.adminUserEmail) {
      return '';
    }

    const matchedUser = this.projectGridEditorTemplateSource.adminUserEmail.find((user) => user.user_email === email);
    if (matchedUser) {
      return matchedUser.user_displayname;
    }
    return '';
  }

  load() {
    this.loadAllUsers();
    this.loadCurrentOffice();

    const initialDataViewSelected = localStorage.getItem(this.PROJECT_TOOLBAR_INITIAL_VIEW);
    if (initialDataViewSelected) {
      this.projectViewTypeSelected = initialDataViewSelected;

      if (this.projectToolbarViewType && this.projectToolbarViewType.instance && this.projectViewTypeSelected) {
        this.projectToolbarViewType.instance.getDataSource().reload().then((data) => {
          if (this.projectToolbar.instance) {
            this.projectToolbar.instance.repaint();
          }
        });
      }
    }

    if (this.projectGrid && this.projectGrid.instance) {
      this.projectGrid.instance.refresh()
        .then(() => { })
        .catch((error) => {
          console.log('Grid Refresh Error', error);
        });
    }

    this.onWindowResize(null);

    this.logger.logActivity({
      activity_level: 'summary',
      activity_name: 'Project Dashboard',
      application_name: 'Customer Portal',
      customer_id: this.dataStore.currentUser.customer_id,
      user_id: this.dataStore.currentUser.user_id,
    });
  }

  loadAllUsers() {
    this.selectedUserId = this.dataStore.currentUser.user_id;
    this.selectedCustomerId = this.dataStore.currentCustomer.customer_id;
    this.toolbarConfig.users.value = this.dataStore.currentUser.user_email;
    if (this.toolbarUsersSelectBox) {
      this.toolbarUsersSelectBox.getDataSource().load().done((data) => {
        console.log('Users Data was loaded on Repaint');
        if (this.projectToolbar.instance) {
          this.projectToolbar.instance.repaint();
        }
      });
    }
  }

  loadCurrentOffice() {
    if(this.dataStore.currentUser){
      this.userInfoApiService.findUsers(this.dataStore.currentUser['customer_id'])
      .then((users: any[]) => {
        const emails = users.filter(({ status }) => status === 'active').map((user) => {
          if (!user.user_displayname) {
            user.user_displayname = `${user.user_lastname}, ${user.user_firstname}`;
          }
          return user;
        });
        this.projectGridEditorTemplateSource.adminUserEmail = emails.sort((firstUser, secondUser) => {
          const firstUserEmail = firstUser.user_email ? firstUser.user_email.toLowerCase() : '';
          const secondUserEmail = secondUser.user_email ? secondUser.user_email.toLowerCase() : '';
          return firstUserEmail.localeCompare(secondUserEmail);
        });

        return new Promise((resolve) => resolve(null));
      })
      .then((res) => {
        if (this.dataStore.currentUser['customer_office_id']) {
          this.officeApiService.getOffice(this.dataStore.currentUser['customer_office_id'])
            .then(office => {
              this.currentOffice = office;
            })
            .catch(err => {
              this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
            });
        }
        if (this.dataStore.currentUser['customer_id']) {
          this.officeApiService.findOffices(this.dataStore.currentUser['customer_id'])
            .then(offices => {
              this.projectGridEditorTemplateSource.assignedOfficeName = offices;
            })
            .catch(err => {
              this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
            })
        }
      })
      .catch(err => {
        this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
      });
    }    
  }

  /* Switch Project View Mode */
  onChangeProjectViewMode() {
    this.toolbarRefreshGridAction();
  }

  /* Switch User */
  onChangeUser(changedEmail) {
    this.searchText = '';

    if (changedEmail === 'all-users') {
      this.selectedUserId = changedEmail;
      this.selectedCustomerId = null;
      this.toolbarRefreshGridAction();
      return;
    }

    this.currentOffice = null;

    this.authApiService.getUser(changedEmail)
      .then((res: any) => {
        this.dataStore.currentUser = res;
        this.selectedUserId = res.user_id;

        if (res['customer_id']) {
          return this.authApiService.getCustomer(res['customer_id']);
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
      .catch(err => {
        this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
      });
  }

  /* Project Grid Actions */
  gridProjectEditingStartAction(event) {
    if (!event.data.project_bid_datetime) {
      event.data.project_bid_datetime = null;
    }
    event.component.selectRows([event.data.project_id]);
  }

  private getGridProjectContentByLoadOption(loadOptions) {
    
    let projects = this.projectGridContent;
         //this.sortName = loadOptions.sort[0].selector;
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
        const isMatched = Object.keys(project).map(key => project[key]).some(item => item.toString().toLowerCase().includes(this.searchText));
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

      if (!this.dataStore.currentUser || !this.dataStore.currentCustomer) {
        this.projectGridContent = [];
        this.projectGridContentLoaded = false;

        const filteredProjects = this.getGridProjectContentByLoadOption(loadOptions);
        return resolve({
          data: filteredProjects,
          totalCount: filteredProjects.length
        });
      }

      if (this.selectedUserId == null) {
        return resolve({
          data: [],
          totalCount: 0
        });
      }

      const findProjects = this.selectedUserId === 'all-users'
        ? this.apiService.findProjectsByCustomerId(this.dataStore.currentUser['customer_id'], this.dataStore.currentCustomer['customer_timezone'] || 'eastern', this.projectViewTypeSelected)
        : this.apiService.findProjectsByUserId(this.selectedUserId, this.selectedCustomerId, this.dataStore.currentCustomer['customer_timezone'] || 'eastern', this.projectViewTypeSelected);
      const findDataViewFieldSettings = this.apiService.findDataViewFieldSettings(this.projectViewTypeSelected);
      const currentOfficeId = this.dataStore.currentUser['customer_office_id'];

      Promise.all([findProjects, findDataViewFieldSettings])
        .then(([projects, dataViewFieldSettings]) => {
          this.projectGridContent = projects as any[];
          this.projectGridContentLoaded = true;

          if (!this.projectViewTypeSelected) {
            this.projectGridColumns = [
              { dataField: 'project_id', dataType: 'number', caption: 'Project Id', width: 250, visible: false, allowEditing: false },
              { dataField: 'project_name', caption: 'Project Name', width: 400, minWidth: 250, allowEditing: true },
              { dataField: 'project_admin_user_email', caption: 'Project Admin', minWidth: 150, allowEditing: true, cellTemplate: 'projectAdminUserEmailCell', editCellTemplate: 'projectAdminUserEmailEditor' },
              { dataField: 'source_sys_type_name', caption: 'Source', minWidth: 150, allowEditing: false },
              { dataField: 'source_company_name', caption: 'Source Company', minWidth: 150, allowEditing: false },
              { dataField: 'project_bid_datetime', caption: 'Bid Date/Time', minWidth: 150, cellTemplate: 'dateCell', editCellTemplate: 'dateTimeEditor', allowEditing: true },
              { dataField: 'project_city_state', caption: 'City/State', width: 150, minWidth: 100, allowEditing: false },
              { dataField: 'project_assigned_office_name', caption: 'Office', width: 150, minWidth: 100, editCellTemplate: 'projectAssignedOfficeNameEditor', allowEditing: true },
              { dataField: 'auto_update_status', caption: 'Automatic Updates', width: 180, minWidth: 150, allowEditing: true, editCellTemplate: 'autoUpdateStatusEditor' },
              { dataField: 'create_datetime', caption: 'Create Date', width: 180, minWidth: 150, dataType: 'datetime', cellTemplate: 'dateCell', allowEditing: false },
              { dataField: 'last_change_date', caption: 'Last Change Date', width: 180, minWidth: 150, dataType: 'datetime', cellTemplate: 'dateCell', allowEditing: false },
              { dataField: 'status', caption: 'Status', width: 100, minWidth: 100, allowEditing: true, editCellTemplate: 'statusEditor' },
              { dataField: 'project_notes', caption: 'Notes', minWidth: 100, allowEditing: true },
              { dataField: 'project_process_status', caption: 'Processing Status', minWidth: 100, allowEditing: false,editCellTemplate: 'updateStatusEditor' },
              { dataField: 'project_process_message', caption: 'Processing Message', minWidth: 100, allowEditing: false }
            ];
          } else {
            const newGridColumnList = [];
            const editingAllowedColumns = [
              'project_name', 'project_admin_user_email', 'project_bid_datetime', 'auto_update_status', 'project_notes',
              'project_stage','project_timezone', 'project_contract_type', 'project_segment', 'project_building_type', 'project_labor_requirement',
              'project_value', 'project_size', 'project_construction_type', 'project_award_status', 'project_assigned_office_name',
              'project_number'
            ];
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
                case 'project_assigned_office_name': newGridColumn['editCellTemplate'] = 'projectAssignedOfficeNameEditor'; break;
                case 'auto_update_status': newGridColumn['editCellTemplate'] = 'autoUpdateStatusEditor'; break;
                case 'project_stage': newGridColumn['editCellTemplate'] = 'projectStageEditor'; break;

                case 'project_timezone': newGridColumn['editCellTemplate'] = 'projectTimezoneEditor'; break;
                case 'project_contract_type': newGridColumn['editCellTemplate'] = 'projectContractTypeEditor'; break;
                case 'project_segment': newGridColumn['editCellTemplate'] = 'projectSegmentEditor'; break;
                case 'project_building_type': newGridColumn['editCellTemplate'] = 'projectBuildingTypeEditor'; break;
                case 'project_labor_requirement': newGridColumn['editCellTemplate'] = 'projectLaborRequirementEditor'; break;
                case 'project_construction_type': newGridColumn['editCellTemplate'] = 'projectConstructionTypeEditor'; break;
                case 'project_award_status': newGridColumn['editCellTemplate'] = 'projectAwardStatusEditor'; break;
              }

              newGridColumnList.push(newGridColumn);
            });

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
          this.notificationService.error('Error', error, { timeOut: 3000, showProgressBar: false });
          this.projectGridContent = [];
          this.projectGridContentLoaded = false;
          return resolve({
            data: this.projectGridContent,
            totalCount: this.projectGridContent.length
          });
        });
    });
  }

  gridProjectUpdateAction(key, values) {
    return new Promise((resolve, reject) => {
      try {
        const updateIndex = this.projectGridContent.findIndex((project) => project.project_id === key);
        if ('project_name' in values) {
          const validProjectName = this.validationService.validateProjectName(values['project_name']);
          if (validProjectName.length === 0) {
            return reject('Project Name cannot be empty.');
          } else {
            this.apiService
            .updateProject(key, {project_name: validProjectName})
            .then((res) => {
                this.notificationService
                  .success('Success', 'Project has been updated', { timeOut: 3000, showProgressBar: false });
                this.projectGridContent[updateIndex]['project_name'] 
                  = values['project_name'];
                return resolve();
              }).catch((error) => {
                return reject('Failed to update the project name');
              });
          }
        } else if ('project_admin_user_email' in values) {
          const matchedUser 
            = this.projectGridEditorTemplateSource
                  .adminUserEmail
                  .find(({ user_email }) => user_email === values['project_admin_user_email']);
          this.apiService
            .updateProject(key, {project_admin_user_id: matchedUser['user_id']})
            .then((res) => {
              this.notificationService.success('Success', 'Project Admin User Email has been updated', { timeOut: 3000, showProgressBar: false });
              this.projectGridContent[updateIndex]['project_admin_user_email'] = values['project_admin_user_email'];
              return resolve();
            }).catch((error) => {
              return reject('Failed to update the status');
            });
        } else if ('project_bid_datetime' in values) {
          const updatedValue = moment(values['project_bid_datetime']).utc().format('YYYY-MM-DDTHH:mm:ss.SSSSSS') + 'Z';
          this.apiService
            .updateProject(key, {project_bid_datetime: updatedValue})
            .then((res) => {
              this.notificationService.success('Success', 'Project Bid DateTime has been updated', { timeOut: 3000, showProgressBar: false });
              this.projectGridContent[updateIndex]['project_bid_datetime'] = updatedValue;
              return resolve();
            }).catch((error) => {
              return reject('Failed to update the status');
            });
        } else if ('auto_update_status' in values) {
          this.apiService
            .updateProject(key, {auto_update_status: values['auto_update_status']})
            .then((res) => {
              this.notificationService.success('Success', 'Auto-Update-Status has been updated', { timeOut: 3000, showProgressBar: false });
              this.projectGridContent[updateIndex]['auto_update_status'] = values['auto_update_status'];
              return resolve();
            }).catch((error) => {
              return reject('Failed to update the status');
            });
        } else if ('status' in values) {
          const isPlatformAdmin = this.dataStore.originUserEmail.includes('bidretriever.net');

          if ((this.projectGridContent[updateIndex]['status'] === 'deleted' && !isPlatformAdmin)
            || (this.projectGridContent[updateIndex]['status'] === 'archived' && !this.isSysAdmin)) {
            return reject('You are not authorized to perform this action');
          } else {
            this.apiService
              .updateProject(key, { status: values['status']})
              .then((res) => {
                this.notificationService.success('Success', 'Status has been updated', { timeOut: 3000, showProgressBar: false });
                this.projectGridContent[updateIndex]['status'] = values['status'];
                return resolve();
              }).catch((error) => {
                return reject('Failed to update the status');
              });
          }
        } else if ('project_assigned_office_name' in values) {
          this.apiService
            .updateProject(key, {project_assigned_office_name: values['project_assigned_office_name']})
              .then((res) => {
                this.notificationService.success('Success', 'Project assigned office name has been updated', { timeOut: 3000, showProgressBar: false });
                this.projectGridContent[updateIndex]['project_assigned_office_name'] = values['project_assigned_office_name'];
                return resolve();
              }).catch((error) => {
                return reject('Failed to update the project assigned office name');
              })
        } else if ('project_notes' in values) {
          this.apiService
            .updateProject(key, {project_notes: values['project_notes']})
            .then((res) => {
              this.notificationService.success('Success', 'Project Note has been updated', { timeOut: 3000, showProgressBar: false });
              this.projectGridContent[updateIndex]['project_notes'] = values['project_notes'];
              return resolve();
            }).catch((error) => {
              return reject('Failed to update the project notes');
            });
        } else if ('project_stage' in values) {
          this.apiService
            .updateProject(key, {project_stage: values['project_stage']})
            .then((res) => {
              this.notificationService.success('Success', 'Project-Stage has been updated', { timeOut: 3000, showProgressBar: false });
              this.projectGridContent[updateIndex]['project_stage'] = values['project_stage'];
              return resolve();
            }).catch((error) => {
              return reject('Failed to update the status');
            });
        } else if ('project_timezone' in values) {
          this.apiService
            .updateProject(key, {project_timezone: values['project_timezone']})
            .then((res) => {
              this.notificationService.success('Success', 'Project Timezone has been updated', { timeOut: 3000, showProgressBar: false });
              this.projectGridContent[updateIndex]['project_timezone'] = values['project_timezone'];
              return resolve();
            }).catch((error) => {
              return reject('Failed to update the status');
            });
        } else if ('project_contract_type' in values) {
          this.apiService
            .updateProject(key, {project_contract_type: values['project_contract_type']})
            .then((res) => {
              this.notificationService.success('Success', 'Project Contract Type has been updated', { timeOut: 3000, showProgressBar: false });
              this.projectGridContent[updateIndex]['project_contract_type'] = values['project_contract_type'];
              return resolve();
            }).catch((error) => {
              return reject('Failed to update the status');
            })
        } else if ('project_segment' in values) {
          this.apiService
            .updateProject(key, {project_segment: values['project_segment']})
            .then((res) => {
              this.notificationService.success('Success', 'Project Segment has been updated', { timeOut: 3000, showProgressBar: false });
              this.projectGridContent[updateIndex]['project_segment'] = values['project_segment'];
              return resolve();
            }).catch((error) => {
              return reject('Failed to update the status');
            });
        } else if ('project_building_type' in values) {
          this.apiService
            .updateProject(key, {project_building_type: values['project_building_type']})
            .then((res) => {
              this.notificationService.success('Success', 'Project Building Type has been updated', { timeOut: 3000, showProgressBar: false });
              this.projectGridContent[updateIndex]['project_building_type'] = values['project_building_type'];
              return resolve();
            }).catch((error) => {
              return reject('Failed to update the status');
            });
        } else if ('project_labor_requirement' in values) {
          this.apiService
            .updateProject(key, {project_labor_requirement: values['project_labor_requirement']})
            .then((res) => {
              this.notificationService.success('Success', 'Project Labor Requirement has been updated', { timeOut: 3000, showProgressBar: false });
              this.projectGridContent[updateIndex]['project_labor_requirement'] = values['project_labor_requirement'];
              return resolve();
            }).catch((error) => {
              return reject('Failed to update the status');
            });
        } else if ('project_value' in values) {
          this.apiService
            .updateProject(key, {project_value: values['project_value']})
            .then((res) => {
              this.notificationService.success('Success', 'Project Value has been updated', { timeOut: 3000, showProgressBar: false });
              this.projectGridContent[updateIndex]['project_value'] = values['project_value'];
              return resolve();
            }).catch((error) => {
              return reject('Failed to update the status');
            });
        } else if ('project_size' in values) {
          this.apiService
            .updateProject(key, {project_size: values['project_size']})
            .then((res) => {
              this.notificationService.success('Success', 'Project Size has been updated', { timeOut: 3000, showProgressBar: false });
              this.projectGridContent[updateIndex]['project_size'] = values['project_size'];
              return resolve();
            }).catch((error) => {
              return reject('Failed to update the status');
            });
        } else if ('project_number' in values) {
          this.apiService
            .updateProject(key, {project_number: values['project_number']})
            .then((res) => {
              this.notificationService.success('Success', 'Project number has been updated', { timeOut: 3000, showProgressBar: false });
              this.projectGridContent[updateIndex]['project_number'] = values['project_number'];
              return resolve();
            }).catch((error) => {
              return reject('Failed to update the status');
            });
        } else if ('project_construction_type' in values) {
          this.apiService
            .updateProject(key, {project_construction_type: values['project_construction_type']})
            .then((res) => {
              this.notificationService.success('Success', 'Project Construction Type has been updated', { timeOut: 3000, showProgressBar: false });
              this.projectGridContent[updateIndex]['project_construction_type'] = values['project_construction_type'];
              return resolve();
            }).catch((error) => {
              return reject('Failed to update the status');
            });
        } else if ('project_award_status' in values) {
          this.apiService
            .updateProject(key, {project_award_status: values['project_award_status']})
            .then((res) => {
              this.notificationService.success('Success', 'Project Award Status has been updated', { timeOut: 3000, showProgressBar: false });
              this.projectGridContent[updateIndex]['project_award_status'] = values['project_award_status'];
              return resolve();
            }).catch((error) => {
              return reject('Failed to update the status');
            });
        } else {
          return reject('You are not able to edit this value');
        }
      } catch (error) {
        return reject('Invalid format');
      }
    });
  }

  /* Popup Actions */
  popupDataViewHidingAction(event) {
    if (this.projectToolbarViewType.instance) {
      this.projectToolbarViewType.instance.getDataSource().reload();
    }
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

  /* Toolbar Users SelectBox Action */
  toolbarUsersLoadAction(loadOptions) {
    return new Promise((resolve, reject) => {
      if (this.isBidRetrieverAdmin) {
        if (this.toolbarUsersContent.length === 0) {
          this.userInfoApiService.findUsers()
            .then((res: any[]) => {
              res = res.map((item) => {
                item.user_email = item.user_email.toLowerCase();
                if (!item.user_displayname) {
                  if (!item.user_firstname && !item.user_lastname) {
                    item.user_displayname = item.user_email;
                  } else {
                    item.user_displayname = `${item.user_lastname ? item.user_lastname + ', ' : ''}${item.user_firstname} (${item.user_email})`;
                  }
                } else {
                  item.user_displayname = `${item.user_displayname} (${item.user_email})`;
                }
                return item;
              });
              this.toolbarUsersContent = res.sort((prev, next) => prev.user_displayname < next.user_displayname ? -1 : 1);
              return resolve(res);
            })
            .catch(err => {
              this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
              this.toolbarUsersContent = [];
              return resolve(this.toolbarUsersContent);
            });
        } else {
          return resolve(this.toolbarUsersContent);
        }
      } else if (this.dataStore && this.dataStore.currentCustomer && this.dataStore.currentCustomer.customer_id) {
        if (this.toolbarUsersContent.length === 0) {
          this.userInfoApiService.findUsers(this.dataStore.currentCustomer.customer_id)
            .then((res: any[]) => {
              res = res.map((item) => {
                item.user_email = item.user_email.toLowerCase();

                if (!item.user_displayname) {
                  item.user_displayname = `${item.user_lastname ? item.user_lastname + ', ' : ''}${item.user_firstname} (${item.user_email})`;
                } else {
                  item.user_displayname = `${item.user_displayname} (${item.user_email})`;
                }
                return item;
              });
              this.toolbarUsersContent = res.sort((prev, next) => prev.user_displayname < next.user_displayname ? -1 : 1);
              this.toolbarUsersContent.unshift({
                user_displayname: 'All Users',
                user_email: 'all-users'
              });
              return resolve(res);
            })
            .catch(err => {
              this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
              this.toolbarUsersContent = [];
              return resolve(this.toolbarUsersContent);
            });
        } else {
          return resolve(this.toolbarUsersContent);
        }
      } else {
        return resolve([]);
      }
      // return resolve([]);
    });
  }

  /* Toolbar Search Action */
  toolbarSearchAction(event) {
    this.searchText = event.value.toLowerCase();
    if (this.projectGrid && this.projectGrid.instance) {
      this.projectGrid.instance.refresh();
    }
  }

  /* Create Project */
  toolbarAddProjectAction() {
    this.addProjectModal.initialize(this);
  }

  /* View project details */
  toolbarViewProjectAction() {
    const { selectedRowKeys } = this.projectGrid;
    if (selectedRowKeys.length === 0) {
      this.notificationService.error('No Selection', 'Please select one project!', { timeOut: 3000, showProgressBar: false });
      return;
    } else if (selectedRowKeys.length > 1) {
      this.notificationService.error('Multiple Selection', 'Please select just one project!', { timeOut: 3000, showProgressBar: false });
      return;
    }
    const selectedRows = this.projectGridContent.filter(({ project_id: projectId }) => selectedRowKeys.includes(projectId));
    window.open(`/customer-portal/view-project/${selectedRows[0].project_id}`, '_blank');
  }

  /* View Project Documents through doc viewer */
  toolbarViewProjectDocumentsAction() {
    const { selectedRowKeys } = this.projectGrid;
    if (selectedRowKeys.length === 0) {
      this.notificationService.error('No Selection', 'Please select one project!', { timeOut: 3000, showProgressBar: false });
      return;
    } else if (selectedRowKeys.length > 1) {
      this.notificationService.error('Multiple Selection', 'Please select just one project!', { timeOut: 3000, showProgressBar: false });
      return;
    }

    const selectedRows = this.projectGridContent.filter(({ project_id: projectId }) => selectedRowKeys.includes(projectId));
    const { currentUser: { user_id: userId } } = this.dataStore;
    window.open(`${window['env'].docViewerBaseUrl}?project_id=${selectedRows[0].project_id}&user_id=${userId}`, '_blank');
  }

  /* Edit Project */
  toolbarEditProjectAction() {
    const { selectedRowKeys } = this.projectGrid;
    if (selectedRowKeys.length === 0) {
      this.notificationService.error('No Selection', 'Please select one project!', { timeOut: 3000, showProgressBar: false });
      return;
    } else if (selectedRowKeys.length > 1) {
      this.notificationService.error('Multiple Selection', 'Please select just one project!', { timeOut: 3000, showProgressBar: false });
      return;
    }

    const selectedRows = this.projectGridContent.filter(({ project_id: projectId }) => selectedRowKeys.includes(projectId));
    this.editProjectModal.initialize(this, selectedRows[0]);
  }

  /* Delete Project(s) */
  toolbarDeleteProjectAction() {
    const { selectedRowKeys } = this.projectGrid;
    if (selectedRowKeys.length === 0) {
      this.notificationService.error('No Selection', 'Please select at least one project!', { timeOut: 3000, showProgressBar: false });
      return;
    }

    const selectedRows = this.projectGridContent.filter(({ project_id: projectId }) => selectedRowKeys.includes(projectId));
    const selectedProjects = selectedRows.filter(project => project.status !== 'deleted' && project.status !== 'archived');

    this.removeProjectModal.initialize(selectedProjects, true, this);
  }

  /* Archive Project(s) */
  toolbarArchiveProjectAction() {
    const { selectedRowKeys } = this.projectGrid;
    if (selectedRowKeys.length === 0) {
      this.notificationService.error('No Selection', 'Please select at least one project!', { timeOut: 3000, showProgressBar: false });
      return;
    }

    const selectedRows = this.projectGridContent.filter(({ project_id: projectId }) => selectedRowKeys.includes(projectId));
    const selectedProjects = selectedRows.filter(project => project.status !== 'deleted' && project.status !== 'archived');

    this.removeProjectModal.initialize(selectedProjects, false, this);
  }

  /* Add Documents To Project */
  toolbarAddDocumentsToProjectAction() {
    // const selectedProjects = this.grid.api.getSelectedRows();
    const { selectedRowKeys } = this.projectGrid;
    if (selectedRowKeys.length === 0) {
      this.notificationService.error('No Selection', 'Please select one project!', { timeOut: 3000, showProgressBar: false });
      return;
    } else if (selectedRowKeys.length > 1) {
      this.notificationService.error('Multiple Selection', 'Please select just one project!', { timeOut: 3000, showProgressBar: false });
      return;
    }

    const selectedRows = this.projectGridContent.filter(({ project_id: projectId }) => selectedRowKeys.includes(projectId));
    if (selectedRows[0].status === 'deleted' || selectedRows[0].status === 'archived') {
      this.notificationService.error('Error', 'You cannot add submission to deleted/archived project!', { timeOut: 3000, showProgressBar: false });
      return;
    }

    this.addSubmissionModal.initialize(selectedRows[0], this);
  }

  /* Toolbar "View Published Project" Action */
  toolbarViewPublishedProjectAction() {
    const { selectedRowKeys } = this.projectGrid;
    if (selectedRowKeys.length === 0) {
      this.notificationService.error('No Selection', 'Please select one project!', { timeOut: 3000, showProgressBar: false });
      return;
    } else if (selectedRowKeys.length > 1) {
      this.notificationService.error('Multiple Selection', 'Please select just one project!', { timeOut: 3000, showProgressBar: false });
      return;
    }

    const selectedRows = this.projectGridContent.filter(({ project_id: projectId }) => selectedRowKeys.includes(projectId));
    this.apiService.getPublishedLink(selectedRows[0].project_id)
      .then((url: string) => {
        window.open(url, '_blank');
      })
      .catch(err => {
        this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
      });
  }

  /* Print */
  toolbarPrintProjectListAction() {
  }

  /* Toolbar "Export Project List to Csv" Action */
  toolbarExportProjectListToCsvAction() {
    if (this.projectGrid && this.projectGrid.instance) {
      this.projectGrid.instance.exportToExcel(false);
    }
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

    const selectedRows = this.projectGridContent.filter(({ project_id: projectId }) => selectedRowKeys.includes(projectId));
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

  /* Table Event: Cell Changed */
  onCellValueChanged(event: any) {
    if (event['newValue'] === event['oldValue'] || !event['newValue']) {
      return;
    }

    const columnName = event['colDef']['field'];
    const projectId = event['data']['project_id'];
    const newValue = event['newValue'];

    // update project
    this.apiService.updateProject(projectId, { [columnName]: newValue })
      .then(res => {
        this.notificationService.success('Success', 'Project has been updated', { timeOut: 3000, showProgressBar: false });
      })
      .catch(err => {
        this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
      });
  }

  /**
   * Table Event: Row double clicked
   * @param event
   */
  onRowDoubleClicked(event: any) {
    window.open(`/customer-portal/view-project/${event['data']['project_id']}`, '_blank');
  }

  onRefresh() {
    this.toolbarRefreshGridAction();
  }

  projectAdminUserEmailEditorContentReady(event) {
    setTimeout(() => {
      event.component.content().parentElement.style.width = '350px';
    });
  }

  addProjectGridMenuItems(e) {  
    if (!e.row) { return; }
    if (!e.row.data.project_bid_datetime) {
      e.row.data.project_bid_datetime = null;
    }

    e.component.selectRows([e.row.data.project_id]);

    if (e.row && e.row.rowType === 'data') {   // e.items can be undefined
      if (!e.items) { e.items = []; }

      // Add a custom menu item
      e.items.push(
        {
          type: 'normal',
          text: 'View Project',
          onItemClick: () => this.toolbarViewProjectAction()
        },
        {
          type: 'normal',
          text: 'Add Project',
          onItemClick: () => this.toolbarAddProjectAction()
        },
        {
          type: 'normal',
          text: 'Edit Project',
          onItemClick: () => this.toolbarEditProjectAction()
        },
        {
          type: 'normal',
          text: 'Add Documents To Project',
          onItemClick: () => this.toolbarAddDocumentsToProjectAction()
        },
        {
          type: 'normal',
          text: 'Delete Project',
          onItemClick: () => this.toolbarDeleteProjectAction()
        },
        {
          type: 'normal',
          text: 'Archive Project',
          onItemClick: () => this.toolbarArchiveProjectAction()
        },
        {
          type: 'normal',
          text: 'View Project Documents',
          onItemClick: () => this.toolbarViewProjectDocumentsAction()
        },
        {
          type: 'normal',
          text: 'View Source Project',
          onClick: () => this.onViewProjectSourceSystem()
        },
        {
          type: 'normal',
          text: 'View Published Project',
          onItemClick: () => this.toolbarViewPublishedProjectAction()
        },
        {
          type: 'normal',
          text: 'Print Project List',
          onItemClick: () => this.toolbarPrintProjectListAction()
        },
        {
          type: 'normal',
          text: 'Export Project List  To CSV',
          onItemClick: () => this.toolbarExportProjectListToCsvAction()
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

  onViewProjectSourceSystem() {
    const { selectedRowKeys } = this.projectGrid;

    if (selectedRowKeys.length === 0) {
      this.notificationService.error('No Selection', 'Please select one project!', { timeOut: 3000, showProgressBar: false });
      return;
    } else if (selectedRowKeys.length == 1) {
      const selectedRows = this.projectGridContent.filter(({ project_id: projectId }) => selectedRowKeys.includes(projectId));

      if (selectedRows && selectedRows[0]['source_url']) {

        window.open(selectedRows[0]['source_url'], '_blank');
        return;
      }
      this.notificationService.error('Error', 'This project source system is empty.', { timeOut: 3000, showProgressBar: false });

    } else {
      this.notificationService.error('Error', 'Multiple Selection', 'Please select just one project!', { timeOut: 3000, showProgressBar: false });
    }

  }

}
