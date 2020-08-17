const moment = require('moment-timezone');

export default class DateTimeUtils {
  static getTimestamp() {
    return moment().utc().format('YYYY-MM-DDTHH:mm:ss.SSSSSS') + 'Z';
  }

  static convertTimestampToUserTimezone(timestamp: string, timezone = 'eastern') {
    return this.convertToUserTimeZone(timestamp, timezone).format('YYYY-MM-DD_HH-mm');
  }

  static convertToUserTimeZone(utcDateTime, timezone) {
    const datetime = moment(utcDateTime);

    switch (timezone) {
      case 'eastern':
      return datetime.tz('America/New_York');

      case 'central':
      return datetime.tz('America/Chicago');

      case 'mountain':
      return datetime.tz('America/Denver');

      case 'pacific':
      return datetime.tz('America/Los_Angeles');

      case 'Non US Timezone':
      return datetime.utc();

      case 'utc':
      return datetime.utc();

      default:
      return datetime.utc();
    }
  }
}
