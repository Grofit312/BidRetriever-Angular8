export enum EChartTypes {
  PieChart = "pie",
  StackedBarChart = "bar",
  SeriesBarChart = "grouped bar",
}

export const ChartTypeLabels: Record<EChartTypes, string> = {
  [EChartTypes.PieChart]: "Pie Chart",
  [EChartTypes.StackedBarChart]: "Stacked Bar Chart",
  [EChartTypes.SeriesBarChart]: "Series Bar Chart",
};

export const enum EIntervalTypes {
  // Week = "week",
  Month = "month",
  Quarter = "quarter",
  Year = "year",
}

export const AvailableOffsetOptions = {
  [EIntervalTypes.Month]: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24],
  [EIntervalTypes.Quarter]: [1, 2, 3, 4, 5, 6, 7, 8],
  [EIntervalTypes.Year]: [1, 2, 3, 4, 5, 6],
};

export const IntervalTypeLabels: Record<EIntervalTypes, string> = {
  // [EIntervalTypes.Week]: "Week",
  [EIntervalTypes.Month]: "Month",
  [EIntervalTypes.Quarter]: "Quarter",
  [EIntervalTypes.Year]: "Year",
};

export type AnalyticDataResponse<T> = {
  bid_month: string;
} & T;
