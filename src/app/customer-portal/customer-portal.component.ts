import { Component, OnInit, ViewEncapsulation, ViewChild } from '@angular/core';
import { DataStore } from 'app/providers/datastore';
import { AuthApi } from 'app/providers/auth.api.service';

import { NotificationsService } from 'angular2-notifications';
import { Router, ActivatedRoute } from '@angular/router';
import initHelpHero from 'helphero';
import { Logger } from 'app/providers/logger.service';

@Component({
  selector: 'app-customer-portal',
  templateUrl: './customer-portal.component.html',
  styleUrls: ['./customer-portal.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class CustomerPortalComponent implements OnInit {
  environment = '';
  welcomeMessage = '';
  mainTabs = [];
  menus = [];
  selectedTabIndex = 0;

  get showBannerLogo() {
    return this._router.url.includes('view-project');
  }

  constructor(
    public dataStore: DataStore,
    private authApiService: AuthApi,
    private notificationService: NotificationsService,
    private logger: Logger,
    private _router: Router,
    public route: ActivatedRoute
  ) {
    this.environment = window['env']['BR_ENVIRONMENT'];
    console.log('Environment', this.environment);

    this.mainTabs = [
      {
        id: 'my-projects',
        text: 'My Projects'
      },
      {
        id: 'shared-projects',
        text: 'Shared Projects'
      },
      {
        id: 'my-companies',
        text: 'My Companies'
      },
      {
        id: 'my-calendar',
        text: 'My Calendar'
      },
      {
        id: 'my-settings',
        text: 'My Settings'
      },
      {
        id: 'system-settings',
        text: 'System Settings'
      },
      {
        id: 'all-submissions',
        text: 'Project Log'
      },
      {
        id: 'click-to-install-desktop-sync',
        text: 'Click To Install Desktop Sync',
        disabled: true
      }
    ];

    this.menus = [];

    const firstPageKey = this._router.url.split('/')[2];
    this.selectedTabIndex = this.mainTabs.findIndex(({id}) => id === firstPageKey);
  }

  ngOnInit() {
    if (!localStorage.getItem('br_token')) {
      const { user_id: userId } = this.route.snapshot.queryParams;
      if (!userId) {
        this._router.navigate([ '/sign-in' ], { queryParams: { redirect_url: this._router.url } });
      }

      // Check if the user is already registered user.
      this.authApiService.getUserById(userId)
        .then((res: any) => {
          const { user_password: userPassword } = res;
          if (userPassword === 'existed') {
            this._router.navigate([ '/sign-in' ], { queryParams: { redirect_url: this._router.url } });
            return;
          }

          this._router.navigate([ '/sign-up' ], { queryParams: { redirect_url: this._router.url } });
        }).catch (error => {
          this._router.navigate([ '/sign-in' ], { queryParams: { redirect_url: this._router.url } });
        });
      return;
    }

    if (this.dataStore.currentUser) {
      this.dataStore.originUserId = this.dataStore.currentUser['user_id'];
      this.dataStore.originUserEmail = this.dataStore.currentUser['user_email'];
      this.dataStore.originUserRole = this.dataStore.currentUser['user_role'];
      this.load();
      return;
    }

    this.authApiService.authenticate(localStorage.getItem('br_token'))
      .then((res: any) => {
        const user = res.user;

        if (!user.customer_id) {
          return new Promise((resolve, reject) => reject('This is trial user.'));
        }

        if (user.user_role === 'submitter') {
          return new Promise((resolve, reject) => reject('This is not admin user.'));
        }

        localStorage.setItem('br_token', user.token);
        this.dataStore.currentUser = user;
        this.dataStore.originUserId = user['user_id'];
        this.dataStore.originUserEmail = user['user_email'];
        this.dataStore.originUserRole = user['user_role'];
        this.load();

        this.logger.logActivity({
          activity_level: 'summary',
          activity_name: 'User Login/Access',
          application_name: 'Customer Portal',
          customer_id: user.customer_id,
          user_id: user.user_id,
        });

        return this.authApiService.getCustomer(user.customer_id);
      })
      .then((customer: any) => {
        this.dataStore.currentCustomer = customer;
        this.dataStore.authenticationState.next(true);
      })
      .catch(err => {
        console.log('Clear Token');
        this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });

        localStorage.setItem('br_token', '');
        const { user_id: userId } = this.route.snapshot.queryParams;
        if (!userId) {
          this._router.navigate([ '/sign-in' ], { queryParams: { redirect_url: this._router.url } });
          return;
        }

        // Check if the user is already registered user.
        this.authApiService.getUserById(userId).then((res: any) => {
          const { user_password: userPassword } = res;
          if (userPassword === 'existed') {
            this._router.navigate([ '/sign-in' ], { queryParams: { redirect_url: this._router.url } });
            return;
          }

          this._router.navigate([ '/sign-up' ], { queryParams: { redirect_url: this._router.url } });
        }).catch (error => {
          this._router.navigate([ '/sign-in' ], { queryParams: { redirect_url: this._router.url } });
        });
      });
  }

  load() {
    const firstName = this.dataStore.currentUser.user_firstname || '';
    const lastName = this.dataStore.currentUser.user_lastname || '';
    this.welcomeMessage = `Welcome, ${firstName} ${lastName}`;
    this.menus.push({
      id: "1",
      name: this.welcomeMessage,
      items: [{
        id: "1_1",
        name: "Log out"
      }]
    });

    const helpHero = initHelpHero(window['env']['helpHeroAppId']);
    helpHero.identify(this.dataStore.originUserId);
  }

  btnLogoutAction() {
    localStorage.setItem('br_token', '');

    this._router.navigate(['/sign-in']);
  }

  menuItemClickAction(event) {
    switch (event.itemData.id) {
      case "1_1":
        this.btnLogoutAction();
        break;
    }
  }

  tabSelectAction(tabPanel) {
    this.selectedTabIndex = this.mainTabs.indexOf(tabPanel.addedItems[0]);
    this._router.navigateByUrl(`customer-portal/${tabPanel.addedItems[0].id}`);
  }
}
