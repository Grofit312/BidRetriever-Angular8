import {
  Injectable
} from '@angular/core';
import axios from 'axios';
import * as queryString from 'query-string';
const moment = require('moment-timezone');

@Injectable()
export class MyCalendarApi {
  public eventStatus: any[] = [
    {
      value: 'active',
      name: 'Active',
    },
    {
      value: 'deleted',
      name: 'Deleted',
    },
    {
      value: 'inactive',
      name: 'Inactive',
    },
    {
      value: 'draft',
      name: 'Draft',
    },
    {
      value: 'archived',
      name: 'Archived',
    },
  ];

  public eventType: any[] = [
    {
      value: 'user_defined_datetime',
      name: 'User Defined Date',
    },
    {
      value: 'project_award_datetime',
      name: 'Project Award Date',
    },
    {
      value: 'project_bid_datetime',
      name: 'Project Bid Due Date',
    },
    {
      value: 'project_complete_datetime',
      name: 'Project Finish Date',
    },
    {
      value: 'project_contract_datetime',
      name: 'Project Contract Date',
    },
    {
      value: 'project_expected_award_datetime',
      name: 'Project Expected Award Date',
    },
    {
      value: 'project_expected_contract_datetime',
      name: 'Project Expected Contract Date',
    },
    {
      value: 'project_prebid_mtg_datetime',
      name: 'Project Prebid Meeting Date',
    },
    {
      value: 'project_rfi_due_datetime',
      name: 'Project RFI Due Date',
    },
    {
      value: 'project_start_datetime',
      name: 'Project Start Date',
    },
    {
      value: 'project_work_end_datetime',
      name: 'Project Work Finish Date',
    },
    {
      value: 'project_work_start_datetime',
      name: 'Project Work Start Date',
    },
    {
      value: 'customer_datetime',
      name: 'Customer Date',
    },
  ];

  public findCalendarEvents(company_id: string, project_id: string) {  
    return new Promise((resolve, reject) => {
      const query = `status=active${company_id ? `&company_id=${company_id}` : ''}${project_id ? `&project_id=${project_id}` : ''}`;
      axios.get(`${window['env'].apiBaseUrl}/FindCalendarEvents?${query}`, {
        validateStatus: (status) => {
          return status === 200 || status === 400
        }
      })
      .then(res => {
        if (res.status === 200) {
          resolve(res.data);
          //TODO - TimeZone handling
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

  public getCalendarEvent(calendar_event_id: string) {
    return new Promise((resolve, reject) => {
      axios.get(`${window['env'].apiBaseUrl}/GetCalendarEvent?calendar_event_id=${calendar_event_id}`, {
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

  public createCalendarEvent(params: any) {
    return new Promise((resolve, reject) => {
      axios.post(`${window['env'].apiBaseUrl}/CreateCalendarEvent`, queryString.stringify(params), {
        validateStatus: (status) => {
          return status === 200 || status === 400
        }
      })
        .then(res => {
          if (res.status === 200) {
            resolve(res.data.calendar_event_id);
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

  public updateCalendarEvent(calendar_event_id: string, params: any) {
    return new Promise((resolve, reject) => {
      params.search_calendar_event_id = calendar_event_id;

      axios.post(`${window['env'].apiBaseUrl}/UpdateCalendarEvent`, queryString.stringify(params), {
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

  public findOrganizers(customer_id: string) {
    return new Promise((resolve, reject) => {
      axios.get(window['env'].apiBaseUrl + `/FindUsers?customer_id=${customer_id}&detail_level=admin`, {
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

  public findProject(project_id: string) {
    return new Promise((resolve, reject) => {
      axios.get(window['env'].apiBaseUrl + `/FindProjects?project_id=${project_id}&detail_level=all`, {
        validateStatus: (status) => {
          return status === 200 || status === 400
        }
      })
        .then(res => {
          if (res.status === 200) {
            if (res.data.length === 0) {
              reject('Project not found');
            } else {
              
              resolve(res.data[0]);
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

  public findProjectList(source_company_id: string) {
    return new Promise((resolve, reject) => {
      axios.get(window['env'].apiBaseUrl + `/FindProjects?source_company_id=${source_company_id}&detail_level=all`, {
        validateStatus: (status) => {
          return status === 200 || status === 400
        }
      })
        .then(res => {
          if (res.status === 200) {
            if (res.data.length === 0) {
              reject('Project not found');
            } else {
              //TODO - TimeZone handling
              res.data = res.data.map((project) => {
                project['project_city_state'] = `${project['project_state']}, ${project['project_city']}`;
                return project;
              });
              
              resolve(res.data);
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


  public findCompanyContact(customer_id: any, company_id: any) {
    
    return new Promise((resolve, reject) => {
      axios.get(`${window['env'].apiBaseUrl}/FindContacts?customer_id=${customer_id}&company_id=${company_id}&detail_level=all`, {
        validateStatus: (status) => {
          return status === 200 || status === 400
        }
      })
        .then(res => {
          
          if (res.status === 200) {
            resolve(res.data);
            //TODO - TimeZone handling
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

  public findProjects(customer_id: string) {
    
    return new Promise((resolve, reject) => {
      axios.get(window['env'].apiBaseUrl + `/FindProjects?customer_id=${customer_id}&detail_level=admin`, {
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

  public createEventAttendee(params: any) {
    return new Promise((resolve, reject) => {
      axios.post(`${window['env'].apiBaseUrl}/CreateEventAttendee`, queryString.stringify(params), {
        validateStatus: (status) => {
          return status === 200 || status === 400
        }
      })
        .then(res => {
          if (res.status === 200) {
            resolve(res.data.event_attendee_id);
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

  public updateEventAttendee(event_attendee_id: string, params: any) {
    return new Promise((resolve, reject) => {
      params.search_event_attendee_id = event_attendee_id;

      axios.post(`${window['env'].apiBaseUrl}/UpdateEventAttendee`, queryString.stringify(params), {
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

  public findEventAttendees(calendar_event_id: string) {
    return new Promise((resolve, reject) => {
      axios.get(window['env'].apiBaseUrl + `/FindEventAttendees?calendar_event_id=${calendar_event_id}`, {
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
}
