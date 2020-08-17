import { Component, OnInit, Input, EventEmitter, Output, ViewChild } from '@angular/core';
import { DxSelectBoxComponent } from 'devextreme-angular';

const moment = require('moment-timezone');
declare var jQuery: any;

@Component({
  selector: 'app-custom-datetime',
  templateUrl: './custom-datetime.component.html',
  styleUrls: [
    './custom-datetime.component.scss'
  ]
})
export class CustomDatetimeComponent implements OnInit {
  @ViewChild('timezoneSelectBox', { static: true }) timezoneSelectBox: DxSelectBoxComponent;

  @Input() name = '';
  @Input() showClearButton = false;
  @Input() type = 'datetime';
  @Input() value = null;

  @Output() onValueChanged = new EventEmitter<string>();

  availableTimeZones = [];

  timezone = null;

  constructor() {
    const timezones = moment.tz.names();
    this.availableTimeZones = timezones.filter((item) => item.startsWith('Canada/') || item.startsWith('US/'));
    const currentTimeZone = moment.tz.guess();
    if (this.availableTimeZones.indexOf(currentTimeZone) < 0) {
      this.availableTimeZones.push(currentTimeZone);
    }
  }

  ngOnInit() {
  }

  dateTimeOpenedAction(event) {
    this.timezone = moment.tz.guess();
    jQuery('.dx-overlay-content .dx-timeview > .dx-box-flex.dx-visibility-change-handler').append(this.timezoneSelectBox.instance.element());
  }

  dateTimeClosedAction(event) {
    console.log('TimeZone', this.timezone, this.value);
    // Convert the changed value to local timezone (current changed value is converted to utc time and returned)
    this.value = moment(this.value).tz(moment.tz.guess()).format('YYYY-MM-DD HH:mm:ss.SSSSSS');
    console.log(this.value);
    this.value = moment.tz(this.value, this.timezone).utc().format('YYYY-MM-DDTHH:mm:ss.SSSSSS') + 'Z';
    console.log(this.value);
    // Convert that utc time to timezone-specified time
    // Convert that timezone-specified time to utc time again.
    this.onValueChanged.emit(this.value);
  }

  dateBoxValueChangedAction(event) {
    if (event.event
      && event.event.currentTarget
      && event.event.currentTarget.className === 'dx-clear-button-area') {
      this.onValueChanged.emit(this.value);
    }
  }
}
