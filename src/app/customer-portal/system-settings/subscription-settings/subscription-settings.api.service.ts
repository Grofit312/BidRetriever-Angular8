import {
  Injectable
} from '@angular/core';
import axios from 'axios';
import * as queryString from 'query-string';

@Injectable()
export class SubscriptionSettingsApi {

  public subscribe(customer_id: string, user_email: string, source_token: string,
    core_product_id: string, license_product_id: string, license_count: number) {
    return new Promise((resolve, reject) => {
      const params = {
        customer_id,
        user_email,
        source_token,
        core_product_id,
        license_product_id,
        license_count,
      };

      axios.post(window['env'].apiBaseUrl + '/CreateCustomerSubscription', queryString.stringify(params), {
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

  public updateBilling(customer_id: string, source_token: string) {
    return new Promise((resolve, reject) => {
      const params = {
        customer_id: customer_id,
        source_token: source_token,
      };

      axios.post(window['env'].apiBaseUrl + '/UpdateBillingInfo', queryString.stringify(params), {
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

  public unsubscribe(customer_id: string) {
    return new Promise((resolve, reject) => {
      const params = {
        customer_id: customer_id,
      };

      axios.post(window['env'].apiBaseUrl + '/RemoveCustomerSubscription', queryString.stringify(params), {
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

  public updateSubscription(customer_id: string, core_product_id, license_product_id, license_count) {
    return new Promise((resolve, reject) => {
      const params = {
        customer_id,
        core_product_id,
        license_product_id,
        license_count,
      };

      axios.post(window['env'].apiBaseUrl + '/UpdateCustomerSubscription', queryString.stringify(params), {
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

  public getObscuredCardInfo(customer_id: string) {
    return new Promise((resolve, reject) => {
      axios.get(`${window['env'].apiBaseUrl}/GetCardInfo?customer_id=${customer_id}`, {
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

  public getStripePublishKey() {
    return new Promise((resolve, reject) => {
      axios.get(`${window['env'].apiBaseUrl}/GetSystemSettings?system_setting_id=STRIPE_PUBLISH_KEY`, {
        validateStatus: (status) => {
          return status === 200 || status === 400
        }
      })
        .then(res => {
          if (res.status === 200) {
            resolve(res.data.setting_value);
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

  public getProducts() {
    return new Promise((resolve, reject) => {
      axios.get(`${window['env'].apiBaseUrl}/FindSystemProducts`, {
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

  public getSubscriptions(customer_id: string) {
    return new Promise((resolve, reject) => {
      axios.get(`${window['env'].apiBaseUrl}/GetCustomerSubscription?customer_id=${customer_id}`, {
        validateStatus: (status) => {
          return status === 200 || status === 400
        }
      })
        .then(res => {
          if (res.status === 200) {
            resolve(res.data);
          } else {
            resolve();
          }
        })
        .catch(err => {
          console.log(err);
          reject(err);
        });
    });
  }
}
