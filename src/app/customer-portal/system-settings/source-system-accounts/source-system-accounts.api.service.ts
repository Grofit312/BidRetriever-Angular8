import {
  Injectable
} from '@angular/core';
import axios from 'axios';
import * as queryString from 'query-string';

@Injectable()
export class SourceSystemAccountsApi {

  public findSourceSystemTypes() {
    return new Promise((resolve, reject) => {
      axios.get(window['env'].apiBaseUrl + '/FindSourceSystemType', {
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

  public findCompanyList(customer_id) {
    return new Promise((resolve, reject) => {
      axios.get(window['env'].apiBaseUrl + `/CompanyList?customer_id=${customer_id}`, {
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

  public createContactEmail(params: any) {
    debugger
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


  public findSourceSystems(customer_id: string) {
    return new Promise((resolve, reject) => {
      axios.get(window['env'].apiBaseUrl + `/FindCustomerSourceSystems?customer_id=${customer_id}`, {
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

  public createSourceSystem(params: any) {
    return new Promise((resolve, reject) => {
      axios.post(window['env'].apiBaseUrl + '/CreateCustomerSourceSystem', queryString.stringify(params), {
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

  public updateSourceSystem(params: any) {
    return new Promise((resolve, reject) => {
      axios.post(window['env'].apiBaseUrl + '/UpdateCustomerSourceSystem', queryString.stringify(params), {
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

  public removeSourceSystem(customer_source_sys_id: string) {
    return new Promise((resolve, reject) => {
      var params = {
        customer_source_sys_id: customer_source_sys_id,
      };

      axios.post(window['env'].apiBaseUrl + '/RemoveCustomerSourceSystem', queryString.stringify(params), {
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
