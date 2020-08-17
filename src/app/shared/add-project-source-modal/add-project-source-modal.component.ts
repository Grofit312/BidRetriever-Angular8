import { Component, OnInit, ViewChild, Output, EventEmitter } from '@angular/core';
import CustomStore from 'devextreme/data/custom_store';
import { DataStore } from 'app/providers/datastore';
import { ProjectSourceApi } from 'app/customer-portal/view-project/project-source/project-source.api.service';
import { DxDataGridComponent } from 'devextreme-angular';

@Component({
  selector: 'add-project-source-modal',
  templateUrl: './add-project-source-modal.component.html',
  styleUrls: ['./add-project-source-modal.component.scss'],
  providers: [ProjectSourceApi]
})
export class AddProjectSourceModalComponent implements OnInit {
  @Output('onApply') onApplyEmitter = new EventEmitter();
  @Output('onCancel') onCancelEmitter = new EventEmitter();

  @ViewChild('otherProjectsGrid', { static: true }) otherProjectsGrid: DxDataGridComponent;
  otherProjectSource: any;
  otherProjectsContent: any[] = [];
  otherProjectsContentLoaded = false;

  constructor(
    private _dataStore: DataStore,
    private _projectSourceApi: ProjectSourceApi
  ) {
    this.otherProjectSource = new CustomStore({
      key: 'project_id',
      load: (loadOptions) => new Promise((resolve, reject) => {
        if (this.otherProjectsContentLoaded) {
          let projects = this.otherProjectsContent;

          if (loadOptions.sort && loadOptions.sort.length > 0) {
            projects = projects.sort((first, second) => {
              let firstValue = first[loadOptions.sort[0].selector];
              let secondValue = second[loadOptions.sort[0].selector];
              if (loadOptions.sort[0].selector === 'project_bid_datetime') {
                firstValue = new Date(firstValue).getTime();
                secondValue = new Date(secondValue).getTime();
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
                  loadOptionIndex ++;
                  continue;
                }
                return 1;
              }
              return 1;
            });
          }

          if (loadOptions.filter && loadOptions.filter.length > 0) {
            const searchText = loadOptions.filter[0][2];

            projects = projects.filter((item) => {
              if (item['project_name'].toLowerCase().includes(searchText)
                || item['project_admin_user_fullname'].toLowerCase().includes(searchText)
                || item['source_sys_type_name'].toLowerCase().includes(searchText)
                || item['source_company_name'].toLowerCase().includes(searchText)
                || item['project_bid_datetime'].toLowerCase().includes(searchText)) {
                return true;
              }
              return false;
            });
          }

          return resolve({
            data: projects,
            totalCount: projects.length
          });
        }

        if (!this._dataStore.currentCustomer) {
          this.otherProjectsContent = [];
          this.otherProjectsContentLoaded = false;

          return resolve({
            data: [],
            totalCount: 0
          });
        } else {
          return this._projectSourceApi.findOtherProjects(this._dataStore.currentCustomer.customer_id)
          .then((projects: any) => {
            this.otherProjectsContent = projects.filter(({project_id}) => project_id !== this._dataStore.currentProject.project_id);
            this.otherProjectsContentLoaded = true;

            return resolve({
              data: this.otherProjectsContent,
              totalCount: this.otherProjectsContent.length
            });
          })
          .catch((error) => {
            console.log('FindDataView Error', error);
            this.otherProjectsContent = [];
            this.otherProjectsContentLoaded = false;

            return resolve({
              data: [],
              totalCount: 0
            });
          });
        }
      })
    });
  }

  ngOnInit() {
    this._dataStore.getProjectState.subscribe(value => {
      this.otherProjectsGrid.instance.refresh()
        .then(() => {})
        .catch((error) => {
          console.log('Grid Refresh Error', error);
        })
    });
  }

  onApplyAction() {
    const { selectedRowKeys } = this.otherProjectsGrid;
    if (selectedRowKeys.length == 0) {
      alert('Please select at least one project.');
      return;
    }

    const selectedRows = this.otherProjectsContent.filter(({project_id: projectId}) => selectedRowKeys.includes(projectId));

    const tasks = [];
    selectedRows.forEach((row) => {
      tasks.push(this._projectSourceApi.createProjectSource(
        this._dataStore.currentUser.user_id,
        this._dataStore.currentCustomer.customer_id,
        this._dataStore.currentProject.project_id,
        row.project_id,
        row.project_status
      ));
    });

    Promise.all(tasks)
      .then(() => {
        this.onApplyEmitter.emit();
      })
      .catch((error) => {
        console.log('onApplyAction Error', error);
        alert('Failed to add new project sources.');
      });
  }

  onCancelAction() {
    this.onCancelEmitter.emit();
  }
}
