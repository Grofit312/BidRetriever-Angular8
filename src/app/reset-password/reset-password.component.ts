import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { NotificationsService } from 'angular2-notifications';
import { AuthApi } from 'app/providers/auth.api.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
})
export class ResetPasswordComponent implements OnInit {

  password = '';
  showPassword = false;

  constructor(
    private _router: Router,
    private activatedRoute: ActivatedRoute,
    private notificationService: NotificationsService,
    private authApiService: AuthApi,
  ) { }

  ngOnInit() {
  }

  onResetPassword() {
    this.activatedRoute.queryParams.subscribe(params => {
      let token = params['token'];

      if (token) {
        this.authApiService.resetPassword(token, this.password)
          .then(res => {
            this.notificationService.success('Success', 'Password has been reset', { showProgressBar: false, timeOut: 3000 });
            this._router.navigate(['/sign-in']);
          })
          .catch(err => {
            this.notificationService.error('Error', err, { showProgressBar: false, timeOut: 3000 });
          });
      } else {
        this.notificationService.error('Error', 'Token is missing', { showProgressBar: false, timeOut: 3000 });
      }
    });
  }

  onTogglePasswordVisibility () {
    this.showPassword = !this.showPassword;
  }

}
