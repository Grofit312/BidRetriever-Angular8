import {
  Injectable
} from '@angular/core';
import axios from 'axios';
import * as queryString from 'query-string';
const moment = require('moment-timezone');

@Injectable()
export class ContactApi {

  public createContact(params: any) {
    
    return new Promise((resolve, reject) => {
      axios.post(window['env'].apiBaseUrl + '/CreateContact', queryString.stringify(params), {
        validateStatus: (status) => {
          return status === 200 || status === 400
        }
      })
        .then(res => {
          if (res.status === 200) {
            resolve(res);
          } else {
            reject(res.data);
          }
        })
        .catch(err => {
          console.log(err);
          reject(err);
        });
    });
  }
  public findCompanyContact(customer_id: any, company_id: any, timezone: string) {
    
    return new Promise((resolve, reject) => {
      axios.get(`${window['env'].apiBaseUrl}/FindContacts?customer_id=${customer_id}&company_id=${company_id}&detail_level=all`, {
        validateStatus: (status) => {
          return status === 200 || status === 400
        }
      })
        .then(res => {
          
          if (res.status === 200) {
            res.data = res.data.map((contacts) => {
              contacts['create_datetime'] = this.convertToTimeZoneString(contacts['create_datetime'], timezone);
              contacts['edit_datetime'] = this.convertToTimeZoneString(contacts['edit_datetime'], timezone);
              contacts['contact_verification_datetime'] = this.convertToTimeZoneString(contacts['contact_verification_datetime'], timezone);

              return contacts;
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
  public convertToTimeZoneString(timestamp: string, timezone: string, withSeconds: boolean = false) {
    const datetime = moment(timestamp);
    let timeZonedDateTime = null;

    switch(timezone) {
      case 'eastern':
        timeZonedDateTime = datetime.tz('America/New_York');
        break;

      case 'central':
        timeZonedDateTime = datetime.tz('America/Chicago');
        break;

      case 'mountain':
        timeZonedDateTime = datetime.tz('America/Denver');
        break;

      case 'pacific':
        timeZonedDateTime = datetime.tz('America/Los_Angeles');
        break;

      case 'Non US Timezone': case 'utc': default:
        timeZonedDateTime = datetime.utc();
    }

    const result = withSeconds ? timeZonedDateTime.format('YYYY-MM-DD HH:mm:ss z') : timeZonedDateTime.format('YYYY-MM-DD HH:mm z');

    return result === 'Invalid date' ? '' : result;
  }
}
