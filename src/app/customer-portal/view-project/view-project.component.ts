import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { DataStore } from 'app/providers/datastore';
import { Router, ActivatedRoute } from '@angular/router';
import { ViewProjectApi } from 'app/customer-portal/view-project/view-project.api.service';
import { NotificationsService } from 'angular2-notifications';
import { Logger } from 'app/providers/logger.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-view-project',
  templateUrl: './view-project.component.html',
  styleUrls: ['./view-project.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ViewProjectComponent implements OnInit {
  projectName = ' ';
  projectDueDate = ' ';
  projectStatus = ' ';
  projectRating = 0;

  constructor(
    public dataStore: DataStore,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private apiService: ViewProjectApi,
    private notificationService: NotificationsService,
    private logger: Logger,
    private spinner: NgxSpinnerService,    
    private titleService: Title 
  ) {   
  }

  ngOnInit() {  
    debugger     
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
    debugger
    this.spinner.show();
    const projectId = this.activatedRoute.snapshot.params['project_id'];
    this.apiService.getProject(projectId,
      this.dataStore.currentCustomer ? (this.dataStore.currentCustomer['customer_timezone'] || 'eastern') : 'eastern')
      .then(res => {
        this.projectName = res['project_name'];
        this.projectStatus = res['status'];
        this.projectDueDate = res['project_bid_datetime'];
        this.projectRating = Number(res['project_rating']);

        this.dataStore.currentProject = res;
        this.dataStore.getProjectState.next(true);
        this.spinner.hide();       
          this.titleService.setTitle(this.projectName.substring(0,25));      
        console.log("Project Name",this.projectName)
       
      })
      .catch(err => {
        this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
      });

    this.logger.logActivity({
      activity_level: 'summary',
      activity_name: 'View Project Details',
      application_name: 'Customer Portal',
      customer_id: this.dataStore.currentUser.customer_id,
      user_id: this.dataStore.currentUser.user_id,
      project_id: projectId,
    });
  }
}
