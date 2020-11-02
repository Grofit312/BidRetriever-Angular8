import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { ViewProjectApi } from 'app/customer-portal/view-project/view-project.api.service';
import CustomStore from 'devextreme/data/custom_store';
import { NotificationsService } from 'angular2-notifications';
import { DataStore } from 'app/providers/datastore';
import { AuthApi } from 'app/providers/auth.api.service';
import { Router, ActivatedRoute } from '@angular/router';
import { DxDataGridComponent, DxToolbarComponent, DxSelectBoxComponent } from 'devextreme-angular';

@Component({
  selector: 'app-project-notifications',
  templateUrl: './project-notifications.component.html',
  styleUrls: ['./project-notifications.component.scss']
})
export class ProjectNotificationsComponent implements OnInit {

  @ViewChild('grid', { static: false }) grid;
  @ViewChild('notificationHtml', { static: false }) notificationHtml: ElementRef;
  @ViewChild('notificationGrid', { static: false }) notificationGrid: DxDataGridComponent;
  notificationViewMode = 'all';

  showPreviewPane = false;




  
  notificationGridColumns: any[];
  notificationGridDataSource: any;
  notificationGridContent = [];
  notificationGridContentLoaded = false;

  notificationViewTypeSelected = null;

  
  toolbarConfig: any = {};
  toolbarUsersSelectBox: any = null;
  toolbarUsersContent = [];
  selectedUserId = null;
  selectedCustomerId = null;
  searchWord = '';

  
  rowData = null;

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private apiService: ViewProjectApi,
    private authApiService: AuthApi,
    private notificationService: NotificationsService,
    public dataStore: DataStore,
  ) { 

    this.notificationGridDataSource = new CustomStore({
      key: 'user_notification_id',
      load: (loadOptions) => this.gridNotificationLoadAction(loadOptions)
    });

  }

  ngOnInit() {
    
  }
  onChangeNotificationViewMode(){
    
  }
  
  onSearchChange(searchText) {
    this.searchWord =searchText;
    if (this.notificationGrid && this.notificationGrid.instance) {
      this.notificationGrid.instance.refresh();
    }
  }

  gridNotificationLoadAction(loadOptions) {
    return new Promise((resolve, reject) => {
      
      if (this.notificationGridContentLoaded) {
        const filteredNotifs = this.getGridNotificationContentByLoadOption(loadOptions);
        return resolve({
          data: filteredNotifs,
          totalCount: filteredNotifs.length
        });
      }

   

      const params = { detail_level: 'admin' };
  
      const projectId = this.activatedRoute.parent.snapshot.params['project_id'];

      const findNotifications = this.apiService.findUserNotifications(projectId, this.dataStore.currentCustomer ? (this.dataStore.currentCustomer['customer_timezone'] || 'eastern') : 'eastern');
      
      Promise.all([findNotifications])
        .then(([userNotifications, dataViewFieldSettings]) =>  {
          
         
         
          this.notificationGridContent = userNotifications as unknown as any[];
          this.notificationGridContentLoaded = true;
         
            this.notificationGridColumns = [
              { visible: false, dataField: 'user_notification_id', dataType: 'number', caption: 'user_notification_id', width: 250, allowEditing: false , },
              { dataField: 'date_sent', caption: 'Date Sent',  cellTemplate: 'dateCell', minWidth: 150, allowEditing: false },
              { dataField: 'time_sent', caption: 'Time Sent',  minWidth: 150, allowEditing: false },
              { dataField: 'notification_type', caption: 'notification_type', width: 400, minWidth: 200, allowEditing: false },
              { dataField: 'user_email', caption: 'Recipient', minWidth: 200, allowEditing: false },
              { dataField: 'notification_actual_subject', caption: 'Subject', minWidth: 300, allowEditing: false },
              { dataField: 'notification_actual_from_name', caption: 'From Name', minWidth: 150, allowEditing: false },
              { dataField: 'submission_name', caption: 'Submission', width: 150, minWidth: 150, allowEditing: false },
            ];

          const filteredProjects = this.getGridNotificationContentByLoadOption(loadOptions);
          return resolve({
            data: filteredProjects,
            totalCount: filteredProjects.length
          });
        })
        .catch((error) => {
          console.log('Load Error', error);
          this.notificationService.error('Error', error, { timeOut: 3000, showProgressBar: false });
          this.notificationGridContent = [];
          this.notificationGridContentLoaded = false;
          return resolve({
            data: this.notificationGridContent,
            totalCount: this.notificationGridContent.length
          });
        });
    });
  }
  getGridNotificationContentByLoadOption(loadOptions: any) {
    let notifs = this.notificationGridContent;
    
    if(this.searchWord)
    {
      notifs = notifs.filter((notif) => {
        const isMatched = Object.keys(notif).map(key => notif[key]).some(item => item.toString().toLowerCase().includes(this.searchWord));
        return isMatched;
      });
    }
    return notifs;
  }
  onTogglePreview() {
    this.showPreviewPane = !this.showPreviewPane;
    const { selectedRowKeys } = this.notificationGrid;

    if (selectedRowKeys.length === 0) {
      this.notificationHtml.nativeElement.innerHTML = '';
    } else {
      debugger
      const selectedRows = this.notificationGridContent.filter(({ user_notification_id: nId }) => selectedRowKeys.includes(nId));
    
      localStorage.setItem('notification_content', selectedRows[0]['notification_actual_html']);
      this.notificationHtml.nativeElement.innerHTML = selectedRows[0]['notification_actual_html'];
    }

  }

  onViewNotification() {
       
    const { selectedRowKeys } = this.notificationGrid;

    if (selectedRowKeys.length === 0) {
      this.notificationService.error('No Selection', 'Please select one notification!', { timeOut: 3000, showProgressBar: false });
      return;
    } else if (selectedRowKeys.length > 1) {
      this.notificationService.error('Multiple Selection', 'Please select just one notification!', { timeOut: 3000, showProgressBar: false });
      return;
    }
        window.open(`/customer-portal/notification-viewer`, '_blank');
  }

  onNewNotification() {

  } 

  addNotificationGridMenuItems(e) {
        if (!e.row) { return; }
    
        
    
        e.component.selectRows([e.row.data.user_notification_id]);
    
        if (e.row && e.row.rowType === 'data') {   // e.items can be undefined
          if (!e.items) { e.items = []; }
    
          e.items.push(
            {
              type: 'normal',
              text: 'View Notification',
              onItemClick: () => this.onViewNotification()
            },
            {
              type: 'normal',
              text: 'New Notification',
              onItemClick: () => this.onNewNotification()
            },
            {
              type: 'normal',
              text: this.showPreviewPane ? 'Hide Preview' : 'Show Preview' ,
              onItemClick: () => this.onTogglePreview()
            },         
          );
        }
        return e;
      }
}
