import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { AmazonService } from 'app/providers/amazon.service';
import { NotificationsService } from 'angular2-notifications';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'remove-submission-modal',
  templateUrl: './remove-submission-modal.component.html',
  styleUrls: ['./remove-submission-modal.component.scss']
})
export class RemoveSubmissionModalComponent implements OnInit {

  @ViewChild('removeSubmissionModal', { static: true }) removeSubmissionModal: ElementRef;

  selectedSubmission = null;
  modalTitle = '';

  constructor(
    private amazonService: AmazonService,
    private notificationService: NotificationsService,
    private spinner: NgxSpinnerService
  ) { }

  ngOnInit() {
  }

  initialize(selectedSubmission: any) {
    this.selectedSubmission = selectedSubmission;
    this.modalTitle = `Are you sure you want to delete submission <${selectedSubmission.submission_name || selectedSubmission.submission_id}>?`;
    this.removeSubmissionModal.nativeElement.style.display = 'block';
  }

  onCancel() {
    this.removeSubmissionModal.nativeElement.style.display = 'none';
  }

  onYes() {
    this.spinner.show();
    this.amazonService.deleteSubmission(this.selectedSubmission['submission_id'])
      .then(res => {
        this.removeSubmissionModal.nativeElement.style.display = 'none';
        this.spinner.hide();
        this.notificationService.success('Delete Submission', 'Initiated submission delete ...', { timeOut: 3000, showProgressBar: false });
      })
      .catch(err => {
        this.removeSubmissionModal.nativeElement.style.display = 'none';
        this.spinner.hide();
        this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
      });
  }
}
