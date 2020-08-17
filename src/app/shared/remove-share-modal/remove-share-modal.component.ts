import { Component, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'remove-share-modal',
  templateUrl: './remove-share-modal.component.html',
  styleUrls: ['./remove-share-modal.component.scss']
})
export class RemoveShareModalComponent {
  @ViewChild('removeShareModal', { static: true }) removeShareModal: ElementRef;

  parent = null;
  sharedProjectId = '';

  initialize(parent: any, shared_project_id: string) {
    this.parent = parent;
    this.sharedProjectId = shared_project_id;
    this.removeShareModal.nativeElement.style.display = 'block';
  }

  onYes() {
    this.parent.removeShare(this.sharedProjectId);
    this.removeShareModal.nativeElement.style.display = 'none';
  }

  onCancel() {
    this.removeShareModal.nativeElement.style.display = 'none';
  }
}
