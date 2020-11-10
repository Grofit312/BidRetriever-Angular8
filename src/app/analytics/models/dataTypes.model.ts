export enum EChartTypes {
  PieChart = "pie",
  BarChart = "bar",
}

export const ChartTypeLabels: Record<EChartTypes, string> = {
  [EChartTypes.PieChart]: "Pie Chart",
  [EChartTypes.BarChart]: "Bar Chart",
};

export enum EIntervalTypes {
  Day = "day",
  Week = "week",
  Month = "month",
  Quarter = "quarter",
  SemiYear = "semi-year",
  Year = "year",
}

export const IntervalTypeLabels: Record<EIntervalTypes, string> = {
  [EIntervalTypes.Day]: "Day",
  [EIntervalTypes.Week]: "Week",
  [EIntervalTypes.Month]: "Month",
  [EIntervalTypes.Quarter]: "Quarter",
  [EIntervalTypes.SemiYear]: "Semi-Year",
  [EIntervalTypes.Year]: "Year",
};

export type CompanyOverallBidHistoryResponse = {
  project_stage: string;
  total_stage: string;
};

export type OverallBidsReceivedResponse = {
  bid_month: string;
  total_invites: string;
};

export type OverallBidReceivedBySourceCompanyResponse = {
  bid_month: string;
  totalinvites: string;
  company_name: string;
};

export type OverallBidReceivedByProjectAdminResponse = {
  bid_month: string;
  totalinvites: string;
  user_displayname: string;
};

export type OverallBidsReceivedByOfficeResponse = {
  bid_month: string;
  totalinvites: string;
  office_name: string;
};

export type CompanyOverallValueResponse = {
  bid_month: string;
  total_value: string;
};

export type CompanyOverallInviteVolumeResponse = {
  bid_month: string;
  total_Invites: string;
};

export type AnalyticDataResponse =
  | CompanyOverallBidHistoryResponse[]
  | OverallBidsReceivedResponse[]
  | OverallBidReceivedByProjectAdminResponse[]
  | OverallBidsReceivedByOfficeResponse[]
  | CompanyOverallValueResponse[]
  | CompanyOverallInviteVolumeResponse[]
  | OverallBidReceivedBySourceCompanyResponse[];
