import { Component, OnInit, ViewEncapsulation, ViewChild, ElementRef, HostListener, AfterViewInit } from '@angular/core';
import CustomStore from 'devextreme/data/custom_store';
import { DxDataGridComponent } from 'devextreme-angular';
import { NotificationsService } from 'angular2-notifications';
import { DataStore } from 'app/providers/datastore';
import { DataViewApiService } from '../services/data.view.service';

@Component({
  selector: 'app-project-data-view-modal',
  templateUrl: './project-data-view-modal.component.html',
  styleUrls: [
    './project-data-view-modal.component.scss'
  ],
  encapsulation: ViewEncapsulation.None,
  providers: [
    DataViewApiService
  ]
})
export class ProjectDataViewModalComponent implements OnInit, AfterViewInit {
  @ViewChild('dataViewContent', { static: true }) dataViewContent: ElementRef;
  @ViewChild('dataViewGrid', { static: true }) dataViewGrid: DxDataGridComponent;

  dataViewGridDataSource: any;
  toolbarConfig: any;

  isProjectDataViewDetailsModalShown = false;
  projectDataViewDetailsModalTitle = '';
  projectDataViewDetailsModalMode = 'create';
  projectDataViewDetailsModalCurrentViewId = null;
  projectDataViewDetailsModalOpenedTime = null;

  get isBidRetrieverAdmin() { return this._dataStore.originUserEmail.includes('bidretriever.net'); }

  constructor(
    private _dataStore: DataStore,
    private _dataViewApiService: DataViewApiService,
    private _notificationService: NotificationsService
  ) {
    this.dataViewGridDataSource = new CustomStore({
      key: 'view_id',
      load: () => new Promise((resolve, reject) => {
        if (!this._dataStore.currentCustomer) {
          return resolve({
            data: [],
            totalCount: 0
          });
        }
        this._dataViewApiService.findDataViews('projects', this._dataStore.currentCustomer.customer_id)
          .then((viewTypes: any[]) => {
            viewTypes = viewTypes.sort((first, second) => {
              if (first.view_type < second.view_type) {
                return -1;
              }

              if (first.view_type === second.view_type) {
                if (first.view_name < second.view_name) {
                  return -1;
                }

                return 1;
              }

              return 1;
            })
            return resolve({
              data: viewTypes,
              totalCount: viewTypes.length
            });
          })
          .catch((error) => {
            return resolve({
              data: [],
              totalCount: 0
            });
          });
      })
    });

    this.toolbarConfig = {
      editView: {
        type: 'normal',
        text: 'Edit View',
        onClick: () => this.toolbarEditViewAction()
      },
      addView: {
        type: 'normal',
        text: 'Add View',
        onClick: () => this.toolbarAddViewAction()
      },

      others: {
        editView: {
          type: 'normal',
          text: 'Edit View',
          onClick: () => this.toolbarEditViewAction()
        },
        addView: {
          type: 'normal',
          text: 'Add View',
          onClick: () => this.toolbarAddViewAction()
        },
        deleteView: {
          type: 'normal',
          text: 'Delete View',
          onClick: () => this.toolbarDeleteViewAction()
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
  }

  ngOnInit() {
  }

  ngAfterViewInit() {
    setTimeout(() => this.onWindowResize(null), 500);

    if (this.dataViewGrid.instance) {
      this.dataViewGrid.instance.columnOption('command:select', 'allowFixing', true);
    }
  }

  @HostListener('window:resize', ['$event'])
  onWindowResize(event) {
    this.dataViewGrid.height = `${this.dataViewContent.nativeElement.offsetHeight}px`;
  }

  popupDetailsViewApplyAction() {
    this.isProjectDataViewDetailsModalShown = false;
    this.toolbarRefreshGridAction();
  }

  popupDetailsViewCancelAction() {
    this.isProjectDataViewDetailsModalShown = false;
  }

  toolbarEditViewAction() {
    const { selectedRowKeys } = this.dataViewGrid;
    if (selectedRowKeys.length === 0) {
      this._notificationService.error('No Selection', 'Please select one data view!', { timeOut: 3000, showProgressBar: false });
      return;
    } else if (selectedRowKeys.length > 1) {
      this._notificationService.error('Multiple Selection', 'Please select just one data view!', { timeOut: 3000, showProgressBar: false });
      return;
    }

    this.projectDataViewDetailsModalTitle = 'Edit View';
    this.projectDataViewDetailsModalMode = 'edit';
    this.projectDataViewDetailsModalCurrentViewId = selectedRowKeys[0];
    this.projectDataViewDetailsModalOpenedTime = new Date();
    this.isProjectDataViewDetailsModalShown = true;
  }

  toolbarAddViewAction() {
    this.projectDataViewDetailsModalTitle = 'Create View';
    this.projectDataViewDetailsModalMode = 'create';
    this.projectDataViewDetailsModalCurrentViewId = '';
    this.projectDataViewDetailsModalOpenedTime = new Date();
    this.isProjectDataViewDetailsModalShown = true;
  }

  toolbarDeleteViewAction() {
    const { selectedRowKeys } = this.dataViewGrid;
    if (selectedRowKeys.length === 0) {
      this._notificationService.error('No Select', 'Please select at least one data view!', { timeOut: 3000, showProgressBar: false });
      return;
    }

    const tasks = [];
    for (let i = 0; i < selectedRowKeys.length; i ++) {
      tasks.push(this._dataViewApiService.updateDataView({
        search_view_id: selectedRowKeys[i],
        view_status: 'deleted'
      }));
    }
    Promise.all(tasks)
      .then(res => {
        this.toolbarRefreshGridAction();
      })
      .catch(error => {
        this._notificationService.error('Error', 'Failed to delete the selected data views', { timeOut: 3000, showProgressBar: false });
      });
  }

  toolbarRefreshGridAction() {
    if (this.dataViewGrid.instance) {
      this.dataViewGrid.instance.refresh();
    }
  }

  toolbarHelpAction() {
    alert('Toolbar Help Action');
  }

  gridDataViewCellPreparedAction(event) {
    if (!this.isBidRetrieverAdmin && event.rowType === 'data' && event.column.command === 'select' && event.data.customer_id === 'default') {
      event.cellElement.style.pointerEvents = 'none';
    }
  }

  gridDataViewRowPreparedAction(event) {
    if (!this.isBidRetrieverAdmin && event.data && event.data.customer_id === 'default') {
      event.rowElement.style.color = 'grey';
      event.rowElement.style.pointerEvents = 'none';
    }
  }
}
