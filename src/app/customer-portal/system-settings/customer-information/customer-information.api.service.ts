import {
  Injectable
} from '@angular/core';
import axios from 'axios';
import * as queryString from 'query-string';

@Injectable()
export class UserSettingsApi {

  public updateCustomer(customer_id: string, params: any) {
    return new Promise((resolve, reject) => {
      params.search_customer_id = customer_id;

      axios.post(window['env'].apiBaseUrl + '/UpdateCustomer', queryString.stringify(params), {
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
