import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { DataStore } from 'app/providers/datastore';
import { Router, ActivatedRoute } from '@angular/router';
import { ViewEmployeeApi } from 'app/customer-portal/view-employee/view-employee.api.service';
import { NotificationsService } from 'angular2-notifications';
import { Logger } from 'app/providers/logger.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { Title } from '@angular/platform-browser';
import { AuthApi } from 'app/providers/auth.api.service';

@Component({
  selector: 'app-view-employee',
  templateUrl: './view-employee.component.html',
  styleUrls: ['./view-employee.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ViewEmployeeComponent implements OnInit {
  contactFirstname = ' ';
  contactLastname = ' ';
  contactCity = ' ';
  contactMobilePhone = ' ';
  contactPhone = ' ';
  contactEmail = ' ';
  contactStatus = ' ';
  
  constructor(   
    public dataStore: DataStore,
    private authApiService: AuthApi,
    private _router: Router,
    public route: ActivatedRoute,
    private activatedRoute: ActivatedRoute,
    private apiService: ViewEmployeeApi,
    private notificationService: NotificationsService,
    private logger: Logger,
    private spinner: NgxSpinnerService,    
    private titleService: Title 
    ) {
      
    }

  ngOnInit() {
    this.getDataStore();
    this.dataStore.showPortalHeader = false;   
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
   
  ngOnDestroy() {
    this.dataStore.showPortalHeader = true;
    this.dataStore.currentProject = {};
  }

  btnCloseAction() {
    window.close();
  }

  load() {
    this.spinner.show();
    const contactId = this.activatedRoute.snapshot.params['contact_id'];
    this.apiService.getEmployee(contactId,
      this.dataStore.currentCustomer ? (this.dataStore.currentCustomer['customer_timezone'] || 'eastern') : 'eastern')
      .then(res => {
        
        this.contactFirstname = res[0]['contact_firstname'];
        this.contactLastname = res[0]['contact_lastname'];
        this.contactMobilePhone = res[0]['contact_mobile_phone'];
        this.contactPhone = res[0]['contact_phone'];
        this.contactEmail = res[0]['contact_email'];
        this.contactStatus = res[0]['contact_status'];

        
         
        
        this.dataStore.currentContact = res[0];
        this.dataStore.getContactState.next(true);
        this.spinner.hide();       
        this.titleService.setTitle(this.contactFirstname.substring(0,25));      
      })
      .catch(err => {
        this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
      });

    this.logger.logActivity({
      activity_level: 'summary',
      activity_name: 'View Employee Details',
      application_name: 'Customer Portal',
      customer_id: this.dataStore.currentUser.customer_id,
      user_id: this.dataStore.currentUser.user_id,
      employee_id: contactId,
    });
  }
    
  getDataStore(){
    if (!localStorage.getItem('br_token')) {
      
    this.authApiService.authenticate(localStorage.getItem('br_token'))
      .then((res: any) => {
        const user = res.user;
        localStorage.setItem('br_token', user.token);
        this.dataStore.currentUser = user;
        this.dataStore.originUserId = user['user_id'];
        this.dataStore.originUserEmail = user['user_email'];
        this.dataStore.originUserRole = user['user_role'];
        return this.authApiService.getCustomer(user.customer_id);
      })
      .then((customer: any) => {
        this.dataStore.currentCustomer = customer;
        this.dataStore.authenticationState.next(true);
      })
      .catch(err => {
        this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });

        localStorage.setItem('br_token', '');
        const { user_id: userId } = this.route.snapshot.queryParams;
        if (!userId) {
          this._router.navigate([ '/sign-in' ], { queryParams: { redirect_url: this._router.url } });
          return;
        }

      });
    };
  }
}
