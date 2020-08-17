import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ProjectsApi } from 'app/customer-portal/my-projects/my-projects.api.service';
import { NotificationsService } from 'angular2-notifications';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'edit-document-modal',
  templateUrl: './edit-document-modal.component.html',
  styleUrls: ['./edit-document-modal.component.scss']
})
export class EditDocumentModalComponent implements OnInit {
  @ViewChild('editDocumentModal', { static: true }) editDocumentModal: ElementRef;
  parent = null;

  currentDocId = '';
  currentDocument:any = {};
  originDocument:any = {};
  viewMode = 'basic';
  disciplines = [];

  get isPlan() { return this.currentDocument['doc_type'] && this.currentDocument['doc_type'].includes('single_sheet_plan'); }

  constructor(
    private projectApi: ProjectsApi,
    private notificationService: NotificationsService,
    private spinner: NgxSpinnerService,
  ) { }

  ngOnInit() {
  }

  initialize(parent: any, docId: string) {
    this.parent = parent;
    this.currentDocId = docId;
    this.editDocumentModal.nativeElement.style.display = 'block';

    this.loadDocument();
  }

  onClickTab(_: any, index: number) {
    if (index === 1) {
      this.viewMode = 'basic';
    } else if (index === 2) {
      this.viewMode = 'revisions';
    } else {
      this.viewMode = 'basic';
    }
  }

  onSaveDocument() {
    this.save();
  }

  onCancel(event) {
    event.preventDefault();
    this.reset();
    this.editDocumentModal.nativeElement.style.display = 'none';
  }

  loadDocument() {
    this.projectApi.getDocument(this.currentDocId)
      .then(res => {
        this.currentDocument = res;
        this.originDocument = JSON.parse(JSON.stringify(res));

        return this.projectApi.findDisciplines();
      })
      .then((disciplines: any[]) => {
        this.disciplines = disciplines;
        this.disciplines.sort((prev, next) => prev.discipline_name > next.discipline_name ? 1 : -1);
      })
      .catch(err => {
        this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
      });
  }

  save() {
    const params = {
      search_project_document_id: this.currentDocId,
    };

    if (this.currentDocument['doc_number'] !== this.originDocument['doc_number']) {
      params['doc_number'] = this.currentDocument['doc_number'];
    }
    if (this.currentDocument['doc_name'] !== this.originDocument['doc_name']) {
      params['doc_name'] = this.currentDocument['doc_name'];
    }
    if (this.currentDocument['status'] !== this.originDocument['status']) {
      params['status'] = this.currentDocument['status'];
    }
    if (this.currentDocument['doc_desc'] !== this.originDocument['doc_desc']) {
      params['doc_desc'] = this.currentDocument['doc_desc'];
    }
    if (this.currentDocument['doc_discipline'] !== this.originDocument['doc_discipline']) {
      params['doc_discipline'] = this.currentDocument['doc_discipline'];
    }
    if (this.currentDocument['display_name'] !== this.originDocument['display_name']) {
      params['display_name'] = this.currentDocument['display_name'];
    }
    if (this.currentDocument['doc_name_abbrv'] !== this.originDocument['doc_name_abbrv']) {
      params['doc_name_abbrv'] = this.currentDocument['doc_name_abbrv'];
    }

    this.spinner.show();

    this.projectApi.updateDocumentKeyAttributes(params)
      .then(res => {
        this.spinner.hide();
        this.reset();
        this.editDocumentModal.nativeElement.style.display = 'none';

        if (this.parent) {
          this.parent.onRefresh();
        }

        if (params['doc_number'] || params['doc_name']) {
          this.notificationService.info('Success', 'Updating Document ...', { timeOut: 3000, showProgressBar: false });
        } else {
          this.notificationService.success('Success', 'Updated Document', { timeOut: 3000, showProgressBar: false });
        }
      })
      .catch(err => {
        this.spinner.hide();
        this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
      });
  }

  reset() {
    this.currentDocument = {};
    this.originDocument = {};
    this.viewMode = 'basic';
  }
}
