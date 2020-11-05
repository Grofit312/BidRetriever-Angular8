import { Component, OnInit, ViewChild } from '@angular/core';
import { DataStore } from 'app/providers/datastore';
import { ViewEmployeeApi } from '../view-employee.api.service';
import { MomentPipe } from 'app/shared/pipes/moment.pipe';
import { AmazonService } from 'app/providers/amazon.service';
import { Router, ActivatedRoute } from '@angular/router';

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
  @ViewChild("grid", { static: false }) grid;
  contactFirstname = ' ';
  contactCity = ' ';
  contactMobilePhone = ' ';
  contactPhone = ' ';
  contactEmail = ' ';
  contactStatus = ' ';
  rowData: { timestamp: any; name: string }[];
  
  
  aGridColumns = [];
activities = null;

  constructor(
    private _momentPipe: MomentPipe,
    public dataStore: DataStore,
    private viewEmployeeApi: ViewEmployeeApi,
    public activatedRoute: ActivatedRoute,
    private amazonService: AmazonService
  ) {
  }

  ngOnInit() {

  }
   
   onRefresh() {
    window.location.reload();
  }
}
