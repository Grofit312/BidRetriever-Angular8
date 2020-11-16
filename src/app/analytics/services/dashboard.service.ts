import { Injectable } from "@angular/core";
import { DatePipe } from "@angular/common";
import { HttpClient, HttpParams } from "@angular/common/http";

import { Observable } from "rxjs";

import { generateFormData } from "../helpers/form-helper";
import {
  Dashboard,
  DashboardPanel,
  AnalyticDatasource,
} from "../models/dashboard.model";
import { Response } from "../models/response.model";
import { AnalyticDataResponse } from "../models/dataTypes.model";

@Injectable({
  providedIn: "root",
})
export class DashboardService {
  public analyticDatasources: AnalyticDatasource[] = null;

  constructor(private http: HttpClient, private datePipe: DatePipe) {}

  createDashboard(
    params: Partial<Dashboard>
  ): Observable<Response<{ dashboard_id: string }>> {
    const url = `${window["env"].apiBaseUrl}/CreateDashboard`;

    const currentDateTime =
      this.datePipe.transform(new Date(), "yyyy-MM-ddTHH:mm:ss.SSSSSS", "UTC") +
      "Z";
    params.create_datetime = currentDateTime;
    params.edit_datetime = currentDateTime;
    params.dashboard_status = "active";

    return this.http.post<Response<{ dashboard_id: string }>>(
      url,
      generateFormData(params)
    );
  }

  findDashboards(
    userId: string,
    customerId: string = "default",
    officeId?: string,
    deviceId?: string
  ): Observable<Dashboard[]> {
    const url = `${window["env"].apiBaseUrl}/FindDashboards`;

    let params = new HttpParams();
    if (userId) {
      params = params.append("user_id", userId);
    }
    if (customerId) {
      params = params.append("customer_id", customerId);
    }
    if (officeId) {
      params = params.append("office_id", officeId);
    }
    if (deviceId) {
      params = params.append("device_id", deviceId);
    }
    params = params.append("dashboard_status", "active");

    return this.http.get<Dashboard[]>(url, { params });
  }

  getDashboard(dashboardId: string): Observable<Dashboard> {
    const url = `${window["env"].apiBaseUrl}/GetDashboard`;

    let params = new HttpParams();
    params = params.append("dashboard_id", dashboardId);

    return this.http.get<Dashboard>(url, { params });
  }

  updateDashboard(dashboardId: string, params: Partial<Dashboard>) {
    const url = `${window["env"].apiBaseUrl}/UpdateDashboard`;

    const currentDateTime =
      this.datePipe.transform(new Date(), "yyyy-MM-ddTHH:mm:ss.SSSSSS") + "Z";

    return this.http.post(
      url,
      generateFormData({ ...params, search_dashboard_id: dashboardId })
    );
  }

  createDashboardPanel(
    params: Partial<DashboardPanel>
  ): Observable<Response<{ panel_id: string }>> {
    const url = `${window["env"].apiBaseUrl}/CreateDashboardPanel`;

    const currentDateTime =
      this.datePipe.transform(new Date(), "yyyy-MM-ddTHH:mm:ss.SSSSSS") + "Z";
    params.create_datetime = currentDateTime;
    params.edit_datetime = currentDateTime;
    params.panel_status = "active";

    return this.http.post<Response<{ panel_id: string }>>(
      url,
      generateFormData(params)
    );
  }

  findDashboardPanels(
    dashboardId?: string,
    userId?: string,
    customerId?: string,
    officeId?: string,
    deviceId?: string
  ): Observable<DashboardPanel[]> {
    const url = `${window["env"].apiBaseUrl}/FindDashboardPanels`;

    let params = new HttpParams();
    if (userId) {
      params = params.append("user_id", userId);
    }
    if (customerId) {
      params = params.append("customer_id", customerId);
    }
    if (officeId) {
      params = params.append("office_id", officeId);
    }
    if (deviceId) {
      params = params.append("device_id", deviceId);
    }
    if (dashboardId) {
      params = params.append("dashboard_id", dashboardId);
    }
    params = params.append("panel_status", "active");

    return this.http.get<DashboardPanel[]>(url, { params });
  }

  getDashboardPanel(panelId: string): Observable<DashboardPanel> {
    const url = `${window["env"].apiBaseUrl}/GetDashboardPanel`;

    let params = new HttpParams();
    params = params.append("panel_id", panelId);

    return this.http.get<DashboardPanel>(url, { params });
  }

  updateDashboardPanel(panelId: string, params: Partial<DashboardPanel>) {
    const url = `${window["env"].apiBaseUrl}/UpdateDashboardPanel`;

    return this.http.post(
      url,
      generateFormData({ ...params, search_panel_id: panelId })
    );
  }

  executeAnalyticDatasource({
    customer_id,
    company_id,
    analytic_datasource_id,
    analytic_datasource_interval,
    analytic_datasource_startdatetime,
    analytic_datasource_enddatetime,
  }): Observable<AnalyticDataResponse<any>[]> {
    const url = `${window["env"].apiBaseUrl}/ExecuteAnalyticDatasource`;

    let params = new HttpParams();
    params = params.append("customer_id", customer_id);
    params = params.append("company_id", company_id);
    params = params.append(
      "analytic_datasource_interval",
      analytic_datasource_interval
    );
    params = params.append("analytic_datasource_id", analytic_datasource_id);
    params = params.append(
      "analytic_datasource_startdatetime",
      analytic_datasource_startdatetime
    );
    params = params.append(
      "analytic_datasource_enddatetime",
      analytic_datasource_enddatetime
    );

    return this.http.get<AnalyticDataResponse<any>[]>(url, { params });
  }

  findAnalyticDatasources(
    customerId: string,
    analyticDatasourceType: string
  ): Observable<AnalyticDatasource[]> {
    const url = `${window["env"].apiBaseUrl}/FindAnalyticDatasources`;

    let params = new HttpParams();
    params = params.append("customer_id", customerId);
    params = params.append("analytic_datasource_type", analyticDatasourceType);

    return this.http.get<AnalyticDatasource[]>(url, { params });
  }
}
