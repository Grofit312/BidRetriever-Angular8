import { Component, OnInit, ViewChild, ViewEncapsulation, ElementRef, HostListener, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProjectsApi } from 'app/customer-portal/my-projects/my-projects.api.service';
import { ViewProjectApi } from '../view-project.api.service';
import { NotificationsService } from 'angular2-notifications';
import { AuthApi } from 'app/providers/auth.api.service';
import { ProjectSourceApi } from './project-source.api.service';
import CustomStore from 'devextreme/data/custom_store';
import DataSource from 'devextreme/data/data_source';
import { DataStore } from 'app/providers/datastore';
import { DxDataGridComponent ,DxToolbarComponent} from 'devextreme-angular';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-project-source',
  templateUrl: './project-source.component.html',
  styleUrls: ['./project-source.component.scss'],
  encapsulation: ViewEncapsulation.None,
  providers: [
    ProjectSourceApi
  ]
})
export class ProjectSourceComponent implements OnInit, AfterViewInit {
  @ViewChild('sourceContent', { static: true }) sourceContent: ElementRef;
  @ViewChild('sourceGrid', { static: true }) sourceGrid: DxDataGridComponent;
  @ViewChild('addProjectModal', { static: false }) addProjectModal;
  @ViewChild('projectSourceToolbar', { static: false }) projectSourceToolbar: DxToolbarComponent;
  
  sourceGridDataSource: any;
  sourceGridContent: any[] = [];
  sourceGridContentLoaded = false;

  currentProject: any = {};

  dataViews: any = [];

  sourceTypes: any[] = [];
  currentSourceType = 'Test1';

  toolbarConfig: any;
  company_Id:any;

  addProjectSourceModalTitle = 'Select Other Projects That Match';
  isProjectSourceModalShown = false;

  searchText = '';

  constructor(
    private _dataStore: DataStore,
    private _projectSourceApi: ProjectSourceApi,
    private activatedRoute: ActivatedRoute,
    private viewProjectsApi: ViewProjectApi,
    private notificationService: NotificationsService,
    private authApi: AuthApi
  ) {    
    this.toolbarConfig = {
      sourceType: {
        width: 180,
        dataSource: new DataSource({
          store: new CustomStore({
            key: 'view_id',
            load: (loadOptions) => this.toolbarSourceTypeLoadAction(loadOptions)
          })
        }),
        valueExpr: 'view_id',
        displayExpr: 'view_name',
        onValueChanged: (args) => {
        },
      },

      searchText: {
        placeholder: 'Search',
        width: 200,
        valueChangeEvent: 'keyup',
        onValueChanged: (event) => this.toolbarSearchAction(event)
      },

      viewProject: {
        type: 'normal',
        elementAttr: {
          class: 'toolbar-view-project'
        },
        text: 'View Project',
        onClick: () => this.toolbarViewProjectAction()
      },
      addProject: {
        type: 'normal',
        elementAttr: {
          class: 'toolbar-view-project'
        },
        text: 'Add Project',
        onClick: () => this.toolbarAddProjectAction()
      },
      // addSource: {
      //   type: 'normal',
      //   text: 'Select Source Project',
      //   elementAttr: {
      //     class: 'toolbar-select-source-project'
      //   },
      //   onClick: () => this.toolbarAddSourceAction(),
      // },

      others: {
        viewProject: {
          type: 'normal',
          text: 'View Project',
          onClick: () => this.toolbarViewProjectAction()
        },
        addSource: {
          type: 'normal',
          text: 'Select Source Project',
          onClick: () => this.toolbarAddSourceAction()
        },
        removeSource: {
          type: 'normal',
          text: 'Remove Source',
          onClick: () => this.toolbarRemoveSourceAction()
        },
        addProject: {
          type: 'normal',          
          text: 'Add Project',
          onClick: () => this.toolbarAddProjectAction()
        },
        viewCompany: {
          type: 'normal',          
          text: 'View Comapny',
          onClick: () => this.toolbarViewCompanyAction()
        },
      }
    };

    this.sourceGridDataSource = new CustomStore({
      key: 'project_source_id',
      load: () => new Promise((resolve, reject) => {
        if (this.sourceGridContentLoaded) {
          let sources = this.sourceGridContent;
          if (this.searchText) {
            sources = sources.filter((source) => {
              // const isMatched = Object.keys(source).map(key => source[key]).some(item => item.toString().toLowerCase().includes(this.searchText));
              const isMatched = source.source_company_name.toLowerCase().includes(this.searchText)
                || source.project_name.toLowerCase().includes(this.searchText)
                || source.source_company_contact_name.toLowerCase().includes(this.searchText)
                || source.project_bid_datetime.toLowerCase().includes(this.searchText)
                || source.project_source_sys_name.toLowerCase().includes(this.searchText);
              return isMatched; 
            });
          }
          return resolve({
            data: sources,
            totalCount: sources.length
          });
        } else {
          if (!this._dataStore.currentProject) {
            this.sourceGridContent = [];
            this.sourceGridContentLoaded = false;
            return resolve({
              data: this.sourceGridContent,
              totalCount: this.sourceGridContent.length
            });
          } else {
            return this._projectSourceApi.findProjectSources(this._dataStore.currentProject.project_id)
            .then((sources: any) => {
              this.sourceGridContent = sources;
              this.sourceGridContentLoaded = true;
              return resolve({
                data: this.sourceGridContent,
                totalCount: this.sourceGridContent.length
              });
            })
            .catch((error) => {
              this.sourceGridContent = [];
              this.sourceGridContentLoaded = false;
              return ({
                data: this.sourceGridContent,
                totalCount: this.sourceGridContent.length
              });
            });
          }
        }
      })
    });
  }

