import { Injectable } from '@angular/core';
import axios from 'axios';
import * as queryString from 'query-string';
const moment = require('moment-timezone');

@Injectable()
export class DataViewApiService {
  constructor() {
  }

  public createDataView(params: any) {
    return new Promise((resolve, reject) => {
      const currentDateTime = moment.utc().format('YYYY-MM-DDTHH:mm:ss.SSSSSS') + 'Z';
      params.create_datetime = currentDateTime;
      params.edit_datetime = currentDateTime;
      axios.post(`${(window as any).env.apiBaseUrl}/CreateDataView`, queryString.stringify(params), {
        validateStatus: (status) => status === 200 || status === 400
      }).then((res) => {
        if (res.status === 200) {
          return resolve(res.data.view_id);
        } else {
          return reject(res.data.status);
        }
      }).catch((error) => {
        return reject(error);
      });
    });
  }

  public createDataViewFieldSetting(params: any) {
    return new Promise((resolve, reject) => {
      const currentDateTime = moment.utc().format('YYYY-MM-DDTHH:mm:ss.SSSSSS') + 'Z';
      params.create_datetime = currentDateTime;
      params.edit_datetime = currentDateTime;
      params.status = 'active';
      params.data_view_field_format = 'Deprecated';
      axios.post(`${(window as any).env.apiBaseUrl}/CreateDataViewFieldSetting`, queryString.stringify(params), {
        validateStatus: (status) => status === 200 || status === 400
      }).then((res) => {
        if (res.status === 200) {
          return resolve(res.data.data_view_field_setting_id);
        } else {
          return reject(res.data.message);
        }
      }).catch((error) => {
        return reject(error);
      });
    });
  }

  public deleteDataViewFieldSetting(dataViewFieldSettingId: any) {
    return new Promise((resolve, reject) => {
      axios.post(`${(window as any).env.apiBaseUrl}/DeleteDataViewFieldSetting`, queryString.stringify({
        data_view_field_setting_id: dataViewFieldSettingId
      }), {
        validateStatus: (status) => status === 200 || status === 400
      }).then((res) => {
        if (res.status === 200) {
          return resolve(res.data.message);
        } else {
          return reject(res.data.message);
        }
      }).catch((error) => {
        return reject(error);
      });
    });
  }

  public findDataSources(customerId: string) {
    
    return new Promise((resolve, reject) => {
      axios.get(`${(window as any).env.apiBaseUrl}/FindDataSources?customer_id=${customerId}`, {
        validateStatus: (status) => status === 200 || status === 400
      }).then((res) => {
        if (res.status === 200) {
          return resolve(res.data);
        } else {
          return resolve([]);
        }
      }).catch((error) => {
        console.log('Find Data Sources', error);
        return reject('Failed to retrieve data sources');
      })
    });
  }

  public findDataViewFilters(filterParams) {
    return new Promise((resolve, reject) => {
      axios.get(`${(window as any).env.apiBaseUrl}/FindDataViewFilters?${queryString.stringify(filterParams)}`)
        .then((res) => {
          return resolve(res.data);
        })
        .catch((error) => {
          return reject(error);
        })
    });
  }

  public findDataViews(viewType: string, customerId: string = null) {
    return new Promise((resolve, reject) => {
      let url = `${window['env'].apiBaseUrl}/FindDataViews?view_type=${viewType}`;
      if (customerId) {
        url += `&customer_id=${customerId}`;
      }
      axios.get(url)
        .then((res) => {
          return resolve(res.data);
        })
        .catch((error) => {
          return reject(error);
        });
    });
  }

  public findDataViewFieldSettings(dataViewId: string) {
    return new Promise((resolve, reject) => {
      axios.get(`${(window as any).env.apiBaseUrl}/FindDataViewFieldSettings?data_view_id=${dataViewId}`, {
        validateStatus: (status) => status === 200 || status === 400
      }).then((res) => {
        if (res.status === 200) {
          return resolve(res.data);
        } else {
          return resolve([]);
        }
      }).catch((error) => {
        console.log('Find Data View Field Settings', error);
        return reject('Failed to retrieve data view field settings');
      })
    });
  }

  public retrieveDataSource(dataSourceId: string) {
    return new Promise((resolve, reject) => {
      axios.get(`${(window as any).env.apiBaseUrl}/GetDataSource?data_source_id=${dataSourceId}`, {
        validateStatus: (status) => status === 200 || status === 400
      }).then((res) => {
        if (res.status === 200) {
          return resolve(res.data);
        } else {
          return reject(res.data.status);
        }
      }).catch((error) => {
        console.log('Retrieve Data Source', error);
        return reject('Failed to retrieve data source');
      })
    })
  }

  public retrieveDataView(dataViewId: string) {
    return new Promise((resolve, reject) => {
      axios.get(`${(window as any).env.apiBaseUrl}/GetDataView?view_id=${dataViewId}`, {
        validateStatus: (status) => status === 200 || status === 400
      }).then((res) => {
        if (res.status === 200) {
          return resolve(res.data);
        } else {
          return reject('The data on the select view id is not existed');
        }
      }).catch((error) => {
        console.log('Retrieve Data View', error);
        return reject('Failed to retrieve data view');
      });
    });
  }

  public updateDataView(params: any) {
    return new Promise((resolve, reject) => {
      axios.post(`${(window as any).env.apiBaseUrl}/UpdateDataView`, queryString.stringify(params), {
        validateStatus: (status) => status === 200 || status === 400
      }).then((res) => {
        if (res.status === 200) {
          return resolve(res.data);
        } else {
          return reject(res.data.status);
        }
      }).catch((error) => {
        console.log('Update Data View', error);
        return reject('Failed to update the data view');
      })
    });
  }

  public updateDataViewFieldSetting(params: any) {
    return new Promise((resolve, reject) => {
      axios.post(`${(window as any).env.apiBaseUrl}/UpdateDataViewFieldSetting`, queryString.stringify(params), {
        validateStatus: (status) => status === 200 || status === 400
      }).then((res) => {
        if (res.status === 200) {
          return resolve(res.data);
        } else {
          return reject(res.data.status);
        }
      }).catch((error) => {
        console.log('Update Data View Field Setting', error);
        return reject('Failed to update the data view field setting');
      });
    });
  }
}
