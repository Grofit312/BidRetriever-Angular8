import { Component, OnInit, ViewEncapsulation } from "@angular/core";
import { DataStore } from "app/providers/datastore";
import { Router, ActivatedRoute } from "@angular/router";
import { ViewProjectApi } from "app/customer-portal/view-project/view-project.api.service";
import { NotificationsService } from "angular2-notifications";
import { Logger } from "app/providers/logger.service";
import { NgxSpinnerService } from "ngx-spinner";
import { Title } from "@angular/platform-browser";
import { AuthApi } from "app/providers/auth.api.service";
import { ProjectsApi } from "../my-projects/my-projects.api.service";

@Component({
  selector: "app-view-project",
  templateUrl: "./view-project.component.html",
  styleUrls: ["./view-project.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class ViewProjectComponent implements OnInit {
  projectId = null;
  projectName = " ";
  projectDueDate = " ";
  projectStatus = " ";
  projectRating = 0;

  constructor(
    public dataStore: DataStore,
    private authApiService: AuthApi,
    private _router: Router,
    public route: ActivatedRoute,
    private activatedRoute: ActivatedRoute,
    private apiService: ViewProjectApi,
    private projectsApi: ProjectsApi,
    private notificationService: NotificationsService,
    private logger: Logger,
    private spinner: NgxSpinnerService,
    private titleService: Title
  ) {}

  ngOnInit() {
    this.getDataStore();
    this.dataStore.showPortalHeader = false;
    if (this.dataStore.currentUser) {
      this.load();
    } else {
      this.dataStore.authenticationState.subscribe((value) => {
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
    this.projectId = this.activatedRoute.snapshot.params["project_id"];
    this.apiService
      .getProject(
        this.projectId,
        this.dataStore.currentCustomer
          ? this.dataStore.currentCustomer["customer_timezone"] || "eastern"
          : "eastern"
      )
      .then((res) => {
        this.projectName = res["project_name"];
        this.projectStatus = res["status"];
        this.projectDueDate = res["project_bid_datetime"];
        this.projectRating = Number(res["project_rating"]);
        this.dataStore.currentProject = res;
        this.dataStore.getProjectState.next(true);
        this.spinner.hide();
        this.titleService.setTitle(this.projectName.substring(0, 25));
      })
      .catch((err) => {
        this.notificationService.error("Error", err, {
          timeOut: 3000,
          showProgressBar: false,
        });
      });

    this.logger.logActivity({
      activity_level: "summary",
      activity_name: "View Project Details",
      application_name: "Customer Portal",
      customer_id: this.dataStore.currentUser.customer_id,
      user_id: this.dataStore.currentUser.user_id,
      project_id: this.projectId,
    });
  }

  getDataStore() {
    if (!localStorage.getItem("br_token")) {
      this.authApiService
        .authenticate(localStorage.getItem("br_token"))
        .then((res: any) => {
          const user = res.user;
          localStorage.setItem("br_token", user.token);
          this.dataStore.currentUser = user;
          this.dataStore.originUserId = user["user_id"];
          this.dataStore.originUserEmail = user["user_email"];
          this.dataStore.originUserRole = user["user_role"];
          return this.authApiService.getCustomer(user.customer_id);
        })
        .then((customer: any) => {
          this.dataStore.currentCustomer = customer;
          this.dataStore.authenticationState.next(true);
        })
        .catch((err) => {
          this.notificationService.error("Error", err, {
            timeOut: 3000,
            showProgressBar: false,
          });

          localStorage.setItem("br_token", "");
          const { user_id: userId } = this.route.snapshot.queryParams;
          if (!userId) {
            this._router.navigate(["/sign-in"], {
              queryParams: { redirect_url: this._router.url },
            });
            return;
          }
        });
    }
  }

  onRate(e: number) {
    this.projectsApi
      .updateProject(this.projectId, {
        project_rating: e,
      })
      .then(() => {
        this.load();
      });
  }
}
