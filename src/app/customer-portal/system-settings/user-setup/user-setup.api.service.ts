import {
  Injectable
} from '@angular/core';
import axios from 'axios';
import * as queryString from 'query-string';

@Injectable()
export class UserInfoApi {

  public findUsers(customer_id: string = '') {
    return new Promise((resolve, reject) => {
      axios.get(window['env'].apiBaseUrl + `/FindUsers?customer_id=${customer_id}&detail_level=admin`, {
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

  public createCustomer(params: any) {
    return new Promise((resolve, reject) => {
      axios.post(window['env'].apiBaseUrl + '/CreateCustomer', queryString.stringify(params), {
        validateStatus: (status) => {
          return status === 200 || status === 400
        }
      })
        .then(res => {
          if (res.status === 200) {
            resolve(res.data.customer_id);
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

  public createUser(params: any) {
    return new Promise((resolve, reject) => {
      axios.post(window['env'].apiBaseUrl + '/CreateUser', queryString.stringify(params), {
        validateStatus: (status) => {
          return status === 200 || status === 400
        }
      })
        .then(res => {
          if (res.status === 200) {
            resolve(res.data.user_id);
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

  public addCompanyUser(user_id: string, customer_id: string) {
    return new Promise((resolve, reject) => {
      axios.post(window['env'].apiBaseUrl + '/AddCompanyUser', queryString.stringify({ user_id: user_id, customer_id: customer_id }), {
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

  public updateUser(params: any) {
    return new Promise((resolve, reject) => {
      axios.post(window['env'].apiBaseUrl + '/UpdateUser', queryString.stringify(params), {
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

  public removeUser(user_id: string, customer_id: string) {
    return new Promise((resolve, reject) => {
      var params = {
        user_id: user_id,
        customer_id: customer_id,
      };

      axios.post(window['env'].apiBaseUrl + '/RemoveCustomerUser', queryString.stringify(params), {
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