  ngOnInit() {
    this._dataStore.getProjectState.subscribe(value => {
      if (value) {
        this.addProjectSourceModalTitle = `Select Other Projects That Match - ${this._dataStore.currentProject.project_name}`;
      }

      this.sourceGrid.instance.refresh()
        .then(() => {})
        
        .catch((error) => {
          console.log('Grid Refresh Error', error);
        });
    });
  }

  ngAfterViewInit() {
    setTimeout(() => this.onWindowResize(null), 1500);
  }

  @HostListener('window:resize', ['$event'])
  onWindowResize(event) {
    this.sourceGrid.height = `${this.sourceContent.nativeElement.offsetHeight}px`;
  }

  toolbarSourceTypeLoadAction(loadOptions) {
    return new Promise((resolve, reject) => {
      let customerId = null;
      if (this._dataStore.currentCustomer && this._dataStore.currentCustomer.customer_id) {
        customerId = this._dataStore.currentCustomer.customer_id;
      }
      this._projectSourceApi.findDataViews('project_sources', customerId)
      .then((sourceTypes) => {
        return resolve(sourceTypes);
      }).catch((error) => {
        return resolve([]);
      });
    });
  }

  sourceGridRowClickAction(event) {
    
    const selectedRow = event.data;
    this.company_Id = selectedRow.source_company_id; 
    this._loadProjectSourceInfo(selectedRow.secondary_project_id);
  }

  /* Create Project */
  toolbarAddProjectAction() {
    this.addProjectModal.initialize(this);
  }

  toolbarViewProjectAction() {
    const { selectedRowKeys } = this.sourceGrid;
    if (selectedRowKeys.length === 0) {
      this.notificationService.error('No Selection', 'Please select one project!', { timeOut: 3000, showProgressBar: false });
      return;
    } else if (selectedRowKeys.length > 1) {
      this.notificationService.error('Multiple Selection', 'Please select just one project!', { timeOut: 3000, showProgressBar: false });
      return;
    }
    const selectedRows = this.sourceGridContent.filter(({project_source_id: projectSourceId}) => selectedRowKeys.includes(projectSourceId));
    window.open(`/#/customer-portal/view-project/${selectedRows[0].secondary_project_id}`, '_blank');
  }

  toolbarViewCompanyAction() {
    const { selectedRowKeys } = this.sourceGrid;
    if (selectedRowKeys.length === 0) {
      this.notificationService.error('No Selection', 'Please select one project!', { timeOut: 3000, showProgressBar: false });
       return;
    } else if (selectedRowKeys.length > 1) {
      this.notificationService.error('Multiple Selection', 'Please select just one project!', { timeOut: 3000, showProgressBar: false });
      return;
    } else if (this.company_Id == undefined) {
      this.notificationService.error('No Source Company', 'There is no source company associated with this project.', { timeOut: 3000, showProgressBar: false });
      return;
    }
    //const selectedRows = this.sourceGridContent.filter(({ project_source_id: projectSourceId }) => selectedRowKeys.includes(projectSourceId));
      window.open(`/#/customer-portal/view-company/${this.company_Id}/overview`,
      "_blank")
  }

