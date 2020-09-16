import { Component, OnInit, Input, SimpleChanges } from '@angular/core';
import { NotificationsService } from 'angular2-notifications';
import { AmazonService } from '../../providers/amazon.service';

@Component({
  selector: 'app-record-logs',
  templateUrl: './record-logs.component.html',
  styleUrls: [
    './record-logs.component.scss'
  ]
})
export class RecordLogsComponent implements OnInit {
  @Input() routine = '';
  @Input() projectId = '';
  @Input() projectName = '';
  @Input() submissionId = '';
  @Input() fileId = '';
  @Input() primaryKey = '';

  log = '';
  logIndicatorVisible = false;

  constructor(
    private notificationService: NotificationsService,
    private amazonService: AmazonService,
  ) {
  }

  ngOnInit(): void {
  }

  async ngOnChanges(changes: SimpleChanges) {
    if (!changes.routine) {
      return;
    }

    this.logIndicatorVisible = true;

    try {
      if (this.projectName && this.projectId && this.submissionId && this.fileId && this.routine) {
        this.log = await this.amazonService.getLog(`${this.projectName}-${this.projectId}/sub-${this.submissionId}/file-${this.fileId}/${this.routine}`);
      } else {
        this.log = await this.amazonService.getLog(`${this.routine}/${this.primaryKey}`);
      }
    } catch (error) {
      this.notificationService.error('Error', `Failed to get the record log - ${error}`, { timeOut: 3000, showProgressBar: false });
      this.log = 'The log for this record is not existed.';
    }

    this.logIndicatorVisible = false;
  }
}
