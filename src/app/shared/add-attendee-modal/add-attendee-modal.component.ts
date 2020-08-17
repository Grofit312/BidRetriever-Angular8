import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { AuthApi } from 'app/providers/auth.api.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { UserInfoApi } from 'app/customer-portal/system-settings/user-setup/user-setup.api.service';
import { NotificationsService } from 'angular2-notifications';
import * as uuid from 'uuid/v1';
const addressParser = require('parse-address');

@Component({
  selector: 'add-attendee-modal',
  templateUrl: './add-attendee-modal.component.html',
  styleUrls: ['./add-attendee-modal.component.scss'],
  providers: [UserInfoApi]
})
export class AddAttendeeModalComponent implements OnInit {
  @ViewChild('addAttendeeModal', { static: true }) addAttendeeModal: ElementRef;

  parent = null;
  email = '';
  firstName = '';
  lastName = '';
  companyName = '';
  companyAddress = '';
  required = true;
  isNewUser = false;
  userId = '';

  timer = null;

  constructor(
    private authApi: AuthApi,
    private userApi: UserInfoApi,
    private spinner: NgxSpinnerService,
    private notificationService: NotificationsService
  ) { }

  ngOnInit() {
  }

  initialize(parent: any) {
    this.parent = parent;
    this.addAttendeeModal.nativeElement.style.display = 'block';
  }

  onEmailChange(event: any) {
    if (this.timer) {
      clearTimeout(this.timer);
    }

    this.isNewUser = false;

    this.timer = setTimeout(() => {
      this.spinner.show();

      this.authApi.getUser(this.email)
        .then((user: any) => {
          // user already exists
          this.firstName = user.user_firstname;
          this.lastName = user.user_lastname;
          this.companyName = user.customer_name;
          this.userId = user.user_id;

          return user.customer_id ? this.authApi.getCustomer(user.customer_id) : new Promise(resolve => resolve());
        })
        .then((customer: any) => {
          if (customer) {
            this.companyAddress = `${customer.customer_address1} ${customer.customer_address2} ${customer.customer_city} `
            + `${customer.customer_state} ${customer.customer_zip} ${customer.customer_country}`;
          }

          this.spinner.hide();
        })
        .catch(err => {
          // user not exists
          this.isNewUser = true;
          this.firstName = '';
          this.lastName = '';
          this.companyName = '';
          this.companyAddress = '';
          this.userId = '';
          this.spinner.hide();
        });
    }, 1500);
  }

  onSaveAttendee() {
    if (!this.userId) {
      let customer_id = uuid();
      let user_id = uuid();
      const parsedAddress = this.parseAddress();

      // create user
      this.spinner.show();

      this.userApi.createCustomer({
        customer_id,
        customer_name: this.companyName,
        customer_admin_user_id: user_id,
        customer_address1: parsedAddress['customer_address1'] || '',
        customer_address2: parsedAddress['customer_address2'] || '',
        customer_city: parsedAddress['customer_city'] || '',
        customer_state: parsedAddress['customer_state'] || '',
        customer_zip: parsedAddress['customer_zip'] || '',
        customer_country: parsedAddress['customer_country'] || '',
      }).then(_ => {
        return this.userApi.createUser({
          user_id,
          user_email: this.email,
          user_firstname: this.firstName,
          user_lastname: this.lastName,
        });
      }).then(_ => {
        return this.userApi.addCompanyUser(user_id, customer_id);
      }).then(_ => {
        this.parent.addEventAttendee(user_id, this.email);

        this.spinner.hide();
        this.reset();
        this.addAttendeeModal.nativeElement.style.display = 'none';
      }).catch(err => {
        this.spinner.hide();
        this.notificationService.error('Error', 'Failed to create user', { timeOut: 3000, showProgressBar: false });
      });
    } else {
      this.parent.addEventAttendee(this.userId, this.email);

      this.reset();
      this.addAttendeeModal.nativeElement.style.display = 'none';
    }
  }

  onCancel(event) {
    event.preventDefault();

    this.reset();
    this.addAttendeeModal.nativeElement.style.display = 'none';
  }

  reset() {
    this.email = '';
    this.firstName = '';
    this.lastName = '';
    this.companyName = '';
    this.companyAddress = '';
    this.required = true;
    this.isNewUser = false;
    this.userId = '';
  }

  parseAddress() {
    let parsedAddress = null;
    const addressParts = {};

    try {
      parsedAddress = addressParser.parseAddress(this.companyAddress);
    } catch (_) {
      this.notificationService.alert('Warning', 'Failed to parse company address', { timeOut: 3000, showProgressBar: false });
    }

    if (parsedAddress) {
      addressParts['customer_address1'] = `${parsedAddress.number || ''} ${parsedAddress.prefix || ''}`;
      addressParts['customer_address2'] = `${parsedAddress.street || ''} ${parsedAddress.type || ''}`;
      addressParts['customer_city'] = parsedAddress.city || '';
      addressParts['customer_state'] = parsedAddress.state || '';
      addressParts['customer_zip'] = parsedAddress.zip || '';
      addressParts['customer_country'] = 'USA';
    }

    return addressParts;
  }
}
