import {
  Injectable
} from '@angular/core';
import axios from 'axios';
import * as querystring from 'query-string';

@Injectable()
export class AuthApi {

  public login(email: string, password: string) {
    return new Promise((resolve, reject) => {
      const params = {
        user_email: email,
        user_password: password,
      };

      axios.post(`${window['env'].apiBaseUrl}/LoginUser`, querystring.stringify(params), {
        validateStatus: (status) => {
          return status === 200 || status === 400
        }
      })
        .then(res => {
          if (res.status === 200) {
            resolve(res.data);
          } else {
            console.log(res.data.status);
            reject(res.data.status);
          }
        })
        .catch(err => {
          console.log(err);
          reject(err);
        });
    });
  }

  public register(email: string, password: string, firstName: string, lastName: string, companyName: string) {
    return new Promise((resolve, reject) => {
      var params = {
        user_email: email,
        user_password: password,
        user_firstname: firstName,
        user_lastname: lastName,
        customer_name: companyName,
      };

      axios.post(`${window['env'].apiBaseUrl}/RegisterUser`, querystring.stringify(params), {
        validateStatus: (status) => {
          return status === 200 || status === 400
        }
      })
        .then(res => {
          if (res.status === 200) {
            resolve(res.data);
          } else {
            console.log(res.data.status);
            reject(res.data.status);
          }
        })
        .catch(err => {
          console.log(err);
          reject(err);
        });
    });
  }

  public authenticate(token: string): Promise<any> {
    return new Promise((resolve, reject) => {
      var params = {
        token: token,
      };

      axios.post(`${window['env'].apiBaseUrl}/AuthenticateUser`, querystring.stringify(params), {
        validateStatus: (status) => {
          return status === 200 || status === 400
        }
      })
        .then(res => {
          if (res.status === 200) {
            resolve(res.data);
          } else {
            console.log(res.data.status);
            reject(res.data.status);
          }
        })
        .catch(err => {
          console.log(err);
          reject(err);
        });
    });
  }

  public forgotPassword(email: string) {
    return new Promise((resolve, reject) => {
      var params = {
        user_email: email,
      };

      axios.post(`${window['env'].apiBaseUrl}/ForgotPassword`, querystring.stringify(params), {
        validateStatus: (status) => {
          return status === 200 || status === 400
        }
      })
        .then(res => {
          if (res.status === 200) {
            resolve(res.data);
          } else {
            console.log(res.data.status);
            reject(res.data.status);
          }
        })
        .catch(err => {
          console.log(err);
          reject(err);
        });
    });
  }

  public resetPassword(token: string, password: string) {
    return new Promise((resolve, reject) => {
      var params = {
        token: token,
        user_password: password,
      };

      axios.post(`${window['env'].apiBaseUrl}/ResetPassword`, querystring.stringify(params), {
        validateStatus: (status) => {
          return status === 200 || status === 400
        }
      })
        .then(res => {
          if (res.status === 200) {
            resolve(res.data);
          } else {
            console.log(res.data.status);
            reject(res.data.status);
          }
        })
        .catch(err => {
          console.log(err);
          reject(err);
        });
    });
  }

  public getCompanyOffice(officeId: string) {
    return new Promise((resolve, reject) => {
      axios.get(`${window['env'].apiBaseUrl}/GetCompanyOffice?company_office_id=${officeId}&detail_level=admin`, {
        validateStatus: (status) => {
          return status === 200 || status === 400
        }
      }).then(res => {
        if (res.status === 200) {
          resolve(res.data);
        } else {
          reject(res.data.status);
        }
      }).catch(error => {
        reject(error);
      });
    });
  }

  public getCustomer(customer_id: string) {
    return new Promise((resolve, reject) => {
      axios.get(`${window['env'].apiBaseUrl}/GetCustomer?customer_id=${customer_id}&detail_level=admin`, {
        validateStatus: (status) => {
          return status === 200 || status === 400
        }
      })
        .then(res => {
          if (res.status === 200) {
            resolve(res.data);
          } else {
            console.log(res.data.status);
            reject(res.data.status);
          }
        })
        .catch(err => {
          console.log(err);
          reject(err);
        })
    });
  }

  public getUser(user_email: string) {
    return new Promise((resolve, reject) => {
      axios.get(`${window['env'].apiBaseUrl}/GetUser?user_email=${user_email}&detail_level=admin`, {
        validateStatus: (status) => {
          return status === 200 || status === 400
        }
      })
        .then(res => {
          if (res.status === 200) {
            resolve(res.data);
          } else {
            console.log(res.data.status);
            reject(res.data.status);
          }
        })
        .catch(err => {
          console.log(err);
          reject(err);
        })
    });
  }

  public getUserById(user_id: string) {
    return new Promise((resolve, reject) => {
      axios.get(`${window['env'].apiBaseUrl}/GetUser?user_id=${user_id}&detail_level=admin`, {
        validateStatus: (status) => {
          return status === 200 || status === 400
        }
      })
        .then(res => {
          if (res.status === 200) {
            resolve(res.data);
          } else {
            console.log(res.data.status);
            reject(res.data.status);
          }
        })
        .catch(err => {
          console.log(err);
          reject(err);
        })
    });
  }

  public findUserDevices(user_id: string) {
    return new Promise((resolve, reject) => {
      axios.get(`${window['env'].apiBaseUrl}/FindUserDevices?user_id=${user_id}`, {
        validateStatus: (status) => {
          return status === 200 || status === 400
        }
      }).then(res => {
        if (res.status === 200) {
          resolve(res.data);
        } else {
          console.log(res.data.status);
          reject(res.data.status);
        }
      }).catch(error => {
        console.log(error);
        reject(error);
      });
    });
  }
}
