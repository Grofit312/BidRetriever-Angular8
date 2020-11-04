import { Component, OnInit, ViewChild } from '@angular/core';
import CustomStore from 'devextreme/data/custom_store';
import { ActivatedRoute } from '@angular/router';
import { ProjectFilesApi } from './project-files.api.service';
import { NotificationsService } from 'angular2-notifications';
import { ViewProjectApi } from '../view-project.api.service';
import { IActionMapping, TREE_ACTIONS } from 'angular-tree-component';
import { ProjectsApi } from 'app/customer-portal/my-projects/my-projects.api.service';
import { AmazonService } from 'app/providers/amazon.service';
import { DataStore } from 'app/providers/datastore';
import { Logger } from 'app/providers/logger.service';
import { DxDataGridComponent } from 'devextreme-angular';
import { LoadOptions } from 'devextreme/data/load_options';
const moment = require('moment');


@Component({
  selector: 'app-project-files',
  templateUrl: './project-files.component.html',
  styleUrls: ['./project-files.component.scss'],
})
export class ProjectFilesComponent implements OnInit {

  @ViewChild('folderTree', { static: true }) folderTree;
  @ViewChild('fileGrid', { static: false }) fileGrid: DxDataGridComponent;
  @ViewChild('transactionLogsModal', { static: true }) transactionLogsModal;
  @ViewChild('documentDetailModal', { static: true }) documentDetailModal;
  @ViewChild('pdfViewerModal', { static: false }) pdfViewerModal;
  @ViewChild('editDocumentModal', { static: true }) editDocumentModal;
  @ViewChild('addSubmissionModal', { static: false }) addSubmissionModal;

  documentsViewMode = 'all';
  currentProject = {};
  ischildVisible = false;
  
  fileGridDataSource: any;
  fileGridContent = [];
  fileGridContentLoaded = false;
  

  notificationViewTypeSelected = null;
  prevClickEventDate = null;

  actionMapping: IActionMapping = {
    mouse: {
      click: (tree, node, event) => {
        node.setIsActive(true);
        TREE_ACTIONS.TOGGLE_SELECTED(tree, node, event);

        if (node !== this.activeFolderNode) {
          this.activeFolderNode = node;

          if (node.id !== this.currentProject['project_id']) {
            if (!this.prevClickEventDate || ((new Date().getTime() - this.prevClickEventDate.getTime() >= 400))) {
              this.loadFiles();
            }
          }
        }
        if (node.id === this.currentProject['project_id']) {
          this.loadRootFolders();
        } else {
          this.loadSubFolders();
        }
      },
      dblClick: (tree, node, event) => {
        if (node.id === this.currentProject['project_id']) {
          this.loadRootFolders();
        } else {
          this.loadSubFolders();
        }
      },
    }
  };

  folderNodes = [];
  treeOptions = {
    actionMapping: this.actionMapping,
  };
  activeFolderNode = null;

  
  fileGridColumns = [
    {caption: 'Document Name',dataField: 'doc_name',minWidth: 200,allowEditing: false},
    {caption: 'Doc Number',dataField: 'doc_number',minWidth: 100,allowEditing: false},
    {caption: 'Revision',dataField: 'doc_revision',minWidth: 100,allowEditing: false},
    {caption: 'Original File Name',dataField: 'folder_original_filename',minWidth: 200,allowEditing: false},
    {caption: 'Type',dataField: 'doc_type',minWidth: 150,allowEditing: false},
    {caption: 'Created Date',dataField: 'create_datetime',minWidth: 100, cellTemplate: 'dateCell', allowEditing: false},
    {caption: 'Submitted Date',dataField: 'submission_datetime',minWidth: 100,cellTemplate: 'dateCell', allowEditing: false},
    {caption: 'Process Status',dataField: 'process_status',minWidth: 100,allowEditing: false},
  ];

  files = null;

  favorites = [];

