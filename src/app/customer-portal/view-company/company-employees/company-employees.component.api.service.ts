import {
  Injectable
} from '@angular/core';
import axios from 'axios';
import * as queryString from 'query-string';

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
  public findCompanyContact(customer_id: any, company_id: any) {
    
    return new Promise((resolve, reject) => {
      axios.get(`${window['env'].apiBaseUrl}/FindContacts?customer_id=${customer_id}&company_id=${company_id}&detail_level=all`, {
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
}
