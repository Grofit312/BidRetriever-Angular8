import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { AmazonService } from 'app/providers/amazon.service';
import { ProjectsApi } from 'app/customer-portal/my-projects/my-projects.api.service';

import { NotificationsService } from 'angular2-notifications';
import { DataStore } from 'app/providers/datastore';

@Component({
  selector: 'document-detail-modal',
  templateUrl: './document-detail-modal.component.html',
  styleUrls: ['./document-detail-modal.component.scss']
})
export class DocumentDetailModalComponent implements OnInit {

  @ViewChild('documentDetailModal', { static: false }) documentDetailModal: ElementRef;
  @ViewChild('editDocumentModal', { static: false }) editDocumentModal;
  @ViewChild('grid', { static: false }) grid;

  hasTransparentBackground = true;

  currentProject: any = {};
  currentSubmission: any = {};
  currentDocument: any = {};

  rowData = null;

  documentsViewMode = 'all';

  columnDefs = [
    {
      headerName: 'Submission Date',
      field: 'submission_datetime',
      minWidth: 150,
      resizable: true,
      sortable: true,
      checkboxSelection: true,
      rowDrag: true,
    },
    {
      headerName: 'Submission Name',
      field: 'submission_name',
      minWidth: 150,
      resizable: true,
      sortable: true,
    },
    {
      headerName: 'Submitter',
      field: 'submitter_email',
      minWidth: 200,
      resizable: true,
      sortable: true,
    },
    {
      headerName: 'Document Name',
      field: 'doc_name',
      minWidth: 200,
      resizable: true,
      sortable: true,
    },
    {
      headerName: 'Doc Revision',
      field: 'doc_revision',
      minWidth: 150,
      resizable: true,
      sortable: true,
    },
    {
      headerName: 'Current Rev',
      field: 'current_rev',
      minWidth: 150,
      resizable: true,
      sortable: true,
    },
  ];

  constructor(
    private apiService: ProjectsApi,
    private amazonService: AmazonService,
    private notificationService: NotificationsService,
    public dataStore: DataStore,
  ) { }

  ngOnInit() {

  }

  onGridReady(params): void {
    params.api.sizeColumnsToFit();
  }

  initialize(selectedProject: any, selectedSubmission: any = null, selectedDocument: any = null, isTransparent = true) {
    this.currentProject = selectedProject;
    this.currentSubmission = selectedSubmission;
    this.currentDocument = selectedDocument;
    this.hasTransparentBackground = isTransparent;

    this.rowData = null;

    this.documentDetailModal.nativeElement.style.display = 'block';

    this.loadRevisions();
  }

  loadRevisions() {
    this.apiService.getDocumentRevisions(
      this.currentDocument['doc_id'],
      this.dataStore.currentCustomer ? (this.dataStore.currentCustomer['customer_timezone'] || 'eastern') : 'eastern',
    )
      .then((logs: any) => {
        this.rowData = logs;
      })
      .catch(err => {
        console.log(err);
        this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
      });
  }

  onViewDocument() {
    const selectedDocuments = this.grid.api.getSelectedRows();

    if (selectedDocuments.length === 0) {
      return this.notificationService.error('No selection', 'Please select at least one document', { timeOut: 3000, showProgressBar: false });
    }

    selectedDocuments.forEach(document => {
      if (document.doc_name.toLowerCase().includes('.pdf')) {
        const { currentUser: { user_id: userId } } = this.dataStore;
        window.open(`${window['env'].docViewerBaseUrl}?project_id=${this.currentProject['project_id']}&user_id=${userId}&folder_id=unknown&doc_id=${document['doc_id']}&doc_type=normal`, '_blank');
      } else {
        this.amazonService.getPresignedUrl(document['bucket_original_file'], document['file_key_original'])
          .then((url: string) => {
            window.open(url, '_blank');
          })
          .catch(err => {
            this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
          });
      }
    });
  }

  onViewComparison() {
    const selectedDocuments = this.grid.api.getSelectedRows();

    if (selectedDocuments.length === 0) {
      return this.notificationService.error('No selection', 'Please select at least one document', { timeOut: 3000, showProgressBar: false });
    }

    selectedDocuments.forEach(document => {
      const { currentUser: { user_id: userId } } = this.dataStore;
      window.open(`${window['env'].docViewerBaseUrl}?project_id=${this.currentProject['project_id']}&user_id=${userId}&folder_id=unknown&doc_id=${document['doc_id']}&doc_type=comparison`, '_blank');
    });
  }

  onViewParentFile() {
    const selectedDocuments = this.grid.api.getSelectedRows();

    if (selectedDocuments.length === 0) {
      return this.notificationService.error('No selection', 'Please select at least one document', { timeOut: 3000, showProgressBar: false });
    }

    const documentsWithParent = selectedDocuments.filter(document => document['bucket_parent_file'] && document['file_key_parent']);
    const urlTasks = documentsWithParent.map(document => this.amazonService.getPresignedUrl(document['bucket_parent_file'], document['file_key_parent']));

    Promise.all(urlTasks)
      .then((urls: any[]) => {
        urls.forEach(url => window.open(url, '_blank'));
      })
      .catch(errs => {
        errs.forEach(err => {
          this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
        });
      });
  }

  onViewRasterFile() {
    const selectedDocuments = this.grid.api.getSelectedRows();

    if (selectedDocuments.length === 0) {
      return this.notificationService.error('No selection', 'Please select at least one document', { timeOut: 3000, showProgressBar: false });
    }

    const documentsWithRasterImage = selectedDocuments.filter(document => document['bucket_raster_file'] && document['file_key_raster']);
    const urlTasks = documentsWithRasterImage.map(document => this.amazonService.getPresignedUrl(document['bucket_raster_file'], document['file_key_raster']));

    Promise.all(urlTasks)
      .then((urls: any[]) => {
        urls.forEach(url => window.open(url, '_blank'));
      })
      .catch(errs => {
        errs.forEach(err => {
          this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
        });
      });
  }

  onEditDocument() {
    const selectedDocuments = this.grid.api.getSelectedRows();

    if (selectedDocuments.length > 1) {
      this.notificationService.error('Multi Selection', 'Please select one document!', { timeOut: 3000, showProgressBar: false });
    } else if (selectedDocuments.length === 1) {
      this.editDocumentModal.initialize(this, selectedDocuments[0]['doc_id']);
    } else {
      this.notificationService.error('No Selection', 'Please select one document!', { timeOut: 3000, showProgressBar: false });
    }

    return false;
  }

  onRemoveDocument() {

  }

  onPrintReport() {

  }

  onRefresh() {
    this.loadRevisions();
  }

  onHelp() {

  }

  onCloseModal() {
    this.documentDetailModal.nativeElement.style.display = 'none';
  }

  /* Table Event: Global Search */
  onSearchChange(searchWord: string) {
    this.grid.gridOptions.api.setQuickFilter(searchWord);
  }
}
