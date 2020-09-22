import { Component, OnInit, Input, EventEmitter, Output, OnChanges, SimpleChanges, ViewChild, HostListener, AfterViewInit, NgZone, ViewEncapsulation } from '@angular/core';
import { DataViewApiService } from '../services/data.view.service';
import { NotificationsService } from 'angular2-notifications';
import { DxSelectBoxComponent, DxDataGridComponent } from 'devextreme-angular';
import CustomStore from 'devextreme/data/custom_store';
import DataSource from 'devextreme/data/data_source';
import { DataStore } from 'app/providers/datastore';
import * as uuid from 'uuid/v1';

@Component({
  selector: 'app-company-data-view-details-modal',
  templateUrl: './company-data-view-details-modal.component.html',
  styleUrls: ['./company-data-view-details-modal.component.scss'],
  encapsulation: ViewEncapsulation.None,
  providers: [
    DataViewApiService
  ]
})
export class CompanyDataViewDetailsModalComponent implements OnInit {

  @Input() mode: string = 'create';
  @Input() currentViewId: string = null;
  @Input() openedTime: string = null;

  @Output() onApply = new EventEmitter();
  @Output() onCancel = new EventEmitter();

  @ViewChild('dataViewColumnSettingGrid', { static: true }) dataViewColumnSettingGrid: DxDataGridComponent;
  dataViewColumnSettingGridContent: any;
  dataViewColumnSettingGridContentSource = [];
  dataViewColumnSettingGridContentSourceOriginal = [];
  dataViewColumnSettingGridCellTemplates: any;

  @ViewChild('dataViewDetailsDataSource', { static: true }) dataSourceSelectBox: DxSelectBoxComponent;
  dataSourceContent: any;
  dataSourceContentList = [];

  @ViewChild('dataViewDetailsDataFilter', { static: true }) dataFilterSelectBox: DxSelectBoxComponent;
  dataFilterContent: any;

  dataViewName = '';
  dataViewDescription = '';

  dataSourceId = '';
  dataSourceFields = [];

  dataFilterId = '';
  dataFilterDescription = '';

  initialLoaded = false;

