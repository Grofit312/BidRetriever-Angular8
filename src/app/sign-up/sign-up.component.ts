import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { NotificationsService } from 'angular2-notifications';
import { AuthApi } from '../providers/auth.api.service';
import { DataStore } from '../providers/datastore';
import { Logger } from 'app/providers/logger.service';
const CircularJSON = require('circular-json');

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.scss'],
})
export class SignUpComponent implements OnInit {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyName: string;
  showPassword = false;

  constructor(
    private _router: Router,
    private notificationService: NotificationsService,
    private authApiService: AuthApi,
    public dataStore: DataStore,
    private loggerService: Logger,
    public route: ActivatedRoute
  ) { }

  ngOnInit() {
  }

  onSignup () {
    this.authApiService.register(this.email, this.password, this.firstName, this.lastName, this.companyName)
      .then((res: any) => {
        let user = res.user;

        this.dataStore.currentUser = user;
        localStorage.setItem('br_token', user.token);

        return this.authApiService.getCustomer(user.customer_id);
      })
      .then((customer: any) => {
        this.dataStore.currentCustomer = customer;

        this.notificationService.success('Success', 'Successfully registered', { timeOut: 3000, showProgressBar: false });
        this.logTransaction(this.email, 'Sign up', 'Completed', `User <${this.email}> successfully registered`, 'transaction');

        const { redirect_url: redirectUrl } = this.route.snapshot.queryParams;
        if (redirectUrl) {
          this._router.navigateByUrl(redirectUrl);
        } else {
          this._router.navigateByUrl('/customer-portal');
        }
      })
      .catch(err => {
        this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
        this.logTransaction(this.email, 'Sign up', 'Failed', CircularJSON.stringify(err), 'transaction');
      });
  }

  onTogglePasswordVisibility () {
    this.showPassword = !this.showPassword;
  }

  logTransaction(email: string, operation: string, status: string, description: string, transaction_level: string) {
    this.loggerService.logAppTransaction({
      routine_name: 'Customer Portal',
      operation_name: operation,
      function_name: 'Sign up',
      operation_status: status,
      operation_status_desc: description,
      operation_data: email,
      transaction_level: transaction_level,
    });
  }
}
