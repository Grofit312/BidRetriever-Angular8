export enum EChartTypes {
  PieChart = "pie",
  BarChart = "bar",
}

export const ChartTypeLabels: Record<EChartTypes, string> = {
  [EChartTypes.PieChart]: "Pie Chart",
  [EChartTypes.BarChart]: "Bar Chart",
};

export const enum EIntervalTypes {
  // Week = "week",
  Month = "month",
  Quarter = "quarter",
  Year = "year",
}

export const IntervalTypeLabels: Record<EIntervalTypes, string> = {
  // [EIntervalTypes.Week]: "Week",
  [EIntervalTypes.Month]: "Month",
  [EIntervalTypes.Quarter]: "Quarter",
  [EIntervalTypes.Year]: "Year",
};

export type AnalyticDataResponse<T> = {
  bid_month: string;
} & T;