  constructor(
    private _dataStore: DataStore,
    private _dataViewApiService: DataViewApiService,
    private _notificationService: NotificationsService,
    private _zone: NgZone
  ) {
    this.dataSourceContent = new DataSource({
      store: new CustomStore({
        key: 'data_source_id',
        loadMode: 'raw',
        load: (loadOptions) => new Promise((resolve, reject) => {
          this._dataViewApiService.findDataSources(this._dataStore.currentUser.customer_id)
            .then((sources: any[]) => {
              
              this.dataSourceContentList = sources;
              const selectedDataSource = this.dataSourceContentList.find(item => item.data_source_id === this.dataSourceId);
              this._zone.run(() => {
                if (selectedDataSource && selectedDataSource.data_source_fields) {
                  this.dataSourceFields = selectedDataSource.data_source_fields.sort((first, second) => {
                    if (first.data_source_field_displayname < second.data_source_field_displayname) {
                      return -1;
                    }
                    return 1;
                  });
                } else {
                  this.dataSourceFields = [];
                }
              });
              return resolve(sources);
            })
            .catch((error) => {
              return resolve([]);
            });
        })
      })
    });

    this.dataFilterContent = new DataSource({
      store: new CustomStore({
        key: 'data_view_filter_id',
        loadMode: 'raw',
        load: (loadOptions) => new Promise((resolve, reject) => {
          if (!this.dataSourceId) {
            return resolve([]);
          }

          this._dataViewApiService.findDataViewFilters({
            data_source_id: this.dataSourceId
          }).then((filters: any[]) => {
            return resolve(filters);
          }).catch((error) => {
            return resolve([]);
          })
        })
      })
    });

    this.dataViewColumnSettingGridCellTemplates = {
      alignment: [
        { id: 'left', name: 'Left' },
        { id: 'center', name: 'Center' },
        { id: 'right', name: 'Right' }
      ],
      sort: [
        { id: 'ASC', name: 'A-Z' },
        { id: 'DESC', name: 'Z-A' }
      ]
    };
  }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['openedTime']) {
      this._initialize();
    }
  }

  ngAfterViewInit() {
    setTimeout(() => this.onWindowResize(null), 500);
  }

  @HostListener('window:resize', ['$event'])
  onWindowResize(event) {
    if (this.dataViewColumnSettingGrid.instance) {
      this.dataViewColumnSettingGrid.instance.updateDimensions();
    }
  }

  buttonApplyAction() {
    if (!this.dataViewName) {
      this._notificationService.error('Error', 'Please input the view name', { timeOut: 3000, showProgressBar: false });
      return;
    }
    if (!this.dataSourceId) {
      this._notificationService.error('Error', 'Please input the data source', { timeOut: 3000, showProgressBar: false });
      return;
    }
    if (!this.dataFilterId) {
      this._notificationService.error('Error', 'Please input the data filter', { timeOut: 3000, showProgressBar: false });
      return;
    }

    switch (this.mode) {
      case 'create':
        this._dataViewApiService.createDataView({
          view_name: this.dataViewName,
          view_desc: this.dataViewDescription,
          data_source_id: this.dataSourceId,
          data_filter_id: this.dataFilterId,
          create_userid: this._dataStore.currentUser.user_id,
          edit_userid: this._dataStore.currentUser.user_id,
          user_id: this._dataStore.currentUser.user_id,
          view_type: 'company',
          company_id: this._dataStore.currentCustomer.customer_id
        }).then((newViewId) => {
          const tasks = [];
          this.dataViewColumnSettingGridContentSource.forEach((columnSetting) => {
            columnSetting.data_view_id = newViewId;
            tasks.push(this._dataViewApiService.createDataViewFieldSetting(columnSetting));
          });
          if (tasks.length === 0) {
            this.onApply.emit();
          } else {
            Promise.all(tasks)
              .then((res) => {
                this.onApply.emit();
              })
              .catch((error) => {
                this._notificationService.error('Error', 'Failed to create data view field settings', { timeOut: 3000, showProgressBar: false });
              });
          }
        }).catch((error) => {
          this._notificationService.error('Error', error, { timeOut: 3000, showProgressBar: false });
        });
        break;
      case 'edit':
        this._dataViewApiService.updateDataView({
          search_view_id: this.currentViewId,
          view_name: this.dataViewName,
          view_desc: this.dataViewDescription,
          data_source_id: this.dataSourceId,
          data_filter_id: this.dataFilterId
        }).then((res) => {
          const tasks = [];
          this.dataViewColumnSettingGridContentSource.forEach((columnSetting) => {
            const originColumnSetting = this.dataViewColumnSettingGridContentSourceOriginal.find((item) => item.data_view_field_setting_id === columnSetting.data_view_field_setting_id);

            if (!originColumnSetting) {
              // Create new column setting
              tasks.push(this._dataViewApiService.createDataViewFieldSetting(columnSetting));
            }
            if (JSON.stringify(columnSetting) === JSON.stringify(originColumnSetting)) {
              return;
            }

            const updateColumnSettingRequest = Object.assign({}, columnSetting);
            updateColumnSettingRequest.data_view_field_setting_id = undefined;
            updateColumnSettingRequest.search_data_view_field_setting_id = columnSetting.data_view_field_setting_id;
            tasks.push(this._dataViewApiService.updateDataViewFieldSetting(updateColumnSettingRequest));
          });

          this.dataViewColumnSettingGridContentSourceOriginal.forEach((originalSetting) => {
            const columnSettingIndex = this.dataViewColumnSettingGridContentSource.findIndex((item) => item.data_view_field_setting_id === originalSetting.data_view_field_setting_id);
            if (columnSettingIndex < 0) {
              // Means the origin column setting is deleted
              tasks.push(this._dataViewApiService.deleteDataViewFieldSetting(originalSetting.data_view_field_setting_id));
            }
          });

          if (tasks.length === 0) {
            this.onApply.emit();
          } else {
            Promise.all(tasks)
              .then((res) => {
                this.onApply.emit();
              })
              .catch((error) => {
                this._notificationService.error('Error', 'Failed to update data view field settings', { timeOut: 3000, showProgressBar: false });
              });
          }
        }).catch((error) => {
          this._notificationService.error('Error', error, { timeOut: 3000, showProgressBar: false });
        });
        break;
      default:
        break;
    }
  }

  buttonCancelAction() {
    this.onCancel.emit();
  }

  gridColumnSettingRowInsertingAction(event) {
    event.data.data_view_field_setting_id = uuid();
    event.data.data_view_id = this.currentViewId;
  }

  selectDataSourceValueChangedAction(event) {
    this.dataSourceId = event.value;

    if (this.initialLoaded) {
      this.initialLoaded = false;
    } else {
      this.dataFilterId = '';
    }
    if (this.dataFilterSelectBox.instance) {
      this.dataFilterSelectBox.instance.getDataSource().reload()
        .then(() => {
          this.dataFilterSelectBox.instance.repaint();
        });
    }

    const selectedDataSource = this.dataSourceContentList.find(item => item.data_source_id === this.dataSourceId);
    this._zone.run(() => {
      if (selectedDataSource && selectedDataSource.data_source_fields) {
        this.dataSourceFields = selectedDataSource.data_source_fields.sort((first, second) => {
          if (first.data_source_field_displayname < second.data_source_field_displayname) {
            return -1;
          }
          return 1;
        });;
      } else {
        this.dataSourceFields = [];
      }
    });
  }

  private _initialize() {
    this.initialLoaded = true;
    if (this.mode === 'edit') {
      Promise.all([
        this._dataViewApiService.retrieveDataView(this.currentViewId),
        this._dataViewApiService.findDataViewFieldSettings(this.currentViewId)
      ]).then(([viewDetails, viewFieldSettings]: any[]) => {
        this.dataViewName = viewDetails.view_name;
        this.dataViewDescription = viewDetails.view_desc;

        this.dataFilterId = viewDetails.data_filter_id;
        this.dataFilterDescription = '';

        this.dataSourceId = viewDetails.data_source_id;

        this.dataViewColumnSettingGridContentSource = viewFieldSettings.map(setting => Object.assign({}, setting)).sort((first, second) => {
          if (Number(first.data_view_field_sequence) < Number(second.data_view_field_sequence)) {
            return -1;
          }

          return 1;
        });
        this.dataViewColumnSettingGridContentSourceOriginal = viewFieldSettings;
      }).catch((error) => {
        this._notificationService.error('Error', error, { timeOut: 3000, showProgressBar: false });
      });
    } else if (this.mode === 'create') {
      this.dataViewName = '';
      this.dataViewDescription = '';

      this.dataFilterId = '';
      this.dataFilterDescription = '';

      this.dataSourceId = '';

      this.dataViewColumnSettingGridContentSource = [];
      this.dataViewColumnSettingGridContentSourceOriginal = [];
    }

    if (this.dataViewColumnSettingGrid.instance) {
      this.dataViewColumnSettingGrid.instance.cancelEditData();
    }
  }
}
