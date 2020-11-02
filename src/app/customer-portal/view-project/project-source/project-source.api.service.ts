import { Injectable } from '@angular/core';
import axios from 'axios';
import * as queryString from 'query-string';
const moment = require('moment-timezone');

@Injectable()
export class ProjectSourceApi {
  createProjectSource(
    userId: string,
    customerId: string,
    primaryProjectId: string,
    secondaryProjectId: string,
    projectSourceStatus: string
  ) {
    const params = {
      user_id: userId,
      customer_id: customerId,
      primary_project_id: primaryProjectId,
      secondary_project_id: secondaryProjectId,
      project_source_status: projectSourceStatus
    };

    return new Promise((resolve, reject) => {
      axios.post(`${window['env'].apiBaseUrl}/CreateProjectSource`, queryString.stringify(params))
        .then((res) => {
          return resolve(res);
        })
        .catch((error) => {
          return reject(error);
        });
    });
  }
  public findDataViews(viewType: string, customerId: string = null) {
    return new Promise((resolve, reject) => {
      axios.get(`${window['env'].apiBaseUrl}/FindDataViews?view_type=${viewType}${customerId == null ? '' : '&customer_id=' + customerId}`)
        .then((res) => {
          return resolve(res.data);
        })
        .catch((error) => {
          return reject(error);
        });
    });
  }

  findProjectSources(projectId: string, timezone: string) {
    return new Promise((resolve, reject) => {
      axios.get(`${window['env'].apiBaseUrl}/FindProjectSources?project_id=${projectId}`)
        .then((res) => {
          res.data = res.data.map((source) => {
            source['project_bid_datetime'] = this.convertToTimeZoneString(source['project_bid_datetime'], timezone);
            return source;
          });
          const sources = res.data.sort((first, second) => first.project_name < second.project_name ? -1 : 1);
          return resolve(sources);
        })
        .catch((error) => {
          return reject(error);
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
  findOtherProjects(customerId: string) {
    return new Promise((resolve, reject) => {
      axios.get(`${window['env'].apiBaseUrl}/FindProjects?customer_id=${customerId}`)
        .then((res) => {
          return resolve(res.data);
        })
        .catch((error) => {
          return reject(error);
        })
    })
  }

  public updateProjectSource(projectSourceId, projectSourceStatus) {
    return new Promise((resolve, reject) => {
      axios.post(`${window['env'].apiBaseUrl}/UpdateProjectSource`, queryString.stringify({
        project_source_id: projectSourceId,
        project_source_status: projectSourceStatus
      })).then((res) => {
        return resolve(res);
      }).catch((error) => {
        return reject(error);
      })
    });
  }
}
