import { Component, OnInit, ViewChild } from '@angular/core';
import { DataStore } from 'app/providers/datastore';
import { MyCalendarApi } from 'app/customer-portal/my-calendar/my-calendar.component.api.service';
import { NotificationsService } from 'angular2-notifications';
import { ViewProjectApi } from '../view-project.api.service';
import { ProjectsApi } from 'app/customer-portal/my-projects/my-projects.api.service';
import { ActivatedRoute } from '@angular/router';
import { MomentPipe } from 'app/shared/pipes/moment.pipe';
import { AmazonService } from 'app/providers/amazon.service';
import DateTimeUtils from 'app/utils/date-time';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-project-overview',
  templateUrl: './project-overview.component.html',
  styleUrls: ['./project-overview.component.scss'],
  providers: [
    MyCalendarApi,
    MomentPipe,
    AmazonService
  ]
})
export class ProjectOverviewComponent implements OnInit {
  @ViewChild('grid', { static: false }) grid;
  @ViewChild('removeProjectModal', { static: false }) removeProjectModal;
  @ViewChild('transactionLogsModal', { static: false }) transactionLogsModal;
  @ViewChild('editProjectModal', { static: false }) editProjectModal;
  @ViewChild('addEventModal', { static: false }) addEventModal;
  @ViewChild('editEventModal', { static: false }) editEventModal;
  @ViewChild('addSubmissionModal', { static: false }) addSubmissionModal;
  
  destinationId = '';

  columnDefs = [
    {
      headerName: 'Date',
      field: 'timestamp',
      sortable: true,
      filter: true,
      resizable: true,
      editable: false,
      minWidth: 250,
    },
    {
      headerName: 'Name',
      field: 'name',
      sortable: true,
      filter: true,
      resizable: true,
      editable: false,
      minWidth: 250,
    }
  ];

  rowData = null;

  lat = 51.678418;
  lng = 7.809007;

  noAddress = false;

  constructor(
    private _momentPipe: MomentPipe,
    public dataStore: DataStore,
    public calendarApi: MyCalendarApi,
    private viewProjectApi: ViewProjectApi,
    private projectsApi: ProjectsApi,
    private notificationService: NotificationsService,
    public route: ActivatedRoute,
    private amazonService: AmazonService,
    private spinner: NgxSpinnerService,
  ) {
  }

  ngOnInit() {
    if (this.dataStore.currentProject) {
      this.loadInfo();
      if (this.route.snapshot.queryParams['status'] === 'edit') {
        this.onEditProject();
      }
    } else {
      this.dataStore.getProjectState.subscribe(value => {
        if (value) {
          this.loadInfo();

          if (this.route.snapshot.queryParams['status'] === 'edit') {
            this.onEditProject();
          }
        }
      });
    }

  }

  onGridReady(params): void {
    params.api.sizeColumnsToFit();
  }

  loadInfo() {
    this.loadMap();
    this.loadDates();
  }

  loadMap() {
    try {
      const geocoder = new window['google'].maps.Geocoder();
      geocoder.geocode({ address: this.dataStore.currentProject.project_address }, (res, status) => {
        if (status === window['google'].maps.GeocoderStatus.OK) {
          new window['google'].maps.Map(document.getElementById('google_map'), {
            center: res[0].geometry.location,
            zoom: 16,
          });
        } else {
          this.noAddress = true;
        }
      });
    } catch (err) {
      this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
    }
  }

  loadDates() {
    
    const projectDates = [
      {
        timestamp: this.dataStore.currentProject['create_datetime_origin'],
        name: 'Project Created',
        event: null,
      },
      {
        timestamp: this.dataStore.currentProject['edit_datetime_origin'],
        name: 'Project Edited',
        event: null,
      }
    ];

    this.calendarApi.findCalendarEvents(null, this.dataStore.currentProject['project_id'])
      .then((events: any[]) => {
        events.forEach(event => {
          projectDates.push({
            timestamp: event.calendar_event_start_datetime,
            name: event.calendar_event_name,
            event,
          });
        });

        projectDates.sort((prev, next) => {
          if (prev.timestamp < next.timestamp) {
            return -1;
          } else {
            return 1;
          }
        });

        this.rowData = projectDates.map(projectDate => {
          return {
            timestamp: this._momentPipe.transform(projectDate.timestamp, 'YYYY-MM-DD hh:mm a z'),
            name: projectDate.name,
            event: projectDate.event,
          };
        });
      })
      .catch(err => {
        this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
      });
  }

  convertToFormattedTimestamp(timestamp: string) {
    const timezone = this.dataStore.currentCustomer ? (this.dataStore.currentCustomer['customer_timezone'] || 'eastern') : 'eastern';
    const timestampFormat = 'YYYY-MM-DD HH:mm:ss z';

    return this.viewProjectApi.convertToTimeZoneObject(timestamp, timezone).format(timestampFormat);
  }

  formatValue(value: string) {
    if (value) {
      return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    } else {
      return ;
    }
  }

