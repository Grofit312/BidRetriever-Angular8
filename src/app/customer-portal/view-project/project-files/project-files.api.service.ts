import {
  Injectable
} from '@angular/core';
import axios from 'axios';
import * as queryString from 'query-string';
const moment = require('moment-timezone');

@Injectable()
export class ProjectFilesApi {
  /**
   * Get project root folders
   * @param project_id
   */
  public getFolderChildren(project_id: string, folder_type: string, folder_id: string, timezone: string = 'eastern') {
    return new Promise((resolve, reject) => {
      axios.get(`${window['env'].apiBaseUrl}/GetFolderChildrenDL?project_id=${project_id}&folder_type=${folder_type}&folder_id=${folder_id}`)
      .then(res => {
        res.data = res.data.map(child => {
          if (child.child_type === 'file') {
            child['create_datetime'] = this.convertToTimeZoneString(child['create_datetime'], timezone);
            child['submission_datetime'] = this.convertToTimeZoneString(child['submission_datetime'], timezone);
          }
          return child;
        });
        res.data = res.data.sort((first, second) => {
          if (first.child_type === second.child_type) {
            return (first.child_type === 'folder') ? first.folder_name.localeCompare(second.folder_name) : first.doc_name.localeCompare(second.doc_name);
          } else {
            if (second.child_type === 'folder') {
              return -1;
            } else {
              return 0;
            }
          }
        });
        resolve(res.data);
      })
      .catch(err => {
        console.log(err);
        reject(err);
      });
    });
  }

  public getSubmissionFolders(project_id: string, submission_id: string) {
    return new Promise((resolve, reject) => {
      axios.get(`${window['env'].apiBaseUrl}/GetFolderChildrenDL?project_id=${project_id}&submission_id=${submission_id}`)
        .then(res => {
          resolve(res.data);
        })
        .catch(err => {
          console.log(err);
          reject(err);
        });
    });
  }

  public updateFolder(params: any) {
    return new Promise((resolve, reject) => {
      axios.post(window['env'].apiBaseUrl + '/UpdateFolder', queryString.stringify(params))
        .then(res => {
          resolve();
        })
        .catch(err => {
          console.log(err);
          reject(err);
        });
    });
  }

  public getDocumentDetails(doc_id: string, timezone: string) {
    return new Promise((resolve, reject) => {
      axios.get(`${window['env'].apiBaseUrl}/GetDocumentDetails?doc_id=${doc_id}`)
        .then(res => {
          res.data = res.data.map((item) => {
            item['create_datetime'] = this.convertToTimeZoneString(item['create_datetime'], timezone);
            item['edit_datetime'] = this.convertToTimeZoneString(item['edit_datetime'], timezone);
            item['file_original_create_datetime'] = this.convertToTimeZoneString(item['file_original_create_datetime'], timezone);
            item['file_original_modified_datetime'] = this.convertToTimeZoneString(item['file_original_modified_datetime'], timezone);
            item['submission_datetime'] = this.convertToTimeZoneString(item['submission_datetime'], timezone);
            return item;
          });
          resolve(res.data);
        })
        .catch(err => {
          console.log(err);
          reject(err);
        });
    });
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
  public findUserFavorites(user_id: string, project_id: string, favorite_type: string) {
    return new Promise((resolve, reject) => {
      axios.get(`${window['env'].apiBaseUrl}/FindUserFavorites?user_id=${user_id}&project_id=${project_id}&favorite_type=${favorite_type}`)
        .then(res => {
          resolve(res.data);
        })
        .catch(err => {
          console.log(err);
          reject(err);
        });
    });
  }

  public createUserFavorite(params: any) {
    return new Promise((resolve, reject) => {
      axios.post(`${window['env'].apiBaseUrl}/CreateUserFavorite`, queryString.stringify(params))
        .then(res => {
          resolve(res.data['user_favorite_id']);
        })
        .catch(err => {
          console.log(err);
          reject(err);
        });
    });
  }

  public removeUserFavorite(user_favorite_id: string) {
    return new Promise((resolve, reject) => {
      const params = {
        user_favorite_id,
      };

      axios.post(`${window['env'].apiBaseUrl}/RemoveUserFavorite`, queryString.stringify(params))
        .then(res => {
          resolve();
        })
        .catch(err => {
          console.log(err);
          reject(err);
        });
    });
  }

  public convertToTimeZoneString(timestamp: string, timezone: string, withSeconds: boolean = false) {
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

    const result = withSeconds ? timezonedDateTime.format('YYYY-MM-DD HH:mm:ss z') : timezonedDateTime.format('YYYY-MM-DD HH:mm z');

    return result === 'Invalid date' ? '' : result;
  }
}
