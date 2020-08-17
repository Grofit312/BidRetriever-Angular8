import {
  Injectable
} from '@angular/core';
import axios from 'axios';
import * as queryString from 'query-string';

@Injectable()
export class ChangeCompanyApi {

  public changeCompany(token: string) {
    return new Promise((resolve, reject) => {
      axios.post(window['env'].apiBaseUrl + '/ChangeCompany', queryString.stringify({ token: token }), {
        validateStatus: (status) => {
          return status === 200 || status === 400
        }
      })
        .then(res => {
          if (res.status === 200) {
            resolve(true);
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
}
