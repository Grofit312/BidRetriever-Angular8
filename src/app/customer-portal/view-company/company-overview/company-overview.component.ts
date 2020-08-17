import { Component, OnInit, ViewChild } from "@angular/core";
import { DataStore } from "app/providers/datastore";
import { MyCalendarApi } from "app/customer-portal/my-calendar/my-calendar.component.api.service";
import { NotificationsService } from "angular2-notifications";
import { ViewCompanyApi } from "../view-company.api.service";
import { ActivatedRoute } from "@angular/router";
import { MomentPipe } from "app/shared/pipes/moment.pipe";

@Component({
  selector: "app-company-overview",
  templateUrl: "./company-overview.component.html",
  styleUrls: ["./company-overview.component.scss"],
  providers: [MyCalendarApi, MomentPipe],
})
export class CompanyOverviewComponent implements OnInit {
  @ViewChild("editCompanyModal", { static: false }) editCompanyModal;
  @ViewChild('addEventModal', { static: false }) addEventModal;
  @ViewChild("grid", { static: false }) grid;
  lat = 51.678418;
  lng = 7.809007;

  noAddress = false;
  rowData: { timestamp: any; name: string; event: any }[];
  columnDefs = [
    {
      headerName: "Date",
      field: "timestamp",
      sortable: true,
      filter: true,
      resizable: true,
      editable: false,
      minWidth: 250,
    },
    {
      headerName: "Name",
      field: "name",
      sortable: true,
      filter: true,
      resizable: true,
      editable: false,
      minWidth: 250,
    },
  ];

  constructor(
    private _momentPipe: MomentPipe,
    public dataStore: DataStore,
    public calendarApi: MyCalendarApi,
    private viewProjectApi: ViewCompanyApi,

    private notificationService: NotificationsService,
    public route: ActivatedRoute
  ) {}

  ngOnInit() {
    console.log("dataStore ", this.dataStore);
    var that = this;
    setTimeout(function () {
      that.loadMap();
    }, 3000);
    if (this.dataStore.currentCompany) {
      this.loadInfo();
      if (this.route.snapshot.queryParams["status"] === "edit") {
        this.onEditCompany();
      }
    } else {
      this.dataStore.getCompanyState.subscribe((value) => {
        if (value) {
          this.loadInfo();

          if (this.route.snapshot.queryParams["status"] === "edit") {
            this.onEditCompany();
          }
        }
      });
    }
  }

  loadInfo() {
    debugger;
    this.loadMap();
    this.loadDates();
  }

  loadDates() {
    debugger;
    const companyDates = [
      {
        timestamp: this.dataStore.currentCompany["create_datetime"],
        name: "Company Created",
        event: null,
      },
      {
        timestamp: this.dataStore.currentCompany["edit_datetime"],
        name: "Company Edited",
        event: null,
      },
    ];

    this.calendarApi
      .findCalendarEvents(this.dataStore.currentCompany["company_id"], null)
      .then((events: any[]) => {
        events.forEach((event) => {
          companyDates.push({
            timestamp: event.calendar_event_start_datetime,
            name: event.calendar_event_name,
            event,
          });
        });

        companyDates.sort((prev, next) => {
          if (prev.timestamp < next.timestamp) {
            return -1;
          } else {
            return 1;
          }
        });

        this.rowData = companyDates.map((companyDate) => {
          return {
            timestamp: this._momentPipe.transform(
              companyDate.timestamp,
              "YYYY-MM-DD hh:mm a z"
            ),
            name: companyDate.name,
            event: companyDate.event,
          };
        });
      })
      .catch((err) => {
        this.notificationService.error("Error", err, {
          timeOut: 3000,
          showProgressBar: false,
        });
      });
  }

  onViewDocuments() {
    debugger
    const {
      currentUser: { user_id: userId },
    } = this.dataStore;
    window.open(
      `${window["env"].docViewerBaseUrl}?company_id=${this.dataStore.currentCompany["company_id"]}&user_id=${userId}&doc_id=unknown&folder_id=unknown&doc_type=normal`,
      "_blank"
    );
  }

  onAddCompanyEvent() {
    debugger
    this.addEventModal.initialize(
      this,
      {
        startDate: new Date(),
        endDate: new Date(),
        company_id: this.dataStore.currentCompany['company_id'],
      }
    );
  }

  onEditCompany() {
    this.editCompanyModal.initialize(this, this.dataStore.currentCompany);
  }

  onDeleteProject() {
    //this.removeProjectModal.initialize([this.dataStore.currentProject], true, this);
  }

  loadMap() {
    console.log(
      "this.dataStore.currentCompany.company_address :",
      this.dataStore.currentCompany
    );
    try {
      const geocoder = new window["google"].maps.Geocoder();
      geocoder.geocode(
        { address: this.dataStore.currentCompany.company_address1 },
        (res, status) => {
          if (status === window["google"].maps.GeocoderStatus.OK) {
            new window["google"].maps.Map(
              document.getElementById("google_map"),
              {
                center: res[0].geometry.location,
                zoom: 16,
              }
            );
          } else {
            this.noAddress = true;
          }
        }
      );
    } catch (err) {
      this.notificationService.error("Error", err, {
        timeOut: 3000,
        showProgressBar: false,
      });
    }
  }
  onRefresh() {
    window.location.reload();
  }

  onGridReady(params): void {
    params.api.sizeColumnsToFit();
  }
}
