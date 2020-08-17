import { Component, OnInit } from '@angular/core';
import { AuthApi } from 'app/providers/auth.api.service';
import { NotificationsService } from 'angular2-notifications';
import { Logger } from 'app/providers/logger.service';
import { ActivatedRoute, Router } from '@angular/router';
const CircularJSON = require('circular-json');

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
})
export class ForgotPasswordComponent implements OnInit {

  email = '';
  emailSent = false;

  constructor(
    private authApi: AuthApi,
    private notificationService: NotificationsService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private loggerService: Logger
  ) { }

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe(params => {
      this.email = params['email'] || '';
    });
  }

  onRequestReset() {
    this.authApi.forgotPassword(this.email)
      .then(res => {
        this.emailSent = true;
        this.logTransaction(this.email, 'Request password reset', 'Completed', 'Reset instruction sent via email', 'summary');
      })
      .catch(err => {
        this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
        this.logTransaction(this.email, 'Request password reset', 'Failed', CircularJSON.stringify(err), 'summary');
      });
  }

  onBackToSignIn() {
    this.router.navigate(['/sign-in']);
  }

  logTransaction(email: string, operation: string, status: string, description: string, transaction_level: string) {
    this.loggerService.logAppTransaction({
      routine_name: 'Customer Portal',
      operation_name: operation,
      function_name: 'Forgot Password',
      operation_status: status,
      operation_status_desc: description,
      operation_data: email,
      transaction_level: transaction_level,
    });
  }
}
