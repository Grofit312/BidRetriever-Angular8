import { Component, OnInit, ViewEncapsulation, ViewChild } from '@angular/core';
import { DataStore } from 'app/providers/datastore';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { ViewCompanyApi } from 'app/customer-portal/view-company/view-company.api.service';
import { NotificationsService } from 'angular2-notifications';
import { Logger } from 'app/providers/logger.service';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-view-company',
  templateUrl: './view-company.component.html',
  styleUrls: ['./view-company.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ViewCompanyComponent implements OnInit {
  companyId: any;
  projectName = ' ';
  projectDueDate = ' ';
  projectStatus = ' ';
  projectRating = 0;
  currentTab = 1;
  queryParams: Params = { };
  constructor(
    public dataStore: DataStore,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private apiService: ViewCompanyApi,
    private notificationService: NotificationsService,
    private logger: Logger,
    private titleService: Title 
  ) {
    this.companyId = this.activatedRoute.snapshot.params['company_id'];
   }

  ngOnInit() {
    const url = window.location.href;

    if (url.includes('overview')) {
      document.getElementById('tab-overview').click();
    } else if (url.includes('notes')) {
      document.getElementById('tab-notes').click();
    }
   this.load()
  }

  // ngOnDestroy() {
  //   this.dataStore.showPortalHeader = true;
  //   this.dataStore.currentCompany = {};
  // } 

  load() {
    const companyId = this.activatedRoute.snapshot.params['company_id'];

    this.apiService.getCompany(companyId,
      this.dataStore.currentCustomer ? (this.dataStore.currentCustomer['customer_timezone'] || 'eastern') : 'eastern')
      .then(res => {
        
        // this.projectDueDate = res['project_bid_datetime'];
        // this.projectRating = Number(res['project_rating']);
        console.log(" this.dataStore.res :", res[0])
        this.projectName = res[0]['company_name'];
        this.projectStatus = res[0]['company_status'];
        this.dataStore.currentCompany = res[0];
        this.titleService.setTitle(this.projectName.substring(0,25));      
        
        this.dataStore.getCompanyState.next(true);
      })
      .catch(err => {
        this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
      });

    // this.logger.logActivity({
    //   activity_level: 'summary',
    //   activity_name: 'View Company Details',
    //   application_name: 'Customer Portal',
    //   customer_id: this.dataStore.currentUser.customer_id,
    //   user_id: this.dataStore.currentUser.user_id,
    //   company_id: companyId,
    // });
  }

  onClickTab (index: number) {
    this.currentTab = index;
    const companyId = this.activatedRoute.snapshot.params['company_id'];
    this.queryParams = {'company_id': companyId};

    switch (index) {
      case 1:
        this.router.navigate([`/customer-portal/view-company/${companyId}/overview`], {queryParams: this.queryParams });
        break;     
      case 2:
        this.router.navigate([`/customer-portal/view-company/${companyId}/notes`], {queryParams: this.queryParams });
        break;
      case 3:
        this.router.navigate([`/customer-portal/view-company/${companyId}/projects`], {queryParams: this.queryParams });
        break;
    }
  }
  
  btnCloseAction() {
    window.close();
    // window.open(`/#/customer-portal`, '_blank');
  }
  // btnCloseAction() {
  //   this.router.navigate(['/customer-portal']);
  // }
}
