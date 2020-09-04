import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AmazonService } from 'app/providers/amazon.service';
import { ProjectsApi } from '../my-projects/my-projects.api.service';
import { NotificationsService } from 'angular2-notifications';
import { ProjectFilesApi } from '../view-project/project-files/project-files.api.service';
import templates from './doc-viewer.templates';
import { ViewProjectApi } from '../view-project/view-project.api.service';
import { DocViewerApi } from './doc-viewer.api.service';
import { DataStore } from 'app/providers/datastore';
import { Logger } from 'app/providers/logger.service';
const moment = require('moment-timezone');
declare var jQuery: any;

const NavigationMode = {
  folder: 0,
  favorites: 1,
  currentPlans: 2,
  currentSpecs: 3,
  sourceDocuments: 4,
  comparisons: 5,
};


@Component({
  selector: 'app-doc-viewer',
  templateUrl: './doc-viewer.component.html',
  styleUrls: ['./doc-viewer.component.scss'],
  providers: [ProjectsApi, ProjectFilesApi, ViewProjectApi, DocViewerApi]
})
export class DocViewerComponent implements OnInit {
  @ViewChild('documentDetails', {static:false}) documentDetails: ElementRef;
  @ViewChild('favoritesListContainer', {static:false}) favoritesListContainer: ElementRef;
  @ViewChild('currentPlansContainer', {static:false}) currentPlansContainer: ElementRef;
  @ViewChild('comparisonListContainer', {static:false}) comparisonListContainer: ElementRef;
  @ViewChild('currentSpecsContainer', {static:false}) currentSpecsContainer: ElementRef;
  @ViewChild('sourceDocumentsContainer', {static:false}) sourceDocumentsContainer: ElementRef;
  @ViewChild('docFilterContainer', {static:false}) docFilterContainer: ElementRef;
  @ViewChild('editProjectModal', {static:false}) editProjectModal;
  @ViewChild('documentDetailModal', {static:false}) documentDetailModal;
  @ViewChild('editDocumentModal', {static:false}) editDocumentModal;

  pdfViewer = null;
  firstRender = true;

  currentProject = null;
  currentDocument = null;
  currentRevision = null;
  currentComparison = null;
  currentNavigationMode = NavigationMode.folder;

  folderFiles = [];
  favorites = [];
  currentPlans = [];
  currentSpecs = [];
  comparisonPlans = [];
  sourceDocuments = [];

  filter = '';

  get filteredCurrentPlans() {
    return this.currentPlans.filter((currentPlan: any) =>
    this.filter.length <= 1
    ?
    currentPlan.display_name.startsWith(this.filter.toUpperCase())
    :
    currentPlan.display_name.includes(this.filter.toUpperCase())
    );
  }

  get filteredComparisonPlans() {
    return this.comparisonPlans.filter((comparisonPlan: any) =>
    this.filter.length <= 1
    ?
    comparisonPlan.display_name.startsWith(this.filter.toUpperCase())
    :
    comparisonPlan.display_name.includes(this.filter.toUpperCase())
    );
  }

  get filteredCurrentSpecs() {
    return this.currentSpecs.filter((currentSpec: any) =>
    this.filter.length <= 1
    ?
    currentSpec.doc_name.toUpperCase().startsWith(this.filter.toUpperCase())
    :
    currentSpec.doc_name.toUpperCase().includes(this.filter.toUpperCase())
    );
  }

  get filteredSourceDocuments() {
    return this.sourceDocuments.filter((sourceDocument: any) =>
    this.filter.length <= 1
    ?
    sourceDocument.doc_name.toUpperCase().startsWith(this.filter.toUpperCase())
    :
    sourceDocument.doc_name.toUpperCase().includes(this.filter.toUpperCase())
    );
  }

  constructor(
    private amazonService: AmazonService,
    private viewProjectApi: ViewProjectApi,
    private projectsApi: ProjectsApi,
    private activatedRoute: ActivatedRoute,
    private docViewerApi: DocViewerApi,
    private projectFilesApi: ProjectFilesApi,
    private notificationService: NotificationsService,
    private logger: Logger,
    public dataStore: DataStore
  ) { }

