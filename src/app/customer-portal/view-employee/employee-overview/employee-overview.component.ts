import { Component, OnInit, ViewChild } from '@angular/core';
import { DataStore } from 'app/providers/datastore';
import { ViewEmployeeApi } from '../view-employee.api.service';
import { ActivatedRoute } from '@angular/router';
import { MomentPipe } from 'app/shared/pipes/moment.pipe';
import { AmazonService } from 'app/providers/amazon.service';

@Component({
  selector: 'app-employee-overview',
  templateUrl: './employee-overview.component.html',
  styleUrls: ['./employee-overview.component.scss'],
  providers: [
    MomentPipe,
    AmazonService
  ]
})
export class EmployeeOverviewComponent implements OnInit {

  contactFirstname = ' ';
  contactCity = ' ';
  contactMobilePhone = ' ';
  contactPhone = ' ';
  contactEmail = ' ';
  contactStatus = ' ';

  constructor(
    private _momentPipe: MomentPipe,
    public dataStore: DataStore,
    private viewEmployeeApi: ViewEmployeeApi,
    public route: ActivatedRoute,
    private amazonService: AmazonService
  ) {
  }

  ngOnInit() {
  }
   
   onRefresh() {
    window.location.reload();
  }
}
