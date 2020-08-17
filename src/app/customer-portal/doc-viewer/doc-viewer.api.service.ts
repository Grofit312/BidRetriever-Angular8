import {
  Injectable
} from '@angular/core';
import axios from 'axios';
import * as queryString from 'query-string';

@Injectable()
export class DocViewerApi {
  public getDocumentDetails(doc_id: string) {
    return new Promise((resolve, reject) => {
      axios.get(`${window['env'].apiBaseUrl}/GetDocumentDetails?doc_id=${doc_id}`)
        .then(res => {
          resolve(res.data);
        })
        .catch(err => {
          console.log(err);
          reject(err);
        });
    });
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

  public findCurrentPlans(project_id: string) {
    return new Promise((resolve, reject) => {
      axios.get(`${window['env'].apiBaseUrl}/FindProjectDocuments?project_id=${project_id}&doc_type=single_sheet_plan&latest_rev_only=true`)
        .then(res => {
          res.data.sort((prev, next) => {
            return (prev.display_name > next.display_name) ? 1 : -1;
          });
          resolve(res.data);
        })
        .catch(err => {
          console.log(err);
          reject(err);
        });
    });
  }

  public findCurrentSpecs(project_id: string) {
    return new Promise((resolve, reject) => {
      axios.get(`${window['env'].apiBaseUrl}/FindProjectDocuments?project_id=${project_id}&doc_type=split_single_section_file&latest_rev_only=true`)
        .then(res => {
          res.data.sort((prev, next) => {
            return (prev.doc_number > next.doc_number) ? 1 : -1;
          });
          resolve(res.data);
        })
        .catch(err => {
          console.log(err);
          reject(err);
        });
    });
  }

  public findSourceDocuments(project_id: string) {
    return new Promise((resolve, reject) => {
      axios.get(`${window['env'].apiBaseUrl}/FindProjectDocuments?project_id=${project_id}&doc_type=original`)
        .then(res => {
          res.data.sort((prev, next) => {
            return (prev.doc_name > next.doc_name) ? 1 : -1;
          });
          resolve(res.data);
        })
        .catch(err => {
          console.log(err);
          reject(err);
        });
    });
  }

  public findComparisonDrawings(project_id: string) {
    return new Promise((resolve, reject) => {
      axios.get(`${window['env'].apiBaseUrl}/FindComparisonDrawings?project_id=${project_id}`)
        .then(res => {
          const result = [];

          res.data.forEach(comparison => {
            const existingIndex = result.findIndex(element => element['doc_id'] === comparison['doc_id']);

            if (existingIndex >= 0) {
              result.splice(existingIndex, 1);
            }

            result.push(comparison);
          });

          resolve(result);
        })
        .catch(err => {
          console.log(err);
          reject(err);
        });
    });
  }
}
