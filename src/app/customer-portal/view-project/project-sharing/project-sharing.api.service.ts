import { Injectable } from "@angular/core";
import axios from "axios";
import * as queryString from "query-string";
const moment = require("moment-timezone");

@Injectable()
export class ProjectSharingApi {
  public findSharedProjects(params, timezone: string) {
    return new Promise((resolve, reject) => {
      axios
        .get(
          window["env"].apiBaseUrl +
            `/FindSharedProjects?${queryString.stringify(params)}`
        )
        .then((res) => {
          res.data = res.data.map((project) => {
            project[
              "project_city_state"
            ] = `${project["project_state"]}, ${project["project_city"]}`;
            project["edit_datetime"] = this.convertToTimeZoneString(
              project["edit_datetime"],
              timezone
            );
            project["create_datetime"] = this.convertToTimeZoneString(
              project["create_datetime"],
              timezone
            );
            project["project_bid_datetime"] = this.convertToTimeZoneString(
              project["project_bid_datetime"],
              timezone
            );

            return project;
          });

          resolve(res.data);
        })
        .catch((err) => {
          console.log(err);
          reject(err);
        });
    });
  }

  public findShareUsers(project_id: string, share_source_user_id: string) {
    return new Promise((resolve, reject) => {
      axios
        .get(
          window["env"].apiBaseUrl +
            `/FindSharedProjects?project_id=${project_id}&share_source_user_id=${share_source_user_id}&status=active`
        )
        .then((res) => {
          resolve(res.data);
        })
        .catch((err) => {
          console.log(err);
          reject(err);
        });
    });
  }

  public createSharedProject(params: any) {
    return new Promise((resolve, reject) => {
      axios
        .post(
          window["env"].apiBaseUrl + "/CreateSharedProject",
          queryString.stringify(params)
        )
        .then((res) => {
          resolve();
        })
        .catch((err) => {
          console.log(err);
          reject(err);
        });
    });
  }

  public updateSharedProject(params: any) {
    return new Promise((resolve, reject) => {
      axios
        .post(
          window["env"].apiBaseUrl + "/UpdateSharedProject",
          queryString.stringify(params)
        )
        .then((res) => {
          resolve();
        })
        .catch((err) => {
          console.log(err);
          reject(err);
        });
    });
  }

  public convertToTimeZoneString(timestamp: string, timezone: string) {
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

    const result = timezonedDateTime.format("YYYY-MM-DD HH:mm z");

    return result === "Invalid date" ? "" : result;
  }
}