  ngOnInit() {
    this.initializePDFViewer();

    Promise.prototype['finally'] = function finallyConstructor(callback) {
      return this.then(
        function(value) {
          // @ts-ignore
          return Promise.resolve(callback()).then(function() {
            return value;
          });
        },
        function(reason) {
          // @ts-ignore
          return Promise.resolve(callback()).then(function() {
            // @ts-ignore
            return Promise.reject(reason);
          });
        }
      );
    };
  }

  initializePDFViewer() {
    window['pdfui'] = new window['UIExtension'].PDFUI({
      viewerOptions: {
        libPath: `../../../../../../pdf-sdk/lib`,
        jr: {
          licenseSN: window['env']['pdfLicenseSN'],
          licenseKey: window['env']['pdfLicenseKey'],
        },
      },
      renderTo: '#docViewer',
      template: templates.default,
      addons: [
        '../../../../../../pdf-sdk/lib/uix-addons/print/',
        '../../../../../../pdf-sdk/lib/uix-addons/text-object',
      ]
    });

    window['pdfui'].getPDFViewer().then(pdfViewer => {
      document.getElementById('prevDoc')['onclick'] = this.onPreviousDocument;
      document.getElementById('nextDoc')['onclick'] = this.onNextDocument;
      document.getElementById('zoomExtent')['onclick'] = this.onZoomExtent;
      document.getElementById('addFavorite')['onclick'] = document.getElementById('removeFavorite')['onclick'] = this.onToggleFavorite;
      document.getElementById('documentDetail').childNodes[1].appendChild(this.documentDetails.nativeElement);
      document.getElementById('favoriteList').childNodes[1].appendChild(this.favoritesListContainer.nativeElement);
      document.getElementById('currentPlanList').childNodes[1].appendChild(this.currentPlansContainer.nativeElement);
      document.getElementById('comparisonList').childNodes[1].appendChild(this.comparisonListContainer.nativeElement);
      document.getElementById('currentSpecsList').childNodes[1].appendChild(this.currentSpecsContainer.nativeElement);
      document.getElementById('sourceList').childNodes[1].appendChild(this.sourceDocumentsContainer.nativeElement);
      document.getElementById('docFilter').appendChild(this.docFilterContainer.nativeElement);
      document.getElementById('btn_view_project')['onclick'] = this.onViewProject;
      document.getElementById('btn_edit_project')['onclick'] = this.onEditProject;
      document.getElementById('btn_view_details')['onclick'] = this.onViewDocumentDetails;
      document.getElementById('btn_edit_file')['onclick'] = this.onEditFile;
      document.getElementById('btn_print_file')['onclick'] = this.onPrintFile;
      document.getElementById('btn_download_file')['onclick'] = this.onDownloadFile;
      document.getElementById('btn_download_folder')['onclick'] = this.onDownloadFolder;
      document.getElementById('btn_download_project')['onclick'] = this.onDownloadProject;
      document.getElementById('btn_help')['onclick'] = this.onHelp;

      const paneHeight = localStorage.getItem('horizontal-split-pane') || '0.8';
      jQuery('.upper-component').height(`${parseFloat(paneHeight) * 100}%`);

      if (this.activatedRoute.snapshot.params['doc_id'] === 'unknown') {
        jQuery('.fv__ui-sidebar-nav-ctrl')[2].click();
      }

      pdfViewer.eventEmitter.on(window['UIExtension']['PDFViewCtrl']['ViewerEvents']['renderPageSuccess'], () => {
        if (this.firstRender) {
          this.firstRender = false;
          setTimeout(this.onZoomExtent);
        }
      });

      if (this.dataStore.currentUser) {
        this.load();
      } else {
        this.dataStore.authenticationState.subscribe(value => {
          if (value) {
            this.load();
          }
        });
      }
    });
  }