  get isFavoriteDocument(): boolean {
    if(!this.fileGrid) return false;
    const { selectedRowKeys } = this.fileGrid;
    if(selectedRowKeys === null) return;
    
    if (selectedRowKeys.length === 1) {
      
      if (this.favorites.find(favorite => favorite['favorite_id'] === selectedRowKeys[0]['doc_id'])) {
        return true;
      }
    }
    return false;
  }

  constructor(
    private activatedRoute: ActivatedRoute,
    private apiService: ProjectFilesApi,
    private projectApiService: ProjectsApi,
    private notificationService: NotificationsService,
    private viewProjectApiService: ViewProjectApi,
    private amazonService: AmazonService,
    private logger: Logger,
    public dataStore: DataStore
  ) {


   }

   

  ngOnInit() {
    // this.fileGrid.gridSizeChanged.subscribe(() => {
    //   this.fileGrid.api.sizeColumnsToFit();
    // });
    // this.fileGrid.columnResized.subscribe((event) => {
    //   if (event.source !== 'sizeColumnsToFit') {
    //     if (document.getElementsByClassName('ag-center-cols-container')[0]['offsetWidth'] < document.getElementsByClassName('ag-center-cols-viewport')[0]['offsetWidth']) {
    //       this.fileGrid.api.sizeColumnsToFit();
    //     }
    //   }
    // });

    if (this.dataStore.currentUser) {
      this.initialize();
      if (this.activatedRoute.snapshot.queryParams['viewDocumentId'] != null) {
        this.onViewDocumentDetails(this.activatedRoute.snapshot.queryParams['viewDocumentId']);
      } else if (this.activatedRoute.snapshot.queryParams['editDocumentId'] != null) {
        this.onEditDocument(this.activatedRoute.snapshot.queryParams['editDocumentId']);
      }
    } else {
      this.dataStore.authenticationState.subscribe(value => {
        if (value) {
          this.initialize();

          if (this.activatedRoute.snapshot.queryParams['viewDocumentId'] != null) {
            this.onViewDocumentDetails(this.activatedRoute.snapshot.queryParams['viewDocumentId']);
          } else if (this.activatedRoute.snapshot.queryParams['editDocumentId'] != null) {
            this.onEditDocument(this.activatedRoute.snapshot.queryParams['editDocumentId']);
          }
        }
      });
    }
  }

  initialize() {
    const projectId = this.activatedRoute.parent.snapshot.params['project_id'];
    if (this.dataStore.currentUser['user_id'] != null) {
      this.apiService.findUserFavorites(this.dataStore.currentUser['user_id'], projectId, 'document')
        .then((favorites: any[]) => {
          this.favorites = favorites;
          return this.viewProjectApiService.getProject(projectId, 'eastern');
        })
        .then(res => {
          this.currentProject = res;
          this.loadRootFolders();
          this.loadSubFolders(true);
        })
        .catch(err => {
          this.notificationService.error('Error bb', err, { timeOut: 3000, showProgressBar: false });
        });
    }
    this.logger.logActivity({
      activity_level: 'transaction',
      activity_name: 'View Project Details/Files',
      application_name: 'Customer Portal',
      customer_id: this.dataStore.currentUser.customer_id,
      user_id: this.dataStore.currentUser.user_id,
      project_id: projectId,
    });
  }

  loadRootFolders() {
    this.apiService.getFolderChildren(this.currentProject['project_id'], '', '')
      .then((res: any[]) => {
        this.folderNodes = [
          {
            id: this.currentProject['project_id'],
            name: this.currentProject['project_name'],
            children: res.map(folder => {
              return {
                id: folder['folder_id'],
                name: folder['folder_name'],
                children: [],
                hasChildren: folder.children > 0 ? true : false
              };
            }),
          }
        ];
        this.files = null;

        setTimeout(() => {
          this.folderTree.treeModel.getNodeById(this.currentProject['project_id']).expand();

          const currentPlansFolder = this.folderNodes[0].children.find(child => child.name === 'Plans-Current');
          if (currentPlansFolder) {
            this.activeFolderNode = this.folderTree.treeModel.getNodeById(currentPlansFolder.id);
            this.activeFolderNode.toggleActivated();
            this.loadSubFolders(true);
          } else {
            const currentPlansFolder = this.folderNodes[0].children.find(child => child.name === 'Plans-All');
            this.activeFolderNode = this.folderTree.treeModel.getNodeById(currentPlansFolder.id);
            this.activeFolderNode.toggleActivated();
            this.loadSubFolders(true);
          }
        });
      })
      .catch(err => {
        this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
      });
  }

