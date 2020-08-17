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