  load() {
    this.loadProjectInfo()
    .then(() => {
      return this.loadCurrentFolderData();
    })
    .then(() => {
      return this.loadFavoritesData();
    })
    .then(() => {
      return this.loadCurrentPlansData();
    })
    .then(() => {
      return this.loadCurrentSpecsData();
    })
    .then(() => {
      return this.loadSourceDocuments();
    })
    .then(() => {
      return this.loadComparisonDrawings();
    })
    .then(() => {
      const doc_id = this.activatedRoute.snapshot.params['doc_id'];

      if (doc_id !== 'unknown') {
        return this.docViewerApi.getDocumentDetails(doc_id);
      } else {
        return this.docViewerApi.getDocumentDetails(this.currentPlans[0]['doc_id']);
      }
    })
    .then(res => {
      this.currentDocument = res;

      const comparison = this.activatedRoute.snapshot.params['comparison'];

      if (comparison === 'comparison') {
        this.currentNavigationMode = NavigationMode.comparisons;
        this.currentComparison = this.comparisonPlans.find(comp => comp.doc_revision === this.currentDocument.doc_revision &&
          comp.doc_id === this.currentDocument.doc_id);
      }

      this.loadDocument();
    })
    .catch(err => {
      this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
    });
  }

  loadProjectInfo() {
    return new Promise((resolve, reject) => {
      const { project_id } = this.activatedRoute.snapshot.params;
      this.viewProjectApi.getProject(project_id, 'eastern')
        .then(res => {
          this.dataStore.currentProject = res;
          this.currentProject = res;

          document.getElementById('btn_edit_project').style.display = this.dataStore.isSharedProject ? 'none' : 'block';
          document.getElementById('btn_edit_file').style.display = this.dataStore.isSharedProject ? 'none' : 'block';

          resolve();
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  loadCurrentFolderData() {
    return new Promise((resolve, reject) => {
      const { folder_id } = this.activatedRoute.snapshot.params;

      if (folder_id === 'unknown') {
        return resolve();
      }

      this.projectFilesApi.getFolderChildren('', '', folder_id, 'eastern')
        .then((res: any[]) => {
          this.folderFiles = res.filter(child => child.child_type === 'file');
          resolve();
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  loadFavoritesData() {
    return new Promise((resolve, reject) => {
      const { project_id } = this.activatedRoute.snapshot.params;
      let favoriteList = [];
      this.docViewerApi.findUserFavorites(this.dataStore.currentUser['user_id'], project_id, 'document')
        .then((favorites: any[]) => {
          favoriteList = favorites;
          return Promise.all(favorites.map(favorite => this.docViewerApi.getDocumentDetails(favorite['favorite_id'])));
        })
        .then((documents: any[]) => {
          favoriteList.forEach((favorite, index) => {
            favorite.document = documents[index];
          });
          this.favorites = favoriteList;
          resolve();
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  loadCurrentPlansData() {
    return new Promise((resolve, reject) => {
      const { project_id } = this.activatedRoute.snapshot.params;
      this.docViewerApi.findCurrentPlans(project_id)
        .then((res: any[]) => {
          this.currentPlans = res;
          resolve();
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  loadCurrentSpecsData() {
    return new Promise((resolve, reject) => {
      const { project_id } = this.activatedRoute.snapshot.params;
      this.docViewerApi.findCurrentSpecs(project_id)
        .then((res: any[]) => {
          this.currentSpecs = res;
          resolve();
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  loadSourceDocuments() {
    return new Promise((resolve, reject) => {
      const { project_id } = this.activatedRoute.snapshot.params;
      this.docViewerApi.findSourceDocuments(project_id)
        .then((res: any[]) => {
          this.sourceDocuments = res;
          resolve();
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  loadComparisonDrawings() {
    return new Promise((resolve, reject) => {
      const { project_id } = this.activatedRoute.snapshot.params;
      this.docViewerApi.findComparisonDrawings(project_id)
        .then((res: any[]) => {
          this.comparisonPlans = res;
          resolve();
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  loadDocument() {
    let doc_id = '';
    let file_key = '';

    if (this.currentRevision) {
      doc_id = this.currentRevision['doc_id'];
      file_key = this.currentRevision['file_key'];

      this.renderDocument(this.currentRevision['bucket_name'], this.currentRevision['file_key']);
    } else if (this.currentComparison) {
      doc_id = this.currentComparison['doc_id'];
      file_key = this.currentComparison['file_key'];

      this.renderDocument(this.currentComparison['bucket_name'], this.currentComparison['file_key']);
    } else {
      doc_id = this.currentDocument['doc_id'];
      file_key = this.currentDocument['file_key'];

      const isFavorite = this.favorites.findIndex(favorite => favorite.favorite_id === this.currentDocument['doc_id']) >= 0;
      document.getElementById('addFavorite').style.display = isFavorite ? 'none' : 'block';
      document.getElementById('removeFavorite').style.display = isFavorite ? 'block' : 'none';

      this.renderDocument(this.currentDocument['bucket_name'], this.currentDocument['file_key']);
    }

    this.logger.logActivity({
      activity_level: 'transaction',
      activity_name: 'View Project Document',
      application_name: 'Customer Portal',
      customer_id: this.dataStore.currentUser.customer_id,
      user_id: this.dataStore.currentUser.user_id,
      project_id: this.currentProject.project_id,
      document_id: doc_id,
      file_id: this.getFileIdFromKey(file_key),
    });
  }

  renderDocument = (bucket_name: string, file_key: string) => {
    if (!bucket_name || !file_key) {
      return this.notificationService.error('Error', 'This file does not exist', { timeOut: 3000, showProgressBar: false });
    }

    this.firstRender = true;

    window['pdfui'].getPDFViewer()
      .then(pdfViewer => {
        this.pdfViewer = pdfViewer;
        return this.pdfViewer.close();
      })
      .then(() => {
        return this.amazonService.getPresignedUrl(bucket_name, file_key);
      })
      .then((url: string) => {
        return this.pdfViewer.openPDFByHttpRangeRequest({
          range: {
            url,
            chunkSize: 10 * 1024 * 1024,
          }
        });
      }).catch(err => {
        console.log(err);
        this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
      });
  }

  onPreviousDocument = () => {
    if (!this.pdfViewer) {
      return;
    }

    if (this.currentNavigationMode === NavigationMode.folder) {
      const index = this.folderFiles.findIndex(file => file['doc_id'] === this.currentDocument['doc_id']);

      if (index > 0) {
        this.docViewerApi.getDocumentDetails(this.folderFiles[index - 1]['doc_id'])
        .then(res => {
          this.currentDocument = res;
          this.currentRevision = null;
          this.currentComparison = null;
          this.loadDocument();
        })
        .catch(err => {
          this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
        });
      } else {
        this.notificationService.info('Info', 'This is first document', { timeOut: 3000, showProgressBar: false });
      }
    } else if (this.currentNavigationMode === NavigationMode.favorites) {
      const index = this.favorites.findIndex(favorite => favorite.favorite_id === this.currentDocument['doc_id']);

      if (index > 0) {
        this.currentDocument = this.favorites[index - 1]['document'];
        this.currentRevision = null;
        this.currentComparison = null;
        this.loadDocument();
      } else {
        this.notificationService.info('Info', 'This is first document', { timeOut: 3000, showProgressBar: false });
      }
    } else if (this.currentNavigationMode === NavigationMode.currentPlans) {
      const index = this.currentPlans.findIndex(plan => plan.doc_id === this.currentDocument['doc_id']);

      if (index > 0) {
        this.docViewerApi.getDocumentDetails(this.currentPlans[index - 1]['doc_id'])
        .then(res => {
          this.currentDocument = res;
          this.currentRevision = null;
          this.currentComparison = null;
          this.loadDocument();
        })
        .catch(err => {
          this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
        });
      } else {
        this.notificationService.info('Info', 'This is first document', { timeOut: 3000, showProgressBar: false });
      }
    } else if (this.currentNavigationMode === NavigationMode.currentSpecs) {
      const index = this.currentSpecs.findIndex(plan => plan.doc_id === this.currentDocument['doc_id']);

      if (index > 0) {
        this.docViewerApi.getDocumentDetails(this.currentSpecs[index - 1]['doc_id'])
        .then(res => {
          this.currentDocument = res;
          this.currentRevision = null;
          this.currentComparison = null;
          this.loadDocument();
        })
        .catch(err => {
          this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
        });
      } else {
        this.notificationService.info('Info', 'This is first document', { timeOut: 3000, showProgressBar: false });
      }
    } else if (this.currentNavigationMode === NavigationMode.sourceDocuments) {
      const index = this.sourceDocuments.findIndex(plan => plan.doc_id === this.currentDocument['doc_id']);

      if (index > 0) {
        this.docViewerApi.getDocumentDetails(this.sourceDocuments[index - 1]['doc_id'])
        .then(res => {
          this.currentDocument = res;
          this.currentRevision = null;
          this.currentComparison = null;
          this.loadDocument();
        })
        .catch(err => {
          this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
        });
      } else {
        this.notificationService.info('Info', 'This is first document', { timeOut: 3000, showProgressBar: false });
      }
    } else if (this.currentNavigationMode === NavigationMode.comparisons) {
      const index = this.comparisonPlans.findIndex(plan => plan.file_id === this.currentComparison['file_id']);

      if (index > 0) {
        this.currentComparison = this.comparisonPlans[index - 1];

        this.docViewerApi.getDocumentDetails(this.currentComparison['doc_id'])
        .then(res => {
          this.currentDocument = res;
          this.currentRevision = null;
          this.loadDocument();
        })
        .catch(err => {
          this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
        });
      } else {
        this.notificationService.info('Info', 'This is first document', { timeOut: 3000, showProgressBar: false });
      }
    }
  }

  onNextDocument = () => {
    if (!this.pdfViewer) {
      return;
    }

    if (this.currentNavigationMode === NavigationMode.folder) {
      const index = this.folderFiles.findIndex(file => file['doc_id'] === this.currentDocument['doc_id']);

      if (index < this.folderFiles.length - 1) {
        this.docViewerApi.getDocumentDetails(this.folderFiles[index + 1]['doc_id'])
        .then(res => {
          this.currentDocument = res;
          this.currentRevision = null;
          this.currentComparison = null;
          this.loadDocument();
        })
        .catch(err => {
          this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
        });
      } else {
        this.notificationService.info('Info', 'This is last document', { timeOut: 3000, showProgressBar: false });
      }
    } else if (this.currentNavigationMode === NavigationMode.favorites) {
      const index = this.favorites.findIndex(favorite => favorite.favorite_id === this.currentDocument['doc_id']);

      if (index < this.favorites.length - 1) {
        this.currentDocument = this.favorites[index + 1]['document'];
        this.currentRevision = null;
        this.currentComparison = null;
        this.loadDocument();
      } else {
        this.notificationService.info('Info', 'This is last document', { timeOut: 3000, showProgressBar: false });
      }
    } else if (this.currentNavigationMode === NavigationMode.currentPlans) {
      const index = this.currentPlans.findIndex(plan => plan.doc_id === this.currentDocument['doc_id']);

      if (index < this.currentPlans.length - 1) {
        this.docViewerApi.getDocumentDetails(this.currentPlans[index + 1]['doc_id'])
        .then(res => {
          this.currentDocument = res;
          this.currentRevision = null;
          this.currentComparison = null;
          this.loadDocument();
        })
        .catch(err => {
          this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
        });
      } else {
        this.notificationService.info('Info', 'This is last document', { timeOut: 3000, showProgressBar: false });
      }
    } else if (this.currentNavigationMode === NavigationMode.currentSpecs) {
      const index = this.currentSpecs.findIndex(plan => plan.doc_id === this.currentDocument['doc_id']);

      if (index < this.currentSpecs.length - 1) {
        this.docViewerApi.getDocumentDetails(this.currentSpecs[index + 1]['doc_id'])
        .then(res => {
          this.currentDocument = res;
          this.currentRevision = null;
          this.currentComparison = null;
          this.loadDocument();
        })
        .catch(err => {
          this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
        });
      } else {
        this.notificationService.info('Info', 'This is last document', { timeOut: 3000, showProgressBar: false });
      }
    } else if (this.currentNavigationMode === NavigationMode.sourceDocuments) {
      const index = this.sourceDocuments.findIndex(plan => plan.doc_id === this.currentDocument['doc_id']);

      if (index < this.sourceDocuments.length - 1) {
        this.docViewerApi.getDocumentDetails(this.sourceDocuments[index + 1]['doc_id'])
        .then(res => {
          this.currentDocument = res;
          this.currentRevision = null;
          this.currentComparison = null;
          this.loadDocument();
        })
        .catch(err => {
          this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
        });
      } else {
        this.notificationService.info('Info', 'This is last document', { timeOut: 3000, showProgressBar: false });
      }
    } else if (this.currentNavigationMode === NavigationMode.comparisons) {
      const index = this.comparisonPlans.findIndex(plan => plan.file_id === this.currentComparison['file_id']);

      if (index < this.comparisonPlans.length - 1) {
        this.currentComparison = this.comparisonPlans[index + 1];

        this.docViewerApi.getDocumentDetails(this.currentComparison['doc_id'])
        .then(res => {
          this.currentDocument = res;
          this.currentRevision = null;
          this.loadDocument();
        })
        .catch(err => {
          this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
        });
      } else {
        this.notificationService.info('Info', 'This is last document', { timeOut: 3000, showProgressBar: false });
      }
    }
  }

  onZoomExtent = () => {
    if (!this.pdfViewer) {
      return;
    }

    this.pdfViewer.zoomTo('fitHeight');
  }

  onToggleFavorite = () => {
    const latestRevision = this.currentDocument.revisions[this.currentDocument.revisions.length - 1];
    const favoriteDocumentIndex = this.favorites.findIndex(favorite => favorite.favorite_id === latestRevision['doc_id']);

    if (favoriteDocumentIndex >= 0) {
      const favoriteDocument = this.favorites[favoriteDocumentIndex];

      this.docViewerApi.removeUserFavorite(favoriteDocument.user_favorite_id)
        .then(res => {
          this.favorites.splice(favoriteDocumentIndex, 1);

          document.getElementById('addFavorite').style.display = 'block';
          document.getElementById('removeFavorite').style.display = 'none';

          this.notificationService.success('Success', 'Removed from favorites', { timeOut: 3000, showProgressBar: false });
        })
        .catch(err => {
          this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
        });
    } else {
      const previousFavorites = this.currentDocument.revisions.filter(revision => {
        if (revision.doc_id === latestRevision.doc_id) {
          return false;
        }

        if (this.favorites.findIndex(favorite => favorite.favorite_id === revision.doc_id) === -1) {
          return false;
        }

        return true;
      });

      Promise.all(previousFavorites.map(favorite => this.docViewerApi.removeUserFavorite(favorite.user_favorite_id)))
        .then(res => {
          const params = {
            favorite_id: this.currentDocument['doc_id'],
            favorite_type: 'document',
            user_id: this.dataStore.currentUser['user_id'],
            project_id: this.currentProject['project_id'],
          };
          return this.docViewerApi.createUserFavorite(params);
        })
        .then((user_favorite_id: string) => {
          this.favorites.push({
            favorite_id: this.currentDocument['doc_id'],
            favorite_type: 'document',
            user_id: this.dataStore.currentUser['user_id'],
            project_id: this.currentProject['project_id'],
            document: this.currentDocument,
            user_favorite_id,
          });

          document.getElementById('addFavorite').style.display = 'none';
          document.getElementById('removeFavorite').style.display = 'block';

          this.notificationService.success('Success', 'Added to favorites', { timeOut: 3000, showProgressBar: false });
        }).catch(err => {
          this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
        });
    }
  }

  onClickFavorite = (favorite) => {
    this.currentNavigationMode = NavigationMode.favorites;
    this.currentDocument = favorite['document'];
    this.currentRevision = null;
    this.currentComparison = null;

    this.loadDocument();
  }

  onClickCurrentPlan = (currentPlan) => {
    this.currentNavigationMode = NavigationMode.currentPlans;

    this.docViewerApi.getDocumentDetails(currentPlan['doc_id'])
    .then(res => {
      this.currentDocument = res;
      this.currentRevision = null;
      this.currentComparison = null;
      this.loadDocument();
    })
    .catch(err => {
      this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
    });
  }

  onClickRevision = (revision) => {
    if (this.currentRevision && revision.doc_id === this.currentRevision.doc_id) {
      return;
    }

    this.currentRevision = revision;
    this.currentComparison = null;
    this.loadDocument();
  }

  onClickComparison = (comparison) => {
    if (this.currentComparison && comparison.file_id === this.currentComparison.file_id) {
      return;
    }

    this.currentComparison = comparison;
    this.currentRevision = null;
    this.currentNavigationMode = NavigationMode.comparisons;
    this.loadDocument();
  }

  onClickComparisonPlan = (comparison) => {
    if (this.currentComparison && comparison.file_id === this.currentComparison.file_id) {
      return;
    }

    this.currentComparison = comparison;
    this.currentRevision = null;
    this.currentNavigationMode = NavigationMode.comparisons;

    this.docViewerApi.getDocumentDetails(comparison['doc_id'])
      .then(res => {
        this.currentDocument = res;
        this.loadDocument();
      })
      .catch(err => {
        this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
      });
  }

  onClickCurrentSpecs = (specs) => {
    this.currentNavigationMode = NavigationMode.currentSpecs;

    this.docViewerApi.getDocumentDetails(specs['doc_id'])
    .then(res => {
      this.currentDocument = res;
      this.currentRevision = null;
      this.currentComparison = null;
      this.loadDocument();
    })
    .catch(err => {
      this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
    });
  }

  onClickSourceDocument = (sourceDocument) => {
    this.currentNavigationMode = NavigationMode.sourceDocuments;

    this.docViewerApi.getDocumentDetails(sourceDocument['doc_id'])
    .then(res => {
      this.currentDocument = res;
      this.currentRevision = null;
      this.currentComparison = null;
      this.loadDocument();
    })
    .catch(err => {
      this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
    });
  }

  onFilterChange = (newFilter: string) => {
    this.filter = newFilter;
  }

  onViewProject = () => {
    const projectId = this.activatedRoute.snapshot.params['project_id'];
    window.open(`/#/customer-portal/view-project/${projectId}`, '_blank');
  }

  onEditProject = () => {
    const projectId = this.activatedRoute.snapshot.params['project_id'];
    this.viewProjectApi.getProject(projectId, 'eastern')
      .then(project => {
        this.editProjectModal.initialize(this, project);
      })
      .catch(err => {
        this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
      });
  }

  onViewDocumentDetails = () => {
    this.documentDetailModal.initialize(this.currentProject, {}, this.currentDocument, false);
  }

  onEditFile = () => {
    if (!this.currentDocument) {
      return this.notificationService.error('Error', 'Failed to read current document info', { timeOut: 3000, showProgressBar: false });
    }

    this.editDocumentModal.initialize(this, this.currentDocument['doc_id']);
  }

  onPrintFile = () => {
    document.getElementById('print-button').click();
  }

  onDownloadFile = () => {
    if (!this.currentDocument) {
      return;
    }

    this.projectsApi.getDocument(this.currentDocument['doc_id'])
      .then((doc: any) => {
        return this.amazonService.getPresignedUrl(doc['bucket_name'], doc['file_key']);
      })
      .then((url: string) => {
        window.open(url, '_blank');
      })
      .catch(err => {
        this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
      });
  }

  onDownloadFolder = () => {

  }

  onDownloadProject = () => {

  }

  onHelp = () => {

  }

  onRefresh = () => {

  }

  isCurrentRevision = () => {
    const lastRevision = this.currentDocument.revisions[this.currentDocument.revisions.length - 1];

    if (this.currentRevision) {
      return this.currentRevision['doc_id'] === lastRevision['doc_id'];
    } else {
      return this.currentDocument['doc_id'] === lastRevision['doc_id'];
    }
  }

  formatDateTime = (timestamp) => {
    const datetime = moment(timestamp);
    const timezone = (this.dataStore.currentCustomer ? this.dataStore.currentCustomer['customer_timezone'] : 'eastern') || 'eastern';
    let timezonedDateTime = null;

    switch(timezone) {
        case 'eastern':
        timezonedDateTime = datetime.tz('America/New_York');
        break;

        case 'central':
        timezonedDateTime = datetime.tz('America/Chicago');
        break;

        case 'mountain':
        timezonedDateTime = datetime.tz('America/Denver');
        break;

        case 'pacific':
        timezonedDateTime = datetime.tz('America/Los_Angeles');
        break;

        case 'Non US Timezone': case 'utc': default:
        timezonedDateTime = datetime.utc();
    }

    const result = timezonedDateTime.format('YYYY-MM-DD HH:mm:ss z');
    return result;
  }

  getFileIdFromKey = (file_key) => {
    const nodes = file_key.split('/');

    if (nodes.length >= 2) {
      return nodes[2];
    }

    return '';
  }
}
