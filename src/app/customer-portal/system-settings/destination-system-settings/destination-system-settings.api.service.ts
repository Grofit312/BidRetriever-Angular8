import {
  Injectable
} from '@angular/core';
import axios from 'axios';
import * as queryString from 'query-string';

@Injectable()
export class DestinationSettingsApi {
  public findDestinationTypes() {
    return new Promise((resolve, reject) => {
      axios.get(`${window['env'].apiBaseUrl}/FindDestinationTypes`, {
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

  public findCustomerDestination(customer_id: string) {
    return new Promise((resolve, reject) => {
      axios.get(`${window['env'].apiBaseUrl}/FindCustomerDestinations?customer_id=${customer_id}&detail_level=admin`, {
        validateStatus: (status) => {
          return status === 200 || status === 400
        }
      })
        .then(res => {
          if (res.status === 200) {
            if (res.data.length > 0) {
              resolve(res.data[0]);
            } else {
              reject('No customer destination found');
            }
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

  public updateDestinationSettings(params: any) {
    return new Promise((resolve, reject) => {
      axios.post(window['env'].apiBaseUrl + '/CreateCustomerDestination', queryString.stringify(params), {
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

  public verifyDropboxToken(token: string) {
    return new Promise((resolve, reject) => {
      axios.request({
        url: '/2/users/get_current_account',
        baseURL: window['env']['dropboxAPIDomain'],
        method: 'post',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }).then(res => {
        resolve(true);
      }).catch(err => {
        console.log(err);
        resolve(false);
      })
    });
  }

  public retrieveDropboxToken(code: string) {
    return new Promise((resolve, reject) => {
      axios.request({
        url: window['env']['dropboxTokenPath'],
        baseURL: window['env']['dropboxAPIDomain'],
        method: 'post',
        auth: {
          username: window['env']['dropboxAppKey'],
          password: window['env']['dropboxAppSecret'],
        },
        params: {
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: window['env']['oauthRedirectURL'],
        }
      }).then(res => {
        resolve(res['data']['access_token']);
      }).catch(err => {
        console.log(err);
        reject(err);
      })
    });
  }

  public retrieveDropboxAccount(token: string) {
    return new Promise((resolve, reject) => {
      axios.request({
        url: '/2/users/get_current_account',
        baseURL: window['env']['dropboxAPIDomain'],
        method: 'post',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }).then(res => {
        resolve(res['data']['email']);
      }).catch(err => {
        console.log(err);
        reject(err);
      })
    });
  }
}
