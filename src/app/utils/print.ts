import * as printJS from "print-js";

export const printArray = (keys, arr: Array<any>) => {
  printJS({ printable: arr, properties: keys, type: "json" });
};
