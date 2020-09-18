import {
    Injectable
  } from '@angular/core';
  import axios from 'axios';
  import * as queryString from 'query-string';
  const moment = require('moment-timezone');
  
  @Injectable()
  export class ViewEmployeeApi {
     /**
     * Get Employee info
     * @param contact_id
     */
    public getEmployee(contact_id: string, timezone: string) {
      return new Promise((resolve, reject) => {
        axios.get(`${window['env'].apiBaseUrl}/GetContact?contact_id=${contact_id}`, {
          validateStatus: (status) => {
            return status === 200 || status === 400
          }
        })
        .then(res => {
          if (res.status === 200) {
            res['data']['contact_id'] = res['data']['contact_id'];
           
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
  