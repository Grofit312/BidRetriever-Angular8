import { Component, OnInit } from '@angular/core';
import { DataStore } from '../../../providers/datastore';
import { UserSettingsApi } from './customer-information.api.service';
import { NotificationsService } from 'angular2-notifications';
import { Logger } from 'app/providers/logger.service';

const addressParser = require('parse-address');
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();
const CircularJSON = require('circular-json');

@Component({
  selector: 'app-customer-portal-customer-information',
  templateUrl: './customer-information.component.html',
  styleUrls: ['./customer-information.component.scss'],
  providers: [UserSettingsApi]
})
export class CustomerInformationComponent implements OnInit {

  companyName = '';
  companyAddress = '';
  companyPhone = '';
  companyEmail = '';
  companyWebsite = '';
  companyTimezone = 'eastern';

  inputChanged = false;

  constructor(
    public dataStore: DataStore,
    private userSettingsApi: UserSettingsApi,
    private notificationService: NotificationsService,
    private loggerService: Logger
  ) { }

  ngOnInit() {
    if (this.dataStore.currentUser) {
      this.load();
    } else {
      this.dataStore.authenticationState.subscribe(value => {
        if (value) {
          this.load();
        }
      });
    }
  }

  load() {
    const customer = this.dataStore.currentCustomer;

    this.companyName = customer.customer_name;
    this.companyAddress = (`${customer.customer_address1} ${customer.customer_address2} ${customer.customer_city} `
                        + `${customer.customer_state} ${customer.customer_zip} ${customer.customer_country}`).trim();
    this.companyPhone = customer.customer_phone;
    this.companyEmail = customer.customer_email;
    this.companyWebsite = customer.company_website;
    this.companyTimezone = customer.customer_timezone;
  }

  onChangeInput() {
    this.inputChanged = true;
  }

  ngOnDestroy () {
    if (!this.inputChanged) {
      return;
    }

    const currentCustomer = this.dataStore.currentCustomer;
    let formattedPhone = this.companyPhone;
    let parsedAddress = null;

    try {
      parsedAddress = addressParser.parseAddress(this.companyAddress);
    }
    catch(err) {
      this.notificationService.alert('Warning', 'Failed to parse company address', { timeOut: 3000, showProgressBar: false });
    }

    try {
      formattedPhone = phoneUtil.formatInOriginalFormat(phoneUtil.parseAndKeepRawInput(this.companyPhone, 'US'), 'US');
    }
    catch(err) {
      this.notificationService.alert('Warning', 'Phone number cannot be formatted', { timeOut: 3000, showProgressBar: false });
    }

    if (parsedAddress) {
      currentCustomer.customer_address1 = `${parsedAddress.number || ''} ${parsedAddress.prefix || ''}`;
      currentCustomer.customer_address2 = `${parsedAddress.street || ''} ${parsedAddress.type || ''}`;
      currentCustomer.customer_city = parsedAddress.city || '';
      currentCustomer.customer_state = parsedAddress.state || '';
      currentCustomer.customer_zip = parsedAddress.zip || '';
      currentCustomer.customer_country = 'USA';
    }

    currentCustomer.customer_name = this.companyName;
    currentCustomer.customer_phone = formattedPhone;
    currentCustomer.customer_email = this.companyEmail;
    currentCustomer.company_website = this.companyWebsite;
    currentCustomer.customer_timezone = this.companyTimezone;

    this.userSettingsApi.updateCustomer(this.dataStore.currentCustomer.customer_id, {
      customer_name: currentCustomer.customer_name,
      customer_address1: currentCustomer.customer_address1,
      customer_address2: currentCustomer.customer_address2,
      customer_city: currentCustomer.customer_city,
      customer_state: currentCustomer.customer_state,
      customer_zip: currentCustomer.customer_zip,
      customer_country: currentCustomer.customer_country,
      customer_phone: currentCustomer.customer_phone,
      customer_email: currentCustomer.customer_email,
      customer_timezone: currentCustomer.customer_timezone,
      company_website: currentCustomer.company_website,
    })
    .then(res => {
      this.notificationService.success('Success', 'Updated user settings', { timeOut: 3000, showProgressBar: false });
      this.logTransaction('Completed', 'Successfully updated customer information', 'summary');
    })
    .catch(err => {
      this.notificationService.error('Error', 'Failed to update user settings', { timeOut: 3000, showProgressBar: false });
      this.logTransaction('Failed', CircularJSON.stringify(err), 'summary');
    });
  }

  logTransaction(status: string, description: string, transaction_level: string) {
    this.loggerService.logAppTransaction({
      routine_name: 'Customer Portal',
      operation_name: 'Update Customer Info',
      user_id: this.dataStore.currentUser['user_id'],
      customer_id: this.dataStore.currentUser['customer_id'],
      function_name: 'Update Customer Info',
      operation_status: status,
      operation_status_desc: description,
      transaction_level: transaction_level,
    });
  }
}