  toolbarAddSourceAction() {
    this.isProjectSourceModalShown = true;
  }

  toolbarRemoveSourceAction() {
    const { selectedRowKeys } = this.sourceGrid;
    if (selectedRowKeys.length === 0) {
      this.notificationService.error('No Selection', 'Please select at least one project!', { timeOut: 3000, showProgressBar: false });
      return;
    }

    const tasks = [];
    selectedRowKeys.forEach((rowKey) => {
      tasks.push(this._projectSourceApi.updateProjectSource(rowKey, 'deleted'));
    });

    Promise.all(tasks)
      .then((res) => {
        this.notificationService.success('Succeed', 'Selected project sources has been deleted successfully', { timeOut: 3000, showProgressBar: false });
        this.toolbarRefreshGridAction();
      })
      .catch((error) => {
        console.log('toolbarRemoveSourceAction', error);
        this.notificationService.error('Failed', 'Failed to delete the project sources', { timeOut: 3000, showProgressBar: false });
      });
  }

  toolbarRefreshGridAction() {
    this.sourceGridContentLoaded = false;
    if (this.sourceGrid.instance) {
      this.sourceGrid.instance.refresh();
    }
  }

  /* Toolbar Search Action */
  toolbarSearchAction(event) {
    this.searchText = event.value.toLowerCase();
    if (this.sourceGrid.instance) {
      this.sourceGrid.instance.refresh();
    }
  }

  onAddProjectSourceModalApplyAction() {
    this.isProjectSourceModalShown = false;
    this.toolbarRefreshGridAction();
  }

  onAddProjectSourceModalCancelAction() {
    this.isProjectSourceModalShown = false;
  }

  private _loadProjectSourceInfo(projectId) {
    this.viewProjectsApi.getProject(projectId, 'eastern')
      .then(res => {
        this.currentProject = res;

        if (this.currentProject.source_company_id) {
          return this.authApi.getCustomer(this.currentProject.source_company_id);
        } else {
          return new Promise(resolve => resolve());
        }
      })
      .then((res: any) => {
        if (res) {
          this.currentProject.source_company_address = `${res.customer_address1} ${res.customer_address2} ${res.customer_city} ${res.customer_state} ${res.customer_zip} ${res.customer_country}`.trim();
          this.currentProject.source_company_website = res.company_website;
          this.currentProject.source_company_phone = res.customer_phone;
        }

        if (this.currentProject.source_user_id) {
          return this.authApi.getUserById(this.currentProject.source_user_id);
        } else {
          return new Promise(resolve => resolve());
        }
      })
      .then((res: any) => {
        if (!res) {
          return new Promise(resolve => resolve());
        }

        this.currentProject.source_user_address = `${res.user_address1} ${res.user_address2} ${res.user_city} ${res.user_state} ${res.user_zip} ${res.user_country}`.trim();
        if (res.customer_office_id) {
          return this.authApi.getCompanyOffice(res.customer_office_id);
        } else {
          return new Promise(resolve => resolve());
        }
      })
      .then((res: any) => {
        if (res) {
          this.currentProject.source_user_company = res.company_office_name;
        }
      })
      .catch(err => {
        this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
      });
  }

  addProjectSourceGridMenuItems(e) {
    

    if (!e.row) { return; }
    if (!e.row.data.project_bid_datetime) {
      e.row.data.project_bid_datetime = null;
    }
    e.component.selectRows([e.row.data.project_source_id]);
    if (e.row && e.row.rowType === 'data') {   // e.items can be undefined
      if (!e.items) { e.items = []; }
      // Add a custom menu item
      e.items.push(        
          {
            type: 'normal',
            text: 'View Project',
            onClick: () => this.toolbarViewProjectAction()
          },
           {
            type: 'normal',
            text: 'Select Source Project',
            onClick: () => this.toolbarAddSourceAction()
          },
           {
            type: 'normal',
            text: 'Remove Source',
            onClick: () => this.toolbarRemoveSourceAction()
          },
           {
            type: 'normal',          
            text: 'Add Project',
            onClick: () => this.toolbarAddProjectAction()
          },
           {
            type: 'normal',          
            text: 'View Comapny',
            onClick: () => this.toolbarViewCompanyAction()
          },
       );
    }
    return e;
  }
}
