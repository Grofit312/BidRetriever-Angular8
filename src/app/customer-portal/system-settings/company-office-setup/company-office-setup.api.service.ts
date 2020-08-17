import {
  Injectable
} from '@angular/core';
import axios from 'axios';
import * as queryString from 'query-string';

@Injectable()
export class CompanyOfficeApi {
  public findOffices(customer_id: string) {
    return new Promise((resolve, reject) => {
      axios.get(window['env'].apiBaseUrl + `/FindCompanyOffices?customer_id=${customer_id}`, {
        validateStatus: (status) => {
          return status === 200 || status === 400
        }
      })
        .then(res => {
          if (res.status === 200) {
            resolve(res.data.filter(office => office.status === 'active'));
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

  public getOffice(office_id: string) {
    return new Promise((resolve, reject) => {
      axios.get(window['env'].apiBaseUrl + `/GetCompanyOffice?company_office_id=${office_id}`, {
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

  public createOffice(params: any) {
    return new Promise((resolve, reject) => {
      axios.post(`${window['env'].apiBaseUrl}/CreateCompanyOffice`, queryString.stringify(params), {
        validateStatus: (status) => {
          return status === 200 || status === 400
        }
      })
        .then(res => {
          if (res.status === 200) {
            resolve(res.data.company_office_id);
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

  public updateOffice(params: any) {
    return new Promise((resolve, reject) => {
      axios.post(`${window['env'].apiBaseUrl}/UpdateCompanyOffice`, queryString.stringify(params), {
        validateStatus: (status) => {
          return status === 200 || status === 400
        }
      })
        .then(res => {
          if (res.status === 200) {
            resolve(res.data.status);
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
