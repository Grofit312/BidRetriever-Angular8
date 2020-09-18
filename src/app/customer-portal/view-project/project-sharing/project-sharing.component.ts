import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ProjectSharingApi } from './project-sharing.api.service';
import { ActivatedRoute } from '@angular/router';
import { NotificationsService } from 'angular2-notifications';
import { NgxSpinnerService } from 'ngx-spinner';
import { DataStore } from 'app/providers/datastore';
import { ProjectsApi } from 'app/customer-portal/my-projects/my-projects.api.service';
import { emailTemplate } from './sharing.template';

@Component({
  selector: 'app-project-sharing',
  templateUrl: './project-sharing.component.html',
  styleUrls: ['./project-sharing.component.scss'],
  providers: [ProjectSharingApi, ProjectsApi]
})
export class ProjectSharingComponent implements OnInit {
  @ViewChild('grid', { static: false }) grid;
  @ViewChild('addShareUserModal', { static: false }) addShareUserModal;
  @ViewChild('publicShareModal', { static: false }) publicShareModal;
  @ViewChild('removeShareModal', { static: false }) removeShareModal;
  @ViewChild('clipboardInput', { static: false }) clipboardInput: ElementRef;

  columnDefs = [
    {
      headerName: 'User Email',
      field: 'share_user_email',
      sortable: true,
      filter: true,
      resizable: true,
      editable: true,
      minWidth: 200,
    },
    {
      headerName: 'Company Name',
      field: 'share_company_name',
      sortable: true,
      filter: true,
      resizable: true,
      editable: false,
      minWidth: 200,
    },
    {
      headerName: 'User Display Name',
      field: 'share_user_displayname',
      sortable: true,
      filter: true,
      resizable: true,
      editable: false,
      minWidth: 200,
    },
    {
      headerName: 'User Phone Number',
      field: 'share_user_phone',
      sortable: true,
      filter: true,
      resizable: true,
      editable: false,
      minWidth: 200,
    },
    {
      headerName: 'Share Type',
      field: 'share_type',
      sortable: true,
      filter: true,
      resizable: true,
      editable: false,
      minWidth: 100
    }
  ];

  originData = [];
  rowData = null;

  get projectId() { return this.activatedRoute.parent.snapshot.params['project_id']; }
  get isPubliclyShared() {
    return this.originData.find(sharedProject => sharedProject['public'] && sharedProject['project_id'] === this.projectId);
  }

  constructor(
    private projectSharingApi: ProjectSharingApi,
    private projectsApi: ProjectsApi,
    private activatedRoute: ActivatedRoute,
    private notificationService: NotificationsService,
    private spinner: NgxSpinnerService,
    public dataStore: DataStore,
  ) { }

  ngOnInit() {

    this.load();
  }

  onGridReady(params): void {
    params.api.sizeColumnsToFit();
  }

  load() {
    
    this.projectSharingApi.findShareUsers(this.projectId)
      .then((users: any[]) => {
        this.originData = users;
        this.rowData =users;
        console.log(this.rowData);
      })
      .catch(err => {
        this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
      });
  }

  publicShare() {
    const params = {
      project_id: this.projectId,
      share_source_company_id: this.dataStore.currentUser['customer_id'],
      share_source_user_id: this.dataStore.currentUser['user_id'],
      is_public: true,
    };

    this.spinner.show();

    this.projectSharingApi.createSharedProject(params)
      .then(res => {
        this.spinner.hide();
        this.notificationService.success('Success', 'Project has been shared publicly.', { timeOut: 3000, showProgressBar: false });

        this.load();
      })
      .catch(err => {
        this.spinner.hide();
        this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
      });
  }

  removeShare(shared_project_id: string) {
    this.spinner.show();

    const params = {
      search_shared_project_id: shared_project_id,
      status: 'inactive',
    };

    this.projectSharingApi.updateSharedProject(params)
      .then(res => {
        this.spinner.hide();
        this.notificationService.success('Success', 'Sharing Removed', { timeOut: 3000, showProgressBar: false });

        this.load();
      })
      .catch(err => {
        this.spinner.hide();
        this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
      });
  }

  getDownloadLink = () => {
    return new Promise<string>((resolve, reject) => {
      this.projectsApi.getPublishedLink(this.dataStore.currentProject['project_id'])
        .then((url: string) => {
          const downloadUrl = url.replace('dl=0', 'dl=1');
          resolve(downloadUrl);
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  getViewLink = () => {
    return `${window.location.origin}/customer-portal/view-project/${this.dataStore.currentProject['project_id']}`;
  }

  onAddShare() {
    this.addShareUserModal.initialize(this.projectId, this);
  }

  onRemoveShare() {
    const selectedShares = this.grid.api.getSelectedRows();

    if (selectedShares.length !== 1) {
      this.notificationService.error('Error', 'Please select one record!', { timeOut: 3000, showProgressBar: false });
    } else {
      this.removeShareModal.initialize(this, selectedShares[0]['shared_project_id']);
    }
  }

  onSharePublicly() {
    const publicSharedProject = this.isPubliclyShared;

    if (publicSharedProject) {
      this.removeShare(publicSharedProject.shared_project_id);
    } else {
      this.publicShareModal.initialize(this);
    }
  }

  onCopyDownloadLink() {
    this.getDownloadLink().then(url => {
      this.copyToClipboard(url);
    }).catch(err => {
      this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
    });
  }

  onCopyViewLink() {
    this.copyToClipboard(this.getViewLink());
  }

  onCopyEmailLinks() {
    this.getDownloadLink().then(downloadUrl => {
      const viewUrl = this.getViewLink();
      const replacedTemplate = emailTemplate.replace('<DOWNLOAD_URL>', downloadUrl).replace('<VIEW_URL>', viewUrl);
      this.copyToClipboard(replacedTemplate);
    }).catch(err => {
      this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
    });
  }

  onRefresh() {
    this.load();
  }

  onHelp() {

  }

  copyToClipboard(value: string) {
    this.clipboardInput.nativeElement.value = value;
    this.clipboardInput.nativeElement.select();
    this.clipboardInput.nativeElement.setSelectionRange(0, 99999);
    document.execCommand('copy');

    this.notificationService.success('Success', 'Copied to clipboard', { timeOut: 3000, showProgressBar: false });
  }
}
