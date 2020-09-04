export type Dashboard = {
  dashboard_id?: string;
  dashboard_name?: string;
  dashboard_status?: string;

  dashboard_start_datetime?: string;
  dashboard_end_datetime?: string;

  dashboard_template_id?: string;
  dashboard_template_type?: string;
  dashboard_version_number?: number;

  device_id?: string;
  office_id?: string;
  user_id?: string;
  customer_id: string;
  dashboard_file_key?: string;
  dashboard_file_bucketname?: string;

  create_datetime?: string;
  edit_datetime?: string;
  create_user_id?: string;
  edit_user_id?: string;
};

export type DashboardPanel = {
  panel_id: string;
  panel_name: string;
  panel_desc: string;
  panel_status: string;

  dashboard_id: string;
  panel_analytic_datasource: string;
  panel_analytic_datasource_interval: string;
  panel_chart_type: string;
  panel_column: string;
  panel_row: string;
  panel_start_datetime: string;
  panel_end_datetime: string;
  panel_start_date_offset: string;
  panel_end_date_offset: string;
  panel_width: string;
  panel_height: number;
  panel_time_interval: string;

  create_datetime?: string;
  edit_datetime?: string;
  create_user_id?: string;
  edit_user_id?: string;
};

export type AnalyticDatasource = {
  analytic_datasource_type: string;
  company_id: string;
  compatible_chart_types: string;
  customer_id: string;
  analytic_datasource_desc: string;
  analytic_datasource_enddatetime: string;
  analytic_datasource_id: string;
  analytic_datasource_interval: string;
  analytic_datasource_lambda_arn: string;
  analytic_datasource_name: string;
  analytic_datasource_sql: string;
  analytic_datasource_startdatetime: string;
  analytic_datasource_status: string;
  create_datetime: string;
  edit_datetime: string;
};
