import { Component, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'public-share-modal',
  templateUrl: './public-share-modal.component.html',
  styleUrls: ['./public-share-modal.component.scss']
})
export class PublicShareModalComponent {
  @ViewChild('publicShareModal', { static: true }) publicShareModal: ElementRef;

  parent = null;

  initialize(parent: any) {
    this.parent = parent;
    this.publicShareModal.nativeElement.style.display = 'block';
  }

  onYes() {
    this.parent.publicShare();
    this.publicShareModal.nativeElement.style.display = 'none';
  }

  onCancel() {
    this.publicShareModal.nativeElement.style.display = 'none';
  }
}
