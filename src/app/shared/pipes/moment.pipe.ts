import { PipeTransform, Pipe } from "@angular/core";
const moment = require('moment-timezone');

@Pipe({ name: 'moment' })
export class MomentPipe implements PipeTransform {
  transform(value: Date, dateFormat: string, timezone: string = null): any {
    if (!value) {
      return "";
    }
    if (!timezone) {
      return moment(value).tz(moment.tz.guess()).format(dateFormat);
    } else {
      return value;
    }
  }
}
