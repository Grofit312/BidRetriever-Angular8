import { Injectable } from '@angular/core';
import axios from 'axios';
import * as queryString from 'query-string';

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

  findProjectSources(projectId: string) {
    return new Promise((resolve, reject) => {
      axios.get(`${window['env'].apiBaseUrl}/FindProjectSources?project_id=${projectId}`)
        .then((res) => {
          const sources = res.data.sort((first, second) => first.project_name < second.project_name ? -1 : 1);
           //TODO - TimeZone handling
          return resolve(sources);
        })
        .catch((error) => {
          return reject(error);
        });
    });
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
