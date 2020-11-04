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

export type SourceCompanyOverallBidHistoryResponse = {
  project_stage: string;
  total_stage: string;
};

export type SourceCompanyOverallInviteVolumeResponse = {
  bid_month: {
    AssemblyName: string;
    Data: any;
    UnityType: number;
  };
  total_invites: string;
};

export type AnalyticDataResponse =
  | SourceCompanyOverallBidHistoryResponse[]
  | SourceCompanyOverallInviteVolumeResponse[];
