import { Component, OnInit } from '@angular/core';

import { NotificationsService } from 'angular2-notifications';
import { ChangeCompanyApi } from 'app/change-company/change-company.api.service';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-change-company',
  templateUrl: './change-company.component.html',
  styleUrls: ['./change-company.component.scss'],
  providers: [ChangeCompanyApi]
})
export class ChangeCompanyComponent implements OnInit {

  constructor(
    private activatedRoute: ActivatedRoute,
    private notificationService: NotificationsService,
    private router: Router,
    private changeCompanyApi: ChangeCompanyApi
  ) { }

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe(params => {
      let token = params['token'];

      if (token) {
        this.changeCompanyApi.changeCompany(token)
          .then(res => {
            this.notificationService.success('Success', 'Company has been updated', { showProgressBar: false, timeOut: 3000 });
            setTimeout(() => {
              window.close();
            }, 3000);
          })
          .catch(err => {
            this.notificationService.error('Error', err, { showProgressBar: false, timeOut: 3000 });
            this.router.navigate(['/sign-in']);
          });
      } else {
        this.notificationService.error('Error', 'Token is missing', { showProgressBar: false, timeOut: 3000 });
        this.router.navigate(['/sign-in']);
      }
    });
  }

}
