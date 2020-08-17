import {
  Injectable
} from '@angular/core';
import axios from 'axios';
import * as queryString from 'query-string';
import { AmazonService } from 'app/providers/amazon.service';
const moment = require('moment-timezone');

@Injectable()
export class SubmissionsApi {

  constructor (
    private amazonService: AmazonService,
  ) {}

  public getSubmissions(params: any, timezone: string) {
    return new Promise((resolve, reject) => {
      let result = [];

      axios.get(`${window['env'].apiBaseUrl}/FindProjectSubmissions?${queryString.stringify(params)}`, {
        validateStatus: (status) => {
          return status === 200 || status === 400;
        }
      })
        .then(res => {
          if (res.status === 200) {
            result = res.data;
            result = result.map((submission) => {
              submission['submission_date'] = this.convertToTimeZoneString(submission['received_datetime'], timezone);

              if (submission['submission_process_status'].toLowerCase() === 'completed') {
                const passedMinutes = moment(submission['edit_datetime']).diff(moment(submission['received_datetime']), 'minutes');
                submission['total_processing_time'] = this.getFormattedDuration(passedMinutes);
              } else {
                const passedMinutes = moment().diff(moment(submission['received_datetime']), 'minutes');
                submission['total_processing_time'] = this.getFormattedDuration(passedMinutes);
              }
              return submission;
            });

            resolve(result);
          } else {
            reject(res.status);
          }
        })
        .catch(err => {
          console.log(err);
          reject(err);
        });
    });
  }

  private getFormattedDuration(minutes: number) {
    const day = Math.floor(minutes / 1440);
    const hour = Math.floor((minutes % 1440) / 60);
    const minute = minutes % 60;

    return `${day > 0 ? `${day}d ` : ''}${hour > 0 ? `${hour}hr ` : ''}${minute > 0 ? `${minute}min` : ''}`;
  }

  private convertToTimeZoneString(timestamp: string, timezone: string) {
    const datetime = moment(timestamp);
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

    const result = timezonedDateTime.format('YYYY-MM-DD HH:mm z');

    return result === 'Invalid date' ? '' : result;
  }
}
