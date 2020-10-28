import {
  Injectable
} from '@angular/core';
import axios from 'axios';
import * as queryString from 'query-string';
const moment = require('moment-timezone');

@Injectable()
export class CompaniesApi {

  public findCompaniesByCustomerId(customer_id: string, timezone: string, data_view_id: string = null) {
    return new Promise((resolve, reject) => {
      let apiUrl = `${window['env'].apiBaseUrl}/FindCompanies?customer_id=${customer_id}&detail_level=all`;
      if (data_view_id) {
        apiUrl = `${apiUrl}&view_id=${data_view_id}`;
      } else {
        apiUrl = `${apiUrl}&status=active`;
      }
      axios.get(apiUrl, {
        validateStatus: (status) => {
          return status === 200 || status === 400
        }
      })
        .then(res => {
          if (res.status === 200) {
            res.data = res.data.map((company) => {
              company['company_city_state'] = `${company['company_city']}, ${company['company_state']}`;
              company['last_change_date'] = this.convertToTimeZoneString(company['last_change_date'], timezone);
              company['create_datetime'] = this.convertToTimeZoneString(company['create_datetime'], timezone);
              return company;
            });

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

  public findCompaniesByUserId(user_id: string, customerId: string, timezone: string, data_view_id: string = null) {
    return new Promise((resolve, reject) => {
      let apiUrl = `${window['env'].apiBaseUrl}/FindCompanies?user_id=${user_id}&detail_level=all&customer_id=${customerId}`;
      //let apiUrl = `${window['env'].apiBaseUrl}/FindCompanies?user_id=${user_id}`;
      if (data_view_id) {
        apiUrl = `${apiUrl}&view_id=${data_view_id}`;
      }
      axios.get(apiUrl, {
        validateStatus: (status) => status === 200 || status === 400
      })
        .then(res => {
          if (res.status === 200) {
            if (data_view_id == null) {
              res.data = res.data.map((company) => {
                company['company_city_state'] = `${company['company_city']}, ${company['company_state']}`;
                company['last_change_date'] = this.convertToTimeZoneString(company['last_change_date'], timezone);
                company['create_datetime'] = this.convertToTimeZoneString(company['create_datetime'], timezone);
                return company;
              });
            }

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

  public updateCompany(company_id: string, params: any) {
    return new Promise((resolve, reject) => {
      params.search_company_id = company_id;
      params.company_id = company_id;

      axios.post(`${window['env'].apiBaseUrl}/UpdateCompany`, queryString.stringify(params), {
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

  public getPublishedLink(company_id: string) {
    return new Promise((resolve, reject) => {
      axios.get(`${window['env'].apiBaseUrl}/GetPublishedLink?company_id=${company_id}`, {
        validateStatus: (status) => {
          return status === 200 || status === 400;
        }
      })
      .then(res => {
        if (res.status === 200) {
          resolve(res.data.url);
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

  public getPublishedFolderLink(company_id: string, folder_id: string) {
    return new Promise((resolve, reject) => {
      axios.get(`${window['env'].apiBaseUrl}/GetPublishedLink?company_id=${company_id}&folder_id=${folder_id}`, {
        validateStatus: (status) => {
          return status === 200 || status === 400;
        }
      })
      .then(res => {
        if (res.status === 200) {
          resolve(res.data.url);
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

  public createCompanySubmission(params: any) {
    return new Promise((resolve, reject) => {
      axios.post(`${window['env'].apiBaseUrl}/CreateCompanySubmissionDL`, queryString.stringify(params), {
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

  public createCompany(params: any) {
    return new Promise((resolve, reject) => {
      axios.post(`${window['env'].apiBaseUrl}/createCompany`, queryString.stringify(params), {
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

  public getCompanySubmissions(company_id: string, submission_process_status, timezone: string) {
    return new Promise((resolve, reject) => {
      axios.get(`${window['env'].apiBaseUrl}/FindCompanySubmissions?company_id=${company_id}&submission_process_status=${submission_process_status}`, {
        validateStatus: (status) => {
          return status === 200 || status === 400
        }
      })
        .then(res => {
          if (res.status === 200) {
            res.data = res.data.map((submission) => {
              submission['submission_date'] = this.convertToTimeZoneString(submission['received_datetime'], timezone);
              return submission;
            });

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

  public getSubmissionDocuments(company_id: string, submission_id: string, timezone: string) {
    return new Promise((resolve, reject) => {
      axios.get(`${window['env'].apiBaseUrl}/FindCompanyDocuments?company_id=${company_id}&submission_id=${submission_id}&detail_level=admin`, {
        validateStatus: (status) => {
          return status === 200 || status === 400
        }
      })
        .then(res => {
          if (res.status === 200) {
            res.data = res.data.map((document) => {
              document['create_datetime'] = this.convertToTimeZoneString(document['create_datetime'], timezone);
              document['submission_datetime'] = this.convertToTimeZoneString(document['submission_datetime'], timezone);
              return document;
            });

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

  public updateCompanySubmission(submission_id: string, params: any) {
    return new Promise((resolve, reject) => {
      params.search_company_submission_id = submission_id;

      axios.post(`${window['env'].apiBaseUrl}/UpdateCompanySubmission`, queryString.stringify(params), {
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

  public updateCompanyStatus(company_id: string, submission_id: string, status: string, message: string) {
    return Promise.all([
      this.updateCompany(company_id, { company_process_status: status, company_process_message: message }),
      this.updateCompanySubmission(submission_id, { submission_process_status: status, submission_process_message: message }),
    ]);
  }

  public findTransactionLogs(company_id: string, submission_id: string, doc_id: string, timezone: string) {
    return new Promise((resolve, reject) => {
      const queryString = `company_id=${company_id}&limit=${-1}` + (submission_id ? `&submission_id=${submission_id}` : '') + (doc_id ? `&doc_id=${doc_id}` : '');

      axios.get(`${window['env'].apiBaseUrl}/FindLog?${queryString}`, {
        validateStatus: (status) => {
          return status === 200 || status === 400;
        }
      })
        .then(res => {
          if (res.status === 200) {
            res.data = res.data.map((log) => {
              log['operation_datetime'] = this.convertToTimeZoneString(log['operation_datetime'], timezone, true);
              return log;
            });

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

  public getDocumentRevisions(doc_id: string, timezone: string) {
    return new Promise((resolve, reject) => {
      axios.get(`${window['env'].apiBaseUrl}/GetDocumentRevisions?doc_id=${doc_id}`, {
        validateStatus: (status) => {
          return status === 200 || status === 400
        }
      })
        .then(res => {
          if (res.status === 200) {
            res.data = res.data.map((revision) => {
              revision['submission_datetime'] = this.convertToTimeZoneString(revision['submission_datetime'], timezone);
              revision['current_rev'] = revision['current_revision'] === true ? 'Yes' : 'No';
              return revision;
            });

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

  public getDocument(doc_id: string, file_id: string = null) {
    return new Promise((resolve, reject) => {
      axios.get(`${window['env'].apiBaseUrl}/GetDocument?doc_id=${doc_id}`)
        .then(res => {
          if (file_id) {
            const file = res.data.find(data => data.file_id === file_id);
            if (file) {
              resolve(res.data.find(data => data.file_id === file_id));
            } else {
              reject('File not found');
            }
          } else {
            const pdfFile = res.data.find(data => data.file_type === 'source_system_original');
            if (pdfFile) {
              resolve(pdfFile);
            } else {
              reject('Document not found');
            }
          }
        })
        .catch(err => {
          console.log(err);
          reject(err);
        });
    });
  }

  public createCompanyDocument(params: any) {
    return new Promise((resolve, reject) => {
      axios.post(`${window['env'].apiBaseUrl}/CreateCompanyDocument`, queryString.stringify(params), {
        validateStatus: (status) => {
          return status === 200 || status === 400
        }
      })
      .then(res => {
        if (res.status === 200) {
          resolve(res.data.doc_id);
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

  public updateCompanyDocument(params: any) {
    return new Promise((resolve, reject) => {
      axios.post(`${window['env'].apiBaseUrl}/UpdateCompanyDocument`, queryString.stringify(params))
      .then(res => {
        resolve(res.data);
      })
      .catch(err => {
        console.log(err);
        reject(err);
      });
    });
  }

  public updateDocumentKeyAttributes(params: any) {
    return new Promise((resolve, reject) => {
      axios.post(`${window['env'].apiBaseUrl}/UpdateDocumentKeyAttributes`, queryString.stringify(params))
      .then(res => {
        resolve(res.data);
      })
      .catch(err => {
        console.log(err);
        reject(err);
      });
    });
  }

  public findDisciplines() {
    return new Promise((resolve, reject) => {
      axios.get(`${window['env'].apiBaseUrl}/FindDisciplines`)
      .then(res => {
        resolve(res.data);
      })
      .catch(err => {
        reject(err);
      });
    });
  }

  public convertToTimeZoneString(timestamp: string, timezone: string, withSeconds: boolean = false) {
    const datetime = moment(timestamp);
    let timeZonedDateTime = null;

    switch(timezone) {
      case 'eastern':
        timeZonedDateTime = datetime.tz('America/New_York');
        break;

      case 'central':
        timeZonedDateTime = datetime.tz('America/Chicago');
        break;

      case 'mountain':
        timeZonedDateTime = datetime.tz('America/Denver');
        break;

      case 'pacific':
        timeZonedDateTime = datetime.tz('America/Los_Angeles');
        break;

      case 'Non US Timezone': case 'utc': default:
        timeZonedDateTime = datetime.utc();
    }

    const result = withSeconds ? timeZonedDateTime.format('YYYY-MM-DD HH:mm:ss z') : timeZonedDateTime.format('YYYY-MM-DD HH:mm z');

    return result === 'Invalid date' ? '' : result;
  }

  public findDataViews(viewType: string, customerId: string = null) {
    return new Promise((resolve, reject) => {
      axios.get(`${window['env'].apiBaseUrl}/FindDataViews?view_type=${viewType}${customerId == null ? '' : '&customer_id=' + customerId}`)
        .then((res) => {
          return resolve(res.data);
        })
        .catch((error) => {
          return reject(error);
        });
    });
  }

  public findDataViewFieldSettings(viewType: string) {
    return new Promise((resolve, reject) => {
      if (viewType == null) {
        return resolve([]);
      }

      axios.get(`${window['env'].apiBaseUrl}/FindDataViewFieldSettings?data_view_id=${viewType}`)
        .then((res) => {
          return resolve(res.data);
        })
        .catch((error) => {
          return reject(error);
        });
    })
  }
}
