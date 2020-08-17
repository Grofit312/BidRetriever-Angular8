import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { AmazonService } from 'app/providers/amazon.service';
import { ActivatedRoute } from '@angular/router';
import { TextDecoder } from 'text-encoding-shim';

import { NotificationsService } from 'angular2-notifications';
const simpleParser = require('mailparser').simpleParser;

@Component({
  selector: 'app-email-viewer',
  templateUrl: './email-viewer.component.html',
  styleUrls: ['./email-viewer.component.scss']
})
export class EmailViewerComponent implements OnInit {

  @ViewChild('emailContent', {static:false}) emailContent: ElementRef;

  constructor(
    private activatedRoute: ActivatedRoute,
    private amazonService: AmazonService,
    private notificationService: NotificationsService,
  ) { }

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe(params => {
      const { bucket_name, file_key } = params;
      this.amazonService.downloadFile(bucket_name, file_key)
        .then((data: Uint8Array) => {
          const emailString = new TextDecoder('utf-8').decode(data);
          simpleParser(emailString, (err, parsed) => {
            if (err) {
              console.log(err);
            }
            if (typeof parsed.html === 'boolean') {
              this.emailContent.nativeElement.innerHTML = parsed.textAsHtml;
            } else {
              let stringifiedHTML = parsed.html.toString();
              stringifiedHTML = stringifiedHTML.replace(new RegExp('<a', 'g'), '<a target="_blank" ');
              this.emailContent.nativeElement.innerHTML = stringifiedHTML;
            }
          });
        })
        .catch(err => {
          console.log(err);
          this.notificationService.error('Error', 'Failed to download email content', { timeOut: 3000, showProgressBar: false });
        });
    });
  }
}
