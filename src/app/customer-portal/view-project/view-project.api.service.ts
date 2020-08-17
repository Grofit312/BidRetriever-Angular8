import {
  Injectable
} from '@angular/core';
import axios from 'axios';
import * as queryString from 'query-string';
const moment = require('moment-timezone');

@Injectable()
export class ViewProjectApi {
  /**
   * Get project info
   * @param project_id
   */
  public getProject(project_id: string, timezone: string) {
    return new Promise((resolve, reject) => {
      axios.get(`${window['env'].apiBaseUrl}/GetProject?project_id=${project_id}&detail_level=admin`, {
        validateStatus: (status) => {
          return status === 200 || status === 400
        }
      })
      .then(res => {
        if (res.status === 200) {
          res['data']['project_admin_user_id'] = res['data']['user_id'];
          res['data']['create_datetime_origin'] = res['data']['create_datetime'];
          res['data']['edit_datetime_origin'] = res['data']['edit_datetime'];
          res['data']['project_bid_datetime_origin'] = res['data']['project_bid_datetime'];
          res['data']['create_datetime'] = this.convertToTimeZoneObject(res['data']['create_datetime'], timezone).format('MMM D, YYYY');
          res['data']['edit_datetime'] = this.convertToTimeZoneObject(res['data']['edit_datetime'], timezone).format('MMM D, YYYY');
          res['data']['project_bid_datetime'] = this.convertToTimeZoneObject(res['data']['project_bid_datetime'], timezone).format('MMM D, YYYY H:mm z');
          res['data']['project_address'] = `${res['data']['project_address1']} ${res['data']['project_address2']} ${res['data']['project_city']} ${res['data']['project_state']} ${res['data']['project_zip']} ${res['data']['project_country']}`;

          resolve(res.data);
        } else {
          reject(res.data.status);
        }
      })
      .catch(err => {
        console.log(err);
        reject(err);
      });
    });
  }

  /**
   * Get user notifications
   * @param project_id
   */
  public findUserNotifications(project_id: string, timezone: string) {
    return new Promise((resolve, reject) => {
      axios.get(`${window['env'].apiBaseUrl}/FindUserNotifications?project_id=${project_id}`, {
        validateStatus: (status) => {
          return status === 200 || status === 400
        }
      })
      .then(res => {
        if (res.status === 200) {
          res.data = res.data.map(userNotification => {
            userNotification['date_sent'] = this.convertToTimeZoneObject(userNotification['notification_send_datetime'], timezone).format('YYYY-MM-DD');
            userNotification['time_sent'] = this.convertToTimeZoneObject(userNotification['notification_send_datetime'], timezone).format('HH:mm z');

            return userNotification;
          });

          resolve(res.data);
        } else {
          reject(res.data.status);
        }
      })
      .catch(err => {
        console.log(err);
        reject(err);
      });
    });
  }

  /**
   * Get project settings
   * @param project_id
   */
  public getProjectSettings(project_id: string) {
    return new Promise((resolve, reject) => {
      axios.get(`${window['env'].apiBaseUrl}/GetProjectSettings?project_id=${project_id}`, {
        validateStatus: (status) => {
          return status === 200 || status === 400
        }
      })
      .then(res => {
        if (res.status === 200) {
          resolve(res.data);
        } else {
          reject(res.data.status);
        }
      })
      .catch(err => {
        console.log(err);
        reject(err);
      });
    });
  }

  /**
   * Convert to timezone object
   * @param timestamp
   * @param timezone
   */
  public convertToTimeZoneObject(timestamp: string, timezone: string) {
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
    return timezonedDateTime;
  }
}
