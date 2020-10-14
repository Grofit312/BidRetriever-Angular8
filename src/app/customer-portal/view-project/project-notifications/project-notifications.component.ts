import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { ViewProjectApi } from 'app/customer-portal/view-project/view-project.api.service';

import { NotificationsService } from 'angular2-notifications';
import { DataStore } from 'app/providers/datastore';
import { Router, ActivatedRoute } from '@angular/router';
@Component({
  selector: 'app-project-notifications',
  templateUrl: './project-notifications.component.html',
  styleUrls: ['./project-notifications.component.scss']
})
export class ProjectNotificationsComponent implements OnInit {

  @ViewChild('grid', { static: false }) grid;
  @ViewChild('notificationHtml', { static: false }) notificationHtml: ElementRef;

  notificationViewMode = 'all';

  showPreviewPane = false;

  columnDefs = [
    {
      headerName: 'Date Sent',
      field: 'date_sent',
      sortable: true, filter: true,
      resizable: true, editable: true,
      checkboxSelection: true,
      rowDrag: true,
      minWidth: 150,
    },
    {
      headerName: 'Time Sent',
      field: 'time_sent',
      sortable: true,
      filter: true,
      resizable: true,
      minWidth: 150,
    },
    {
      headerName: 'Notification Name',
      field: 'notification_type',
      sortable: true,
      filter: true,
      resizable: true,
      minWidth: 200,
    },
    {
      headerName: 'Recipient',
      field: 'user_email',
      sortable: true,
      filter: true,
      resizable: true,
      minWidth: 200,
    },
    {
      headerName: 'Subject',
      field: 'notification_actual_subject',
      sortable: true,
      filter: true,
      resizable: true,
      minWidth: 300,
    },
    {
      headerName: 'From Name',
      field: 'notification_actual_from_name',
      sortable: true,
      filter: true,
      resizable: true,
      minWidth: 150,
    },
    {
      headerName: 'Submission',
      field: 'submission_name',
      sortable: true,
      filter: true,
      resizable: true,
      minWidth: 150,
    },
  ];

  rowData = null;

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private apiService: ViewProjectApi,
    private notificationService: NotificationsService,
    public dataStore: DataStore,
  ) { }

  ngOnInit() {
    this.loadUserNotifications();
  }

  loadUserNotifications() {
    const projectId = this.activatedRoute.parent.snapshot.params['project_id'];

    this.apiService.findUserNotifications(projectId, this.dataStore.currentCustomer ? (this.dataStore.currentCustomer['customer_timezone'] || 'eastern') : 'eastern')
      .then((res: any[]) => {
        this.rowData = res;
      })
      .catch(err => {
        this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
      });
  }

  onTogglePreview() {
    this.showPreviewPane = !this.showPreviewPane;
  }

  onViewNotification() {
    const selectedRows = this.grid.api.getSelectedRows();

    if (selectedRows.length === 0) {
      this.notificationService.error('No Selection', 'Please select one notification!', { timeOut: 3000, showProgressBar: false });
      return;
    } else if (selectedRows.length > 1) {
      this.notificationService.error('Multiple Selection', 'Please select just one notification!', { timeOut: 3000, showProgressBar: false });
      return;
    }
        window.open(`/customer-portal/notification-viewer`, '_blank');
  }

  onNewNotification() {

  } 

  addNotificationGridMenuItems(e) {
        if (!e.row) { return; }
    
        if (!e.row.data.project_bid_datetime) {
          e.row.data.project_bid_datetime = null;
        }
    
        e.component.selectRows([e.row.data.project_id]);
    
        if (e.row && e.row.rowType === 'data') {   // e.items can be undefined
          if (!e.items) { e.items = []; }
    
          // Add a custom menu item
          // e.items.push(
          //   {
          //     type: 'normal',
          //     text: 'View Notification',
          //     onItemClick: () => this.toolbarViewProjectAction()
          //   },
          //   {
          //     type: 'normal',
          //     text: 'New Notification',
          //     onItemClick: () => this.toolbarAddProjectAction()
          //   },
          //   {
          //     type: 'normal',
          //     text: 'Show Preview',
          //     onItemClick: () => this.toolbarViewProjectDocumentsAction()
          //   },         
          // );
        }
        return e;
      }
  onGridSelectionChanged(event: any) {
    const selectedRows = this.grid.api.getSelectedRows();

    if (selectedRows.length === 0) {
      this.notificationHtml.nativeElement.innerHTML = '';
    } else {
      localStorage.setItem('notification_content', selectedRows[0]['notification_actual_html']);
      this.notificationHtml.nativeElement.innerHTML = selectedRows[0]['notification_actual_html'];
    }
  }

  onChangeNotificationViewMode() {

  }

  /* Table Event: Grid Ready */
  onGridReady(event: any) {
    const defaultSortModel = [
      { colId: "date_sent", sort: "desc" },
      { colId: "time_sent", sort: "desc" },
    ];
    event.api.setSortModel(defaultSortModel);
    event.api.sizeColumnsToFit();
  }

  /* Table Event: Global Search */
  onSearchChange(searchWord: string) {
    this.grid.gridOptions.api.setQuickFilter(searchWord);
  }
}
