import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { NotificationsService } from 'angular2-notifications';
import { AuthApi } from '../providers/auth.api.service';
import { DataStore } from '../providers/datastore';
import { Location } from '@angular/common';
import { Logger } from 'app/providers/logger.service';
const CircularJSON = require('circular-json');

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.scss'],
})
export class SignInComponent implements OnInit {

  email: string;
  password: string;
  showPassword = false;

  constructor(
    private _location: Location,
    private _router: Router,
    private notificationService: NotificationsService,
    private authApiService: AuthApi,
    public dataStore: DataStore,
    private route: ActivatedRoute,
    private loggerService: Logger
  ) { }

  ngOnInit() {
  }

  onLogin () {
    debugger
    this.authApiService.login(this.email, this.password)
      .then((res: any) => {
        const user = res.user;

        if (!user.customer_id) {
          return new Promise((resolve, reject) => reject('This is trial user.'));
        }

        if (user.user_role === 'submitter') {
          // tslint:disable-next-line:max-line-length
          const userSetupGuide = 'http://bidretriever.net/user-setup.html';
          const message = `The user attempting to login, has not been assigned a license. Please contact the company administrator and have them use the System Settings to assign a license for this user. Click Here for More information (${userSetupGuide})`;
          const alert = this.notificationService.error('Login Failed', message, { timeOut: 8000, showProgressBar: false });
          alert.click.subscribe(() => {
            window.open(userSetupGuide, '_blank');
          });

          return new Promise((resolve, reject) => reject());
        }

        this.dataStore.currentUser = user;
        localStorage.setItem('br_token', user.token);

        return this.authApiService.getCustomer(user.customer_id);
      })
      .then((customer: any) => {
        this.dataStore.currentCustomer = customer;

        this.notificationService.success('Success', 'Successfully logged in', { timeOut: 3000, showProgressBar: false });
        this.logTransaction(this.email, 'Login', 'Completed', `<${this.email}> successfully logged in`, 'transaction');

        const { redirect_url: redirectUrl } = this.route.snapshot.queryParams;
        if (redirectUrl) {
          this._router.navigateByUrl(redirectUrl);
        } else {
          this._router.navigateByUrl('/customer-portal');
        }
      })
      .catch(err => {
        if (err) {
          this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
          this.logTransaction(this.email, 'Login', 'Failed', CircularJSON.stringify(err), 'transaction');
        }
      });
  }

  onRegisterAction() {
    const { redirect_url: redirectUrl } = this.route.snapshot.queryParams;
    if (redirectUrl) {
      this._router.navigateByUrl(`/sign-up?redirect_url=${redirectUrl}`);
    } else {
      this._router.navigateByUrl('/sign-up');
    }
  }

  onTogglePasswordVisibility () {
    this.showPassword = !this.showPassword;
  }

  logTransaction(email: string, operation: string, status: string, description: string, transaction_level: string) {
    this.loggerService.logAppTransaction({
      routine_name: 'Customer Portal',
      operation_name: operation,
      function_name: 'Login',
      operation_status: status,
      operation_status_desc: description,
      operation_data: email,
      transaction_level: transaction_level,
    });
  }
}