  loadSubFolders(loadFiles: boolean = false) {
    const timezone = this.dataStore.currentCustomer ? (this.dataStore.currentCustomer['customer_timezone'] || 'eastern') : 'eastern';
    if (this.activeFolderNode != null){
      this.apiService.getFolderChildren('', '', this.activeFolderNode.id, timezone)
        .then((res: any[]) => {
          this.activeFolderNode.data.children = res.filter(child => child['child_type'] === 'folder').map(folder => {
            return {
              id: folder['folder_id'],
              name: folder['folder_name'],
              children: [],
              hasChildren: folder.children > 0 ? true : false
            };
          });
          this.folderTree.treeModel.update();

          if (loadFiles) {
            this.files = res.filter(child => child['child_type'] === 'file');
          }

          setTimeout(() => {
            this.folderTree.treeModel.getNodeById(this.activeFolderNode.id).expand();
          });
        })
        .catch(err => {
          this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
        });
  }
}



loadFiles() {
  this.files = null;
  const timezone = this.dataStore.currentCustomer ? (this.dataStore.currentCustomer['customer_timezone'] || 'eastern') : 'eastern';
  this.apiService.getFolderChildren('', '', this.activeFolderNode.id, timezone)
  .then((res: any[]) => {
    this.files = res.filter(child => child['child_type'] === 'file');
  })
  .catch(err => {
    this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
  });
  
}

onChangeDocumentViewMode() { }

onViewDocument() {
  
  const { selectedRowKeys } = this.fileGrid;
  if(selectedRowKeys === null) return;

  if (selectedRowKeys.length === 0) {
    this.notificationService.error('No Selection', 'Please select one document!', { timeOut: 3000, showProgressBar: false });
    return;
  } else if (selectedRowKeys.length > 1) {
    this.notificationService.error('Multiple Selection', 'Please select a single document.', { timeOut: 3000, showProgressBar: false });
    return;
  } 
  if (selectedRowKeys[0]['doc_type'] === 'original_other_project_document') {
    const splitArray = selectedRowKeys[0]['doc_name'].split('.');
    if (splitArray.length > 1) {
      const fileExtension = splitArray.pop();

      if (fileExtension.toLowerCase() !== 'pdf') {
        return this.onDownloadDocument();
      }
    } else {
      return this.onDownloadDocument();
    }
  }

  const isComparison = this.activeFolderNode.data['name'].includes('Comparison');
  const { currentUser: { user_id: userId } } = this.dataStore;
  window.open(`${window['env'].docViewerBaseUrl}?project_id=${this.currentProject['project_id']}&user_id=${userId}&folder_id=${selectedRowKeys[0]['folder_id']}&doc_id=${selectedRowKeys[0]['doc_id']}&doc_type=${isComparison ? 'comparison' : 'normal'}`, '_blank');
}

onViewDocumentDetails(docId ?: string) {
  if (docId == null) {
    const { selectedRowKeys } = this.fileGrid;
    if(selectedRowKeys === null) return;

    if (selectedRowKeys.length === 0) {
      this.notificationService.error('No Selection', 'Please select one document!', { timeOut: 3000, showProgressBar: false });
      return;
    } else if (selectedRowKeys.length > 1) {
      this.notificationService.error('Multiple Selection', 'Please select a single document.', { timeOut: 3000, showProgressBar: false });
      return;
    }
 
    const submission = {
      submission_datetime: selectedRowKeys[0]['submission_datetime'],
      submission_name: selectedRowKeys[0]['submission_name'],
      submitter_email: selectedRowKeys[0]['submitter_email'],
    };

    this.documentDetailModal.initialize(this.currentProject, submission, selectedRowKeys[0], false);
  } else {
    this.apiService.getDocumentDetails(docId,  this.dataStore.currentCustomer ? (this.dataStore.currentCustomer['customer_timezone'] || 'eastern') : 'eastern')
      .then((res) => {
        this.documentDetailModal.initialize(this.currentProject, {}, res, false);
        return;
      })
      .catch((error) => {
        this.notificationService.error('Error', 'Failed to show the document details modal!', { timeOut: 3000, showProgressBar: false });
        return;
      });
  }
}

onDownloadDocument() {
  
  const { selectedRowKeys } = this.fileGrid;
  if(selectedRowKeys === null) return;

  if (selectedRowKeys.length === 0) {
    this.notificationService.error('No Selection', 'Please select one document!', { timeOut: 3000, showProgressBar: false });
    return;
  } else if (selectedRowKeys.length > 1) {
    this.notificationService.error('Multiple Selection', 'Please select a single document.', { timeOut: 3000, showProgressBar: false });
    return;
  }

  
  this.projectApiService.getDocument(selectedRowKeys[0]['doc_id'])
    .then((doc: any) => {
      const ext = doc['file_key'].substr(doc['file_key'].lastIndexOf('.') + 1);
      return this.amazonService.getPresignedUrlWithOriginalFileName(doc['bucket_name'], doc['file_key'], `${doc['doc_name']}.${ext}`);
    })
    .then((url: string) => {
      window.open(url, '_blank');
    })
    .catch(err => {
      this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
    });
}

onDownloadFolder() {
  if (!this.activeFolderNode) {
    return this.notificationService.error('No Selection', 'Please a folder', { timeOut: 3000, showProgressBar: false });
  }

  this.projectApiService.getPublishedFolderLink(this.currentProject['project_id'], this.activeFolderNode.data.id)
    .then((url: string) => {
      const downloadUrl = url.replace('dl=0', 'dl=1');
      window.open(downloadUrl, '_blank');
    })
    .catch(err => {
      this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
    });
}

onDownloadProject() {
  this.projectApiService.getPublishedLink(this.currentProject['project_id'])
    .then((url: string) => {
      const downloadUrl = url.replace('dl=0', 'dl=1');
      window.open(downloadUrl, '_blank');
    })
    .catch(err => {
      this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
    });
}

onToggleFavorite() {
  const { selectedRowKeys } = this.fileGrid;
  if(selectedRowKeys === null) return;

  if (selectedRowKeys.length === 0) {
    this.notificationService.error('No Selection', 'Please select one document!', { timeOut: 3000, showProgressBar: false });
    return;
  } else if (selectedRowKeys.length > 1) {
    this.notificationService.error('Multiple Selection', 'Please select a single document.', { timeOut: 3000, showProgressBar: false });
    return;
  }

  const docId = selectedRowKeys[0]['doc_id'];

  if (this.isFavoriteDocument) {
    const favoriteIndex = this.favorites.findIndex(favorite => favorite['favorite_id'] === docId);
    const favorite = this.favorites[favoriteIndex];

    this.apiService.removeUserFavorite(favorite['user_favorite_id'])
      .then(_ => {
        this.favorites.splice(favoriteIndex, 1);
        this.notificationService.success('Success', 'Removed from favorites', { timeOut: 3000, showProgressBar: false });
      })
      .catch(err => {
        this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
      });
  } else {
    this.apiService.createUserFavorite({
      favorite_id: docId,
      favorite_type: 'document',
      user_id: this.dataStore.currentUser['user_id'],
      project_id: this.currentProject['project_id'],
    }).then((user_favorite_id: string) => {
      if (this.favorites.length > 0) {
        this.favorites.push({
          favorite_id: docId,
          favorite_type: 'document',
          user_id: this.dataStore.currentUser['user_id'],
          project_id: this.currentProject['project_id'],
          user_favorite_id,
        });
      }
      this.notificationService.success('Success', 'Added to favorites', { timeOut: 3000, showProgressBar: false });
    }).catch(err => {
      this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
    });
  }
}

onEditDocument(docId: string) {
  if (docId == null) {
    const { selectedRowKeys } = this.fileGrid;
    if(selectedRowKeys === null) return;

    if (selectedRowKeys.length === 1) {
      this.editDocumentModal.initialize(this, selectedRowKeys[0]['doc_id']);
    } else {
      this.notificationService.error('No Selection', 'Please select one document!', { timeOut: 3000, showProgressBar: false });
    }
  } else {
    this.editDocumentModal.initialize(this, docId);
  }

  return false;
}

onAddDocsToProjectEvent() {
  this.addSubmissionModal.initialize(this, this.dataStore.currentProject); 
}

onRemoveDocument() { }

onExport() {
  if (this.fileGrid && this.fileGrid.instance) {
    this.fileGrid.instance.exportToExcel(false);
  }
}

onViewTransactionLogs() {
  
  const { selectedRowKeys } = this.fileGrid;
  if(selectedRowKeys === null) return;

  if (selectedRowKeys.length === 0) {
    this.notificationService.error('No Selection', 'Please select one document!', { timeOut: 3000, showProgressBar: false });
    return;
  } else if (selectedRowKeys.length > 1) {
    this.notificationService.error('Multiple Selection', 'Please select a single document.', { timeOut: 3000, showProgressBar: false });
    return;
  }
  this.transactionLogsModal.initialize(this.currentProject, { submission_id: selectedRowKeys[0]['submission_id'] }, selectedRowKeys[0]);
}

onHelp() { }


onRefresh() {
  this.loadFiles();
}

addFileGridMenuItems(e) {
  if (!e.row) { return; }
 
  if (e.row && e.row.rowType === 'data') {   // e.items can be undefined
    if (!e.items) { e.items = []; }

    e.items.push(
      {
        type: 'normal',
        text: 'View Document',
        onItemClick: () => this.onViewDocument()
      },
      {
        type: 'normal',
        text: 'View Document Details',
        onItemClick: () => this.onViewDocumentDetails()
      },
      {
        type: 'normal',
        visible: !this.dataStore.isSharedProject,
        text: 'Add Documents to Project',
        onItemClick: () => this.onAddDocsToProjectEvent()
      },
      {
        type: 'normal',
        text: 'Edit Document',
        visible: !this.dataStore.isSharedProject,
        onItemClick: () => this.onEditDocument(null)
      },
      {
        type: 'normal',
        text: this.isFavoriteDocument ? 'Remove From' : 'Add To' + ' Favorite' ,
        onItemClick: () => this.onToggleFavorite()
      },
      {
        type: 'normal',
        text: 'Remove Document',
        visible: !this.dataStore.isSharedProject,
        onItemClick: () => this.onRemoveDocument()
      },   
      
      {
        type: 'normal',
        text: 'Download File',
        onItemClick: () => this.onDownloadDocument()
      },
      {
        type: 'normal',
        text: 'Download Folder',
        onItemClick: () => this.onDownloadFolder()
      },
      {
        type: 'normal',
        text: 'Download Project',
        onItemClick: () => this.onDownloadProject()
      },
      {
        type: 'normal',
        text: 'Export File List To CSV',
        onItemClick: () => this.onExport()
      },
      {
        type: 'normal',
        text: 'View Transaction Log',
        onItemClick: () => this.onViewTransactionLogs()
      },
      {
        type: 'normal',
        text: 'Help',
        onItemClick: () => this.onHelp()
      },
      
    );
  }
  return e;
}
}
