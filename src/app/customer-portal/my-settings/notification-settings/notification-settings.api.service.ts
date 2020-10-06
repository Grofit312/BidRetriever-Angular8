import {
  Injectable
} from '@angular/core';
import axios from 'axios';
import * as queryString from 'query-string';

@Injectable()
export class NotificationSettingsApi {

  public getUserSettings(user_id: string) {
    return new Promise((resolve, reject) => {
      axios.get(`${window['env'].apiBaseUrl}/GetUserSettings?user_id=${user_id}`, {
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

  public createUserSetting(params: any) {
    debugger
    return new Promise((resolve, reject) => {
      axios.post(`${window['env'].apiBaseUrl}/CreateUserSetting`, queryString.stringify(params), {
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
        })
    });
  }
}
