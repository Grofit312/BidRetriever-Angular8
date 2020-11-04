import { Injectable } from "@angular/core";
import axios from "axios";
import * as queryString from "query-string";
const moment = require('moment-timezone');

@Injectable()
export class NotesApi {
  public createNote(params: any) {
    return new Promise((resolve, reject) => {
      axios
        .post(
          window["env"].apiBaseUrl + "/CreateNote",
          queryString.stringify(params),
          {
            validateStatus: (status) => {
              return status === 200 || status === 400;
            },
          }
        )
        .then((res) => {
          if (res.status === 200) {
            resolve(res.data.note_id);
          } else {
            reject(res.data.status);
          }
        })
        .catch((err) => {
          console.log(err);
          reject(err);
        });
    });
  }


  public findNotes(params: any, timezone: string) {
    return new Promise((resolve, reject) => {
      let apiUrl = `${window["env"].apiBaseUrl}/FindNotes?${queryString.stringify(params)}`;
      axios
        .get(apiUrl, {
          validateStatus: (status) => {
            return status === 200 || status === 400;
          },
        })
        .then((res) => {
          if (res.status === 200) {
            res.data = res.data.map((notes) => {
               
              notes['create_datetime'] = this.convertToTimeZoneString(notes['create_datetime'], timezone);
              notes['edit_datetime'] = this.convertToTimeZoneString(notes['edit_datetime'], timezone);
              
              return notes;
            });

            resolve(res.data);
          } else {
            reject(res.data.status);
          }
        })
        .catch((err) => {
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
 

  public updateNote(params: any) {
    return new Promise((resolve, reject) => {
      axios
        .post(
          window["env"].apiBaseUrl + "/UpdateNote",
          queryString.stringify(params),
          {
            validateStatus: (status) => {
              return status === 200 || status === 400;
            },
          }
        )
        .then((res) => {
          if (res.status === 200) {
            resolve(res.data.note_id);
          } else {
            reject(res.data.status);
          }
        })
        .catch((err) => {
          console.log(err);
          reject(err);
        });
    });
  }

  public deleteNote(note_id: string) {
    return new Promise((resolve, reject) => {
      const params = {
        note_id,
      };
      axios
        .post(
          `${window["env"].apiBaseUrl}/RemoveNotes`,
          queryString.stringify(params)
        )
        .then((res) => {
          resolve();
        })
        .catch((err) => {
          console.log(err);
          reject(err);
        });
    });
  }
}
