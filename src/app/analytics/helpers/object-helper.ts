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
