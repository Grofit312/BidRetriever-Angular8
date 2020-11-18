import { EIntervalTypes } from "../models/dataTypes.model";

export const mergeObjectsByKey = (arr: any[], key: string): any[] => {
  return Object.values(
    arr.reduce((acc, cur) => {
      if (acc[cur[key]]) {
        acc[cur[key]] = { ...acc[cur[key]], ...cur };
      } else {
        acc[cur[key]] = cur;
      }
      return acc;
    }, {})
  );
};

const mapMonthToProperIntervalValue = (
  monthString: string,
  interval: string
): string => {
  const [year, month] = monthString.split("/");

  switch (interval) {
    case EIntervalTypes.Month:
      return `${year}/${month}`;

    case EIntervalTypes.Quarter:
      return `${year}/Q${Math.ceil(+month / 3)}`;

    case EIntervalTypes.Year:
      return year;
  }

  return "";
};

export const groupByTimeInterval = (
  arr: { bid_month: string; [i: string]: any }[],
  interval: string
): any[] => {
  return Object.values(
    arr
      .map((el) => ({
        ...el,
        bid_month: mapMonthToProperIntervalValue(el.bid_month, interval),
      }))
      .reduce((acc, cur) => {
        if (acc[cur.bid_month]) {
          Object.keys(cur)
            .filter((key) => key !== "bid_month")
            .forEach((key) => {
              if (acc[cur.bid_month][key]) {
                acc[cur.bid_month][key] += cur[key];
              } else {
                acc[cur.bid_month][key] = cur[key];
              }
            });
        } else {
          acc[cur.bid_month] = cur;
        }
        return acc;
      }, {})
  );
};

export const generateRandomColor = () => {
  var letters = "0123456789ABCDEF";
  var color = "#";
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};