  onUpdateProject() {
    this.spinner.show();

    const projectId = this.dataStore.currentProject.project_id;

    this.viewProjectApi.getProjectSettings(projectId)
      .then((res: any[]) => {
        const destinationTypeId = res.find(setting => setting.setting_name === 'PROJECT_DESTINATION_TYPE_ID');
        const destinationPath = res.find(setting => setting.setting_name === 'PROJECT_DESTINATION_PATH');
        const destinationId = res.find(setting => setting.setting_name === 'PROJECT_DESTINATION_ID'); 
        return {
          destinationTypeId,
          destinationPath,
          destinationId,
        };
      }).then(({ destinationId, destinationPath, destinationTypeId }) => {        
        if ((destinationId == '' || destinationId  == undefined || destinationId  == null)
          || (destinationTypeId  == '' || destinationTypeId == undefined || destinationTypeId == null)
        ) {
          const message = 'We are sorry, but the Create920 function cannot be used because required parameters for the project have not been defined. Make sure that the following values have been defined: <list of missing parameter>. And try again'
          this.notificationService.error('Error', message, { timeOut: 3000, showProgressBar: false });
        } else {
          const params: any = {
            submission_type: 'user',
            submitter_email: this.dataStore.currentUser.user_email,
            submission_datetime: DateTimeUtils.getTimestamp(),
            user_id: this.dataStore.currentUser.user_id,
            user_timezone: (this.dataStore.currentCustomer ? this.dataStore.currentCustomer['customer_timezone'] : 'eastern') || 'eastern',
            customer_id:  this.dataStore.currentProject.customer_id,
            process_status: 'queued',
            destination_sys_type: destinationTypeId,
            destination_path: destinationPath,
            destination_id: destinationId,
            project_id: projectId,
            project_name: this.dataStore.currentProject.project_name,
            source_sys_type_id: this.dataStore.currentProject.source_sys_type_id,
            source_url: this.dataStore.currentProject.source_url,
            source_token: this.dataStore.currentProject.source_token,
            source_password: this.dataStore.currentProject.source_password,
          }

          this.amazonService.updateProject(params)
          .then((result: any[]) => {
            if (result) {
              this.notificationService.success('Success', 'Your project has been scheduled for retrieving an update from the source.This may take between 15 - 60 min (possibly longer for very large projects) and you will receive an email notification if there are any changes.', { timeOut: 3000, showProgressBar: false });
            } else {
              this.notificationService.error('Error', 'This Record has been not created.', { timeOut: 3000, showProgressBar: false });
            }
          });
        }
      })
      .catch(err => {
        console.log(err);
      })
      .finally(() => {
        this.spinner.hide();
      })
  }

  onViewDocuments() {
    const { currentUser: { user_id: userId } } = this.dataStore;
    window.open(`${window['env'].docViewerBaseUrl}?project_id=${this.dataStore.currentProject['project_id']}&user_id=${userId}&doc_id=unknown&folder_id=unknown&doc_type=normal`, '_blank');
  }

  onViewProjectSourceSystem() {
    if (this.dataStore && this.dataStore.currentProject && this.dataStore.currentProject['source_url']) {
      window.open(this.dataStore.currentProject['source_url'], '_blank');
      return;
    }
    this.notificationService.error('Error', 'This project source system is empty.', { timeOut: 3000, showProgressBar: false });
  }

  onEditProject() {
    this.editProjectModal.initialize(this, this.dataStore.currentProject);
  }

  onAddToMyProjects() {
  }

  onArchiveProject() {
    this.removeProjectModal.initialize([this.dataStore.currentProject], false, this);
  }

  onDeleteProject() {
    this.removeProjectModal.initialize([this.dataStore.currentProject], true, this);
  }

  onDownloadProject() {
    this.projectsApi.getPublishedLink(this.dataStore.currentProject['project_id'])
      .then((url: string) => {
        const downloadUrl = url.replace('dl=0', 'dl=1');
        window.open(downloadUrl, '_blank');
      })
      .catch(err => {
        this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
      });
  }

  onViewPublishedProject() {
    this.projectsApi.getPublishedLink(this.dataStore.currentProject['project_id'])
      .then((url: string) => {
        window.open(url, '_blank');
      })
      .catch(err => {
        this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
      });
  }

  onAddProjectEvent() {
    this.addEventModal.initialize(
      this,
      {
        startDate: new Date(),
        endDate: new Date(),
        project_id: this.dataStore.currentProject['project_id'],
      }
    );
  }

  onEditProjectEvent() {
    const selectedEvent = this.grid.api.getSelectedRows();

    if (selectedEvent.length !== 1 || !selectedEvent[0]['event']) {
      this.notificationService.error('Error', 'Please select an event to edit!', { timeOut: 3000, showProgressBar: false });
    } else {
      this.editEventModal.initialize(
        this,
        {
          event: selectedEvent[0]['event'],
          startDate: selectedEvent[0]['event']['calendar_event_start_datetime'],
          endDate: selectedEvent[0]['event']['calendar_event_end_datetime'] || selectedEvent[0]['event']['calendar_event_start_datetime'],
        }
      );
    }
  }
  onAddDocsToProjectEvent()
  {
    this.addSubmissionModal.initialize(this.dataStore.currentProject, this); 
  }
  

  onViewTransactionLogs() {
    this.transactionLogsModal.initialize(this.dataStore.currentProject);
  }

  onHelp() {
    // TODO
  }

  onRefresh() {
    window.location.reload();
  }
}
