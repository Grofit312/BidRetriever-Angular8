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

export const generateRandomColor = (num: number, colors = 17) => {
  return `hsl(${(num * (360 / colors)) % 360},70%,60%)`;
};

const getQuoteMonth = (month: number) => month - (((month % 3) + 3) % 3);

export const calculateRangeByOffset = (
  interval: string,
  start_offset: number,
  end_offset: number
) => {
  const today = new Date();

  switch (interval) {
    case EIntervalTypes.Month:
      return [
        new Date(today.getFullYear(), today.getMonth() - start_offset),
        new Date(today.getFullYear(), today.getMonth() + end_offset + 1),
      ];

    case EIntervalTypes.Quarter:
      return [
        new Date(
          today.getFullYear(),
          getQuoteMonth(today.getMonth() - start_offset * 3)
        ),
        new Date(
          today.getFullYear(),
          getQuoteMonth(today.getMonth() + end_offset * 3 + 3)
        ),
      ];
      break;

    case EIntervalTypes.Year:
      return [
        new Date(today.getFullYear() - start_offset, 0),
        new Date(today.getFullYear() + end_offset + 1, 0),
      ];
  }

  return [today, today];
};
