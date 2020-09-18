import { Injectable } from "@angular/core";
import axios from "axios";
import * as queryString from "query-string";

@Injectable()
export class NotesApi {
  public createNote(params: any) {
    return new Promise((resolve, reject) => {
      axios
        .post(
          window["env"].apiBaseUrl + "/CreateNote",
          queryString.stringify(params),
          {
            validateStatus: (status) => {
              return status === 200 || status === 400;
            },
          }
        )
        .then((res) => {
          if (res.status === 200) {
            resolve(res.data.note_id);
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

  public uploadFiles(formData: FormData) {
    
    return new Promise((resolve, reject) => {
      axios
        .post(
          window["env"].apiBaseUrl + "/UploadFile", formData,
          {
            validateStatus: (status) => {
              return status === 200 || status === 400;
            },
          }
        )
        .then((res) => {
          if (res.status === 200) {
            resolve(res);
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

  public getNotesByCompanyIds(company_id: any) {
    return new Promise((resolve, reject) => {
      let apiUrl = `${window["env"].apiBaseUrl}/FindNotes?company_id=${company_id}`;
      axios
        .get(apiUrl, {
          validateStatus: (status) => {
            return status === 200 || status === 400;
          },
        })
        .then((res) => {
          if (res.status === 200) {
            res.data = res.data.map((project) => {
              return project;
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

  public getComments(note_id: any, timezone: any) {
    return new Promise((resolve, reject) => {
      let apiUrl = `${window["env"].apiBaseUrl}/FindCompanyNotes?note_id=${note_id}&timezone=${timezone}`;
      axios
        .get(apiUrl, {
          validateStatus: (status) => {
            return status === 200 || status === 400;
          },
        })
        .then((res) => {
          if (res.status === 200) {
            res.data = res.data.map((project) => {
              return project;
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

  public getNotesByCompanyId(company_id: any) {
    return new Promise((resolve, reject) => {
      let apiUrl = `${window["env"].apiBaseUrl}/FindCompanyNotes/${company_id}`;
      axios
        .get(apiUrl, {
          validateStatus: (status) => {
            return status === 200 || status === 400;
          },
        })
        .then((res) => {
          if (res.status === 200) {
            res.data = res.data.map((project) => {
              return project;
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

  public updateNote(params: any) {
    return new Promise((resolve, reject) => {
      axios
        .post(
          window["env"].apiBaseUrl + "/UpdateNote",
          queryString.stringify(params),
          {
            validateStatus: (status) => {
              return status === 200 || status === 400;
            },
          }
        )
        .then((res) => {
          if (res.status === 200) {
            resolve(res.data.note_id);
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

  public deleteNote(note_id: string) {
    return new Promise((resolve, reject) => {
      const params = {
        note_id,
      };
      axios
        .post(
          `${window["env"].apiBaseUrl}/RemoveNotes`,
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
}
