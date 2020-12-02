import { Injectable } from "@angular/core";
import axios from "axios";
import * as queryString from "query-string";
const moment = require("moment-timezone");

@Injectable()
export class ViewCompanyApi {
  /**
   * Get project info
   * @param project_id
   */
  public getCompany(company_id: string, timezone: string) {
    return new Promise((resolve, reject) => {
      axios
        .get(
          `${window["env"].apiBaseUrl}/GetCompany?company_id=${company_id}&detail_level=admin`,
          {
            validateStatus: (status) => {
              return status === 200 || status === 400;
            },
          }
        )
        .then((res) => {
          if (res.status === 200) {
            res["data"]["company_admin_user_id"] = res["data"]["user_id"];
            res["data"][
              "create_datetime_origin"
            ] = this.convertToTimeZoneObject(
              res["data"]["create_datetime"],
              timezone
            ).format("MMM D, YYYY H:mm z");
            res["data"]["edit_datetime_origin"] = this.convertToTimeZoneObject(
              res["data"]["edit_datetime"],
              timezone
            ).format("MMM D, YYYY H:mm z");
            res["data"]["create_datetime"] = this.convertToTimeZoneObject(
              res["data"]["create_datetime"],
              timezone
            ).format("MMM D, YYYY");
            res["data"]["edit_datetime"] = this.convertToTimeZoneObject(
              res["data"]["edit_datetime"],
              timezone
            ).format("MMM D, YYYY");
            res["data"][
              "company_address"
            ] = `${res["data"]["company_address1"]} ${res["data"]["company_address2"]} ${res["data"]["company_city"]} ${res["data"]["company_state"]} ${res["data"]["company_zip"]} ${res["data"]["company_country"]}`;
            resolve(res.data);
          } else {
            reject(res.data.status);
          }
        })
        .catch((err) => {
          console.log(err);
          reject(err);
        });
    });
  }

  /**
   * Get user notifications
   * @param project_id
   */
  public findUserNotifications(project_id: string, timezone: string) {
    return new Promise((resolve, reject) => {
      axios
        .get(
          `${window["env"].apiBaseUrl}/FindUserNotifications?project_id=${project_id}`,
          {
            validateStatus: (status) => {
              return status === 200 || status === 400;
            },
          }
        )
        .then((res) => {
          if (res.status === 200) {
            res.data = res.data.map((userNotification) => {
              userNotification["date_sent"] = this.convertToTimeZoneObject(
                userNotification["notification_send_datetime"],
                timezone
              ).format("YYYY-MM-DD");
              userNotification["time_sent"] = this.convertToTimeZoneObject(
                userNotification["notification_send_datetime"],
                timezone
              ).format("HH:mm z");

              return userNotification;
            });

            resolve(res.data);
          } else {
            reject(res.data.status);
          }
        })
        .catch((err) => {
          console.log(err);
          reject(err);
        });
    });
  }

  /**
   * Get project settings
   * @param project_id
   */
  public getProjectSettings(project_id: string) {
    return new Promise((resolve, reject) => {
      axios
        .get(
          `${window["env"].apiBaseUrl}/GetProjectSettings?project_id=${project_id}`,
          {
            validateStatus: (status) => {
              return status === 200 || status === 400;
            },
          }
        )
        .then((res) => {
          if (res.status === 200) {
            resolve(res.data);
          } else {
            reject(res.data.status);
          }
        })
        .catch((err) => {
          console.log(err);
          reject(err);
        });
    });
  }

  public findCompanyContact(
    customer_id: any,
    company_id: any,
    timezone: string
  ): Promise<any[]> {
    return new Promise((resolve, reject) => {
      axios
        .get(
          `${window["env"].apiBaseUrl}/FindContacts?customer_id=${customer_id}&company_id=${company_id}&detail_level=all`,
          {
            validateStatus: (status) => {
              return status === 200 || status === 400;
            },
          }
        )
        .then((res) => {
          if (res.status === 200) {
            res.data = res.data.map((contacts) => {
              contacts[
                "contact_city_state"
              ] = `${contacts["contact_city"]}, ${contacts["contact_state"]}`;
              contacts[
                "contact_last_first_name"
              ] = `${contacts["contact_lastname"]}, ${contacts["contact_firstname"]}`;
              return contacts;
            });
            resolve(res.data);
          } else {
            reject(res.data.status);
          }
        })
        .catch((err) => {
          console.log(err);
          reject(err);
        });
    });
  }
  public findProjects(source_company_id: string) {
    return new Promise((resolve, reject) => {
      axios
        .get(
          window["env"].apiBaseUrl +
            `/FindProjects?source_company_id=${source_company_id}&detail_level=basic`,
          {
            validateStatus: (status) => {
              return status === 200 || status === 400;
            },
          }
        )
        .then((res) => {
          if (res.status === 200) {
            resolve(res.data);
          } else {
            reject(res.data.status);
          }
        })
        .catch((err) => {
          console.log(err);
          reject(err);
        });
    });
  }
  /**
   * Convert to timezone object
   * @param timestamp
   * @param timezone
   */
  public convertToTimeZoneObject(timestamp: string, timezone: string) {
    const datetime = moment(timestamp);
    let timezonedDateTime = null;

    switch (timezone) {
      case "eastern":
        timezonedDateTime = datetime.tz("America/New_York");
        break;

      case "central":
        timezonedDateTime = datetime.tz("America/Chicago");
        break;

      case "mountain":
        timezonedDateTime = datetime.tz("America/Denver");
        break;

      case "pacific":
        timezonedDateTime = datetime.tz("America/Los_Angeles");
        break;

      case "Non US Timezone":
      case "utc":
      default:
        timezonedDateTime = datetime.utc();
    }
    return timezonedDateTime;
  }
}
