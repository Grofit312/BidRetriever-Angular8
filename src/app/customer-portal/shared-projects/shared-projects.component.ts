import {
  Component,
  OnInit,
  HostListener,
  ElementRef,
  AfterViewInit,
  ViewChild,
} from "@angular/core";
import { ProjectSharingApi } from "../view-project/project-sharing/project-sharing.api.service";
import { NotificationsService } from "angular2-notifications";
import { DataStore } from "app/providers/datastore";
import CustomStore from "devextreme/data/custom_store";
import DataSource from "devextreme/data/data_source";
import { ProjectsApi } from "../my-projects/my-projects.api.service";
import { ViewProjectApi } from "../view-project/view-project.api.service";
import { AuthApi } from "app/providers/auth.api.service";
import { DestinationSettingsApi } from "app/customer-portal/system-settings/destination-system-settings/destination-system-settings.api.service";
import * as uuid from "uuid/v1";
import { AmazonService } from "app/providers/amazon.service";
import { NgxSpinnerService } from "ngx-spinner";
import DateTimeUtils from "app/utils/date-time";
import {
  DxDataGridComponent,
  DxToolbarComponent,
  DxSelectBoxComponent,
} from "devextreme-angular";
import { LoadOptions } from "devextreme/data/load_options";
const _ = require("lodash");

@Component({
  selector: "app-shared-projects",
  templateUrl: "./shared-projects.component.html",
  styleUrls: ["./shared-projects.component.scss"],
  providers: [
    ProjectSharingApi,
    ProjectsApi,
    ViewProjectApi,
    DestinationSettingsApi,
  ],
})
export class SharedProjectsComponent implements OnInit, AfterViewInit {
  //@ViewChild('grid', { static: true }) grid;
  @ViewChild("projectContent", { static: false }) projectContent: ElementRef;

  @ViewChild("projectGrid", { static: false }) projectGrid: DxDataGridComponent;
  @ViewChild("projectToolbar", { static: false })
  projectToolbar: DxToolbarComponent;
  @ViewChild("projectToolbarViewType", { static: false })
  projectToolbarViewType: DxSelectBoxComponent;

  projectViewMode = "my-user";

  private PROJECT_TOOLBAR_INITIAL_VIEW =
    "BidRetriever_Shared_Project_Toolbar_Initial_View";

  projectGridColumns: any[];
  projectGridDataSource: any;
  projectGridContent = [];
  projectGridContentLoaded = false;

  projectViewTypeSelected = "my-company";

  toolbarConfig: any = {};
  toolbarUsersSelectBox: any = null;
  toolbarUsersContent = [];
  selectedUserId = null;
  selectedCustomerId = null;
  searchWord = "";

  filterOptions = [
    { view_id: "my-user", view_name: "My Shared Projects" },
    { view_id: "my-office", view_name: "My Office Shared Projects" },
    { view_id: "my-company", view_name: "My Company Shared Projects" },
    { view_id: "archived", view_name: "Archived Shared Projects" },
    { view_id: "public", view_name: "Public Shared Projects" },
  ];

  rowData = null;

  get selectedSharedProject() {
    //const selectedProjects = this.grid.api.getSelectedRows();
    const { selectedRowKeys } = this.projectGrid;
    if (selectedRowKeys.length === 0) {
      this.notificationService.error(
        "No Selection",
        "Please select one project!",
        { timeOut: 3000, showProgressBar: false }
      );
      return;
    } else if (selectedRowKeys.length > 1) {
      this.notificationService.error(
        "Multiple Selection",
        "Please select just one project!",
        { timeOut: 3000, showProgressBar: false }
      );
      return;
    }
    const selectedRows = this.projectGridContent.filter(
      ({ project_id: projectId }) => selectedRowKeys.includes(projectId)
    );
    const selectedProjects = selectedRows[0];

    if (selectedProjects.length === 1) {
      return selectedProjects[0];
    }

    return null;
  }

  constructor(
    private _destinationSettingsApi: DestinationSettingsApi,
    public dataStore: DataStore,
    private notificationService: NotificationsService,
    private projectSharingApi: ProjectSharingApi,
    private projectApi: ProjectsApi,
    private authApiService: AuthApi,
    private viewProjectApi: ViewProjectApi,
    private amazonService: AmazonService,
    private spinner: NgxSpinnerService
  ) {
    this.toolbarConfig = {
      projectViewType: {
        width: 250,
        dataSource: new DataSource({
          store: new CustomStore({
            key: "view_id",
            loadMode: "raw",
            load: (loadOptions) =>
              this.toolbarProjectViewTypeLoadAction(loadOptions),
          }),
        }),
        showClearButton: false,
        valueExpr: "view_id",
        displayExpr: "view_name",
        onValueChanged: (event) => {
          if (this.projectViewTypeSelected !== event.value) {
            this.projectViewTypeSelected = event.value;
            localStorage.setItem(
              this.PROJECT_TOOLBAR_INITIAL_VIEW,
              this.projectViewTypeSelected == null
                ? ""
                : this.projectViewTypeSelected
            );
            this.toolbarRefreshGridAction();
          }
        },
      },
      search: {
        placeholder: "Search",
        width: 200,
        valueChangeEvent: "keyup",
        onValueChanged: (event) => this.toolbarSearchAction(event),
      },

      viewSharedProject: {
        type: "normal",
        toolbarSearchAction(event) {
          this.searchWord = event.value.toLowerCase();
          if (this.projectGrid && this.projectGrid.instance) {
            this.projectGrid.instance.refresh();
          }
        },
        text: "View Shared Project",
        onClick: () => this.toolbarViewSharedProjectAction(),
      },
      addToProject: {
        type: "normal",
        text: "Add to My Projects",
        onClick: () => this.toolbarAddToMyProjectAction(),
      },

      others: {
        viewSharedProject: {
          type: "normal",
          text: "View Shared Project",
          onClick: () => this.toolbarViewSharedProjectAction(),
        },
        addToProject: {
          type: "normal",
          text: "Add to My Projects",
          onClick: () => this.toolbarAddToMyProjectAction(),
        },
        viewSharedProjectFiles: {
          type: "normal",
          text: "View Shared Project Files",
          onClick: () => this.toolbarViewSharedProjectFilesAction(),
        },

        archiveSharedProject: {
          type: "normal",
          text: "Archive Shared Project",
          onClick: () => this.toolbarArchiveSharedProjectAction(),
        },

        deleteProject: {
          type: "normal",
          text: "Delete Project",
          onClick: () => this.toolbarDeleteSharedProjectAction(),
        },

        viewTransactionLog: {
          type: "normal",
          text: "View Transaction Log",
          onClick: () => this.toolbarViewTransactionLogAction(),
        },
        refreshGrid: {
          type: "normal",
          text: "Refresh Grid",
          onClick: () => this.toolbarRefreshGridAction(),
        },
        help: {
          type: "normal",
          text: "Help",
          onClick: () => this.toolbarHelpAction(),
        },
      },
    };

    this.projectGridDataSource = new CustomStore({
      key: "project_id",
      load: (loadOptions) => this.gridSharedProjectLoadAction(loadOptions),
    });
  }
  toolbarHelpAction() {
    throw new Error("Method not implemented.");
  }
  toolbarViewTransactionLogAction() {
    throw new Error("Method not implemented.");
  }
  /* Toolbar Search Action */
  toolbarSearchAction(event) {
    this.searchWord = event.value.toLowerCase();
    if (this.projectGrid && this.projectGrid.instance) {
      this.projectGrid.instance.refresh();
    }
  }
  gridSharedProjectLoadAction(loadOptions) {
    console.log("loadoptions", loadOptions);
    return new Promise((resolve, reject) => {
      if (this.projectGridContentLoaded) {
        const filteredProjects = this.getGridProjectContentByLoadOption(
          loadOptions
        );
        return resolve({
          data: filteredProjects,
          totalCount: filteredProjects.length,
        });
      }

      if (!this.dataStore.currentUser || !this.dataStore.currentCustomer) {
        this.dataStore.authenticationState.subscribe((v) => {
          if (v) {
            this.loadProjectGridContent().then(() => {
              const filteredProjects = this.getGridProjectContentByLoadOption(
                loadOptions
              );
              return resolve({
                data: filteredProjects,
                totalCount: filteredProjects.length,
              });
            });
          }
        });
      } else {
        this.loadProjectGridContent().then(() => {
          const filteredProjects = this.getGridProjectContentByLoadOption(
            loadOptions
          );
          return resolve({
            data: filteredProjects,
            totalCount: filteredProjects.length,
          });
        });
      }
    });
  }

  loadProjectGridContent() {
    const params = { detail_level: "admin" };

    if (this.projectViewTypeSelected === "my-user") {
      params["share_user_id"] = this.dataStore.currentUser["user_id"];
    } else if (this.projectViewTypeSelected === "my-office") {
      params["share_office_id"] = this.dataStore.currentUser[
        "customer_office_id"
      ];
    } else if (this.projectViewTypeSelected === "my-company") {
      params["share_company_id"] = this.dataStore.currentUser["customer_id"];
    } else if (this.projectViewTypeSelected === "public") {
      params["is_public"] = true;
    } else if (this.projectViewTypeSelected === "archived") {
      params["share_user_id"] = this.dataStore.currentUser["user_id"];
      params["status"] = "archived";
    }

    const findSharedProjects = this.projectSharingApi.findSharedProjects(
      params,
      this.dataStore.currentCustomer
        ? this.dataStore.currentCustomer["customer_timezone"] || "eastern"
        : "eastern"
    );

    return Promise.all([findSharedProjects])
      .then(([projects, dataViewFieldSettings]) => {
        this.rowData = _.uniqBy(projects, ({ project_id }) => project_id);

        if (this.projectViewMode !== "public") {
          this.rowData = this.rowData.filter(
            (sharedProject) => !sharedProject.public
          );
        }
        console.log("Shared Projects", projects);
        this.projectGridContent = projects as any[];
        this.projectGridContentLoaded = true;

        this.projectGridColumns = [
          {
            dataField: "project_id",
            dataType: "number",
            caption: "Project Id",
            width: 250,
            visible: false,
            allowEditing: false,
          },
          {
            dataField: "project_name",
            caption: "Project Name",
            width: 400,
            minWidth: 250,
            allowEditing: false,
          },
          {
            dataField: "share_source_user_email",
            caption: "Source",
            minWidth: 150,
            allowEditing: false,
          },
          {
            dataField: "share_source_company_name",
            caption: "Source Company",
            minWidth: 150,
            allowEditing: false,
          },
          {
            dataField: "project_bid_datetime",
            caption: "Bid Date/Time",
            minWidth: 150,
            cellTemplate: "dateCell",
            editCellTemplate: "dateTimeEditor",
            allowEditing: false,
          },
          {
            dataField: "project_city_state",
            caption: "State/City",
            width: 150,
            minWidth: 100,
            allowEditing: false,
          },
          {
            dataField: "share_user_office_name",
            caption: "Office",
            width: 150,
            minWidth: 100,
            editCellTemplate: "projectAssignedOfficeNameEditor",
            allowEditing: true,
          },
          {
            dataField: "create_datetime",
            caption: "Create Date",
            width: 180,
            minWidth: 150,
            dataType: "datetime",
            cellTemplate: "dateCell",
            allowEditing: false,
          },
          {
            dataField: "edit_datetime",
            caption: "Last Change Date",
            width: 150,
            minWidth: 100,
            dataType: "datetime",
            cellTemplate: "dateCell",
            allowEditing: false,
          },
        ];
      })
      .catch((error) => {
        console.log("Load Error", error);
        this.notificationService.error("Error", error, {
          timeOut: 3000,
          showProgressBar: false,
        });
      });
  }

  getGridProjectContentByLoadOption(loadOptions: any) {
    let sharedProjects = this.projectGridContent;

    let sortName = "project_bid_datetime";
    if (loadOptions.sort && loadOptions.sort.length > 0) {
      sortName = loadOptions.sort[0].selector;
    }

    sharedProjects = sharedProjects.sort((first, second) => {
      const sortColumnOption = this.projectGridColumns.find(
        (column) => column.dataField === sortName
      );

      let firstValue = first[sortName];
      let secondValue = second[sortName];

      if (sortColumnOption) {
        if (
          sortColumnOption.dataType === "date" ||
          sortColumnOption.dataType === "datetime"
        ) {
          firstValue = new Date(firstValue).getTime();
          secondValue = new Date(secondValue).getTime();
          firstValue = firstValue.toString().toLowerCase();
          secondValue = secondValue.toString().toLowerCase();
        }
      }

      if (!loadOptions.sort) {
        if (firstValue > secondValue) {
          return -1;
        } else return 1;
      }
      let loadOptionIndex = 0;
      while (loadOptionIndex < loadOptions.sort.length) {
        if (
          firstValue > secondValue &&
          loadOptions.sort[loadOptionIndex].desc
        ) {
          return -1;
        }
        if (
          firstValue < secondValue &&
          !loadOptions.sort[loadOptionIndex].desc
        ) {
          return -1;
        }
        if (firstValue === secondValue) {
          loadOptionIndex++;
          continue;
        }
        return 1;
      }
      return 1;
    });

    if (this.searchWord) {
      sharedProjects = sharedProjects.filter((project) => {
        const isMatched = Object.keys(project)
          .map((key) => project[key])
          .some((item) =>
            item.toString().toLowerCase().includes(this.searchWord)
          );
        return isMatched;
      });
    }
    return sharedProjects;
  }

  /* Delete Project(s) */
  toolbarDeleteSharedProjectAction() {
    const sharedProject = this.selectedSharedProject;

    if (sharedProject) {
      const params = {
        search_shared_project_id: sharedProject.shared_project_id,
        status: "deleted",
      };

      this.projectSharingApi
        .updateSharedProject(params)
        .then((res) => {
          this.load();
          this.notificationService.success(
            "Success",
            "Shared project deleted",
            { timeOut: 3000, showProgressBar: false }
          );
        })
        .catch((err) => {
          this.notificationService.error("Error", err, {
            timeOut: 3000,
            showProgressBar: false,
          });
        });
    } else {
      this.notificationService.error(
        "Error",
        "Please select a shared project",
        { timeOut: 3000, showProgressBar: false }
      );
    }
  }

  /* Archive Project(s) */
  toolbarArchiveSharedProjectAction() {
    const sharedProject = this.selectedSharedProject;
    const { selectedRowKeys } = this.projectGrid;
    if (selectedRowKeys.length === 0) {
      this.notificationService.error(
        "No Selection",
        "Please select one project!",
        { timeOut: 3000, showProgressBar: false }
      );
      return;
    } else if (selectedRowKeys.length > 1) {
      this.notificationService.error(
        "Multiple Selection",
        "Please select just one project!",
        { timeOut: 3000, showProgressBar: false }
      );
      return;
    }
    const selectedRows = this.projectGridContent.filter(
      ({ project_id: projectId }) => selectedRowKeys.includes(projectId)
    );

    if (sharedProject) {
      const params = {
        search_shared_project_id: sharedProject.shared_project_id,
        status: "archived",
      };

      this.projectSharingApi
        .updateSharedProject(params)
        .then((res) => {
          this.load();
          this.notificationService.success(
            "Success",
            "Shared project archived",
            { timeOut: 3000, showProgressBar: false }
          );
        })
        .catch((err) => {
          this.notificationService.error("Error", err, {
            timeOut: 3000,
            showProgressBar: false,
          });
        });
    } else {
      this.notificationService.error(
        "Error",
        "Please select a shared project",
        { timeOut: 3000, showProgressBar: false }
      );
    }
  }

  /* View Project Documents through doc viewer */
  toolbarViewSharedProjectFilesAction() {
    const sharedProject = this.selectedSharedProject;

    if (sharedProject) {
      this.projectApi
        .getPublishedLink(sharedProject["project_id"])
        .then((url: string) => {
          window.open(url, "_blank");
          //  window.open(`${window['env'].docViewerBaseUrl}?project_id=${selectedRows[0].project_id}&user_id=${userId}`, '_blank');
        })
        .catch((err) => {
          this.notificationService.error("Error", err, {
            timeOut: 3000,
            showProgressBar: false,
          });
        });
    } else {
      this.notificationService.error(
        "Error",
        "Please select a shared project",
        { timeOut: 3000, showProgressBar: false }
      );
    }
  }

  toolbarRefreshGridAction() {
    this.projectGridContentLoaded = false;
    if (this.projectGrid && this.projectGrid.instance) {
      this.projectGrid.instance.refresh();
    }
  }
  toolbarProjectViewTypeLoadAction(
    loadOptions: LoadOptions
  ): any[] | Promise<any> | JQueryPromise<any> {
    throw new Error("Method not implemented.");
  }

  ngOnInit() {
    this.getDataStore();
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
          console.log("Clear Token");
          this.notificationService.error("Error", err, {
            timeOut: 3000,
            showProgressBar: false,
          });

          localStorage.setItem("br_token", "");
          // const { user_id: userId } = this.route.snapshot.queryParams;
          // if (!userId) {
          //   this._router.navigate([ '/sign-in' ], { queryParams: { redirect_url: this._router.url } });
          //   return;
          // }
        });
    }
  }
  onChangeProjectViewMode() {
    this.load();
  }
  load() {
    const initialDataViewSelected = localStorage.getItem(
      this.PROJECT_TOOLBAR_INITIAL_VIEW
    );
    if (initialDataViewSelected) {
      this.projectViewTypeSelected = initialDataViewSelected;

      if (
        this.projectToolbarViewType &&
        this.projectToolbarViewType.instance &&
        this.projectViewTypeSelected
      ) {
        this.projectToolbarViewType.instance
          .getDataSource()
          .reload()
          .then((data) => {
            if (this.projectToolbar.instance) {
              this.projectToolbar.instance.repaint();
            }
          });
      }
    }
  }
  addProjectGridMenuItems(e) {
    if (!e.row) {
      return;
    }

    if (!e.row.data.project_bid_datetime) {
      e.row.data.project_bid_datetime = null;
    }

    e.component.selectRows([e.row.data.project_id]);

    if (e.row && e.row.rowType === "data") {
      // e.items can be undefined
      if (!e.items) {
        e.items = [];
      }

      e.items.push(
        {
          type: "normal",
          text: "View Shared Project",
          onClick: () => this.toolbarViewSharedProjectAction(),
        },
        {
          type: "normal",
          text: "Add to My Projects",
          onClick: () => this.toolbarAddToMyProjectAction(),
        },
        {
          type: "normal",
          text: "View Shared Project Files",
          onClick: () => this.toolbarViewSharedProjectFilesAction(),
        },
        {
          type: "normal",
          text: "Archive Shared Project",
          onClick: () => this.toolbarArchiveSharedProjectAction(),
        },
        {
          type: "normal",
          text: "Delete Project",
          onClick: () => this.toolbarDeleteSharedProjectAction(),
        },
        {
          type: "normal",
          text: "View Transaction Log",
          onClick: () => this.toolbarViewTransactionLogAction(),
        },
        {
          type: "normal",
          text: "Refresh Grid",
          onClick: () => this.toolbarRefreshGridAction(),
        },
        {
          type: "normal",
          text: "Help",
          onClick: () => this.toolbarHelpAction(),
        }
      );
    }
    return e;
  }

  ngAfterViewInit() {
    setTimeout(() => this.onWindowResize(null), 500);

    if (this.projectGrid && this.projectGrid.instance) {
      this.projectGrid.instance.columnOption(
        "command:select",
        "allowFixing",
        true
      );
    }
  }
  onWindowResize(event) {
    if (!this.projectContent) {
      return;
    }

    this.projectGrid.height = `${this.projectContent.nativeElement.offsetHeight}px`;
  }

  /* View project details */
  toolbarViewSharedProjectAction() {
    const { selectedRowKeys } = this.projectGrid;
    if (selectedRowKeys.length === 0) {
      this.notificationService.error(
        "No Selection",
        "Please select one project!",
        { timeOut: 3000, showProgressBar: false }
      );
      return;
    } else if (selectedRowKeys.length > 1) {
      this.notificationService.error(
        "Multiple Selection",
        "Please select just one project!",
        { timeOut: 3000, showProgressBar: false }
      );
      return;
    }
    const selectedRows = this.projectGridContent.filter(
      ({ project_id: projectId }) => selectedRowKeys.includes(projectId)
    );
    window.open(
      `/customer-portal/view-project/${selectedRows[0].project_id}/overview`,
      "_blank"
    );
  }

  /* Create Project */
  toolbarAddToMyProjectAction() {
    const { selectedRowKeys } = this.projectGrid;
    if (selectedRowKeys.length === 0) {
      this.notificationService.error(
        "No Selection",
        "Please select one project!",
        { timeOut: 3000, showProgressBar: false }
      );
      return;
    } else if (selectedRowKeys.length > 1) {
      this.notificationService.error(
        "Multiple Selection",
        "Please select just one project!",
        { timeOut: 3000, showProgressBar: false }
      );
      return;
    }
    const selectedRows = this.projectGridContent.filter(
      ({ project_id: projectId }) => selectedRowKeys.includes(projectId)
    );
    const sharedProject = selectedRows[0];

    if (sharedProject) {
      this.spinner.show();

      const { project_id } = sharedProject;
      const newProjectId = uuid();
      const newSubmissionId = uuid();
      const timezone =
        this.dataStore.currentCustomer["customer_timezone"] || "eastern";
      const submissionDateTime = DateTimeUtils.getTimestamp();
      const submissionName = DateTimeUtils.convertTimestampToUserTimezone(
        submissionDateTime,
        timezone
      );

      let originProject = {};

      this.viewProjectApi
        .getProject(project_id, "eastern")
        .then((project: any) => {
          originProject = project;
          return this.projectApi.createProject({
            project_admin_user_id: this.dataStore.currentUser["user_id"],
            project_name: project.project_name,
            project_id: newProjectId,
            project_address1: project.project_address1,
            project_address2: project.project_address2,
            project_city: project.project_city,
            project_state: project.project_state,
            project_zip: project.project_zip,
            project_country: project.project_country,
            project_desc: project.project_desc,
            project_service_area: project.project_service_area,
            project_number: project.project_number,
            project_bid_datetime: project.project_bid_datetime_origin,
            project_type: project.project_type,
            project_customer_id: this.dataStore.currentUser["customer_id"],
            auto_update_status: project.auto_update_status,
            customer_source_sys_id: project.customer_source_sys_id,
            project_timezone: timezone,
            source_url: project.source_url,
            source_username: project.source_username,
            source_password: project.source_password,
            source_token: project.source_token,
            source_sys_type_id: project.source_sys_type_id,
            project_notes: project.project_notes,
            project_rating: project.project_rating,
            project_award_status: project.project_award_status,
            project_building_type: project.project_building_type,
            project_contract_type: project.project_contract_type,
            project_construction_type: project.project_construction_type,
            project_labor_requirement: project.project_labor_requirement,
            project_segment: project.project_segment,
            project_size: project.project_size,
            project_stage: project.project_stage,
            project_value: project.project_value,
            source_company_id: project.source_company_id,
            source_user_id: project.source_user_id,
          });
        })
        .then((res) => {
          return this.projectApi.createProjectSubmission({
            user_id: this.dataStore.currentUser["user_id"],
            submitter_email: this.dataStore.currentUser["user_email"],
            submission_id: newSubmissionId,
            submission_name: submissionName,
            project_id: newProjectId,
            project_name: originProject["project_name"],
            customer_id: this.dataStore.currentUser["customer_id"],
            source_url: originProject["source_url"],
            source_sys_type_id: originProject["source_sys_type_id"],
            received_datetime: submissionDateTime,
            project_number: originProject["project_number"],
            user_timezone: timezone,
            submission_type: "shared_project",
          });
        })
        .then((res) => {
          return new Promise((resolve, reject) => {
            this._destinationSettingsApi
              .findCustomerDestination(this.dataStore.currentUser.customer_id)
              .then((res) => {
                return resolve(res);
              })
              .catch((err) => {
                this._destinationSettingsApi
                  .findCustomerDestination("TrialUser")
                  .then((trialRes) => {
                    return resolve(trialRes);
                  })
                  .catch((error) => {
                    return reject(error);
                  });
              });
          });
        })
        .then((res) => {
          return this.amazonService.createProjectRetrievalRecord({
            submission_id: newSubmissionId,
            destination_id: res["destination_id"],
            destination_path: res["destination_root_path"],
            destination_sys_type: res["destination_type_name"],
            source_url: originProject["project_id"],
            email_username: this.dataStore.currentUser["user_email"],
            submitter_email: this.dataStore.currentUser["user_email"],
            source_sys_type_id: "bidretriever",
            vault_bucket: this.amazonService.tempBucketName,
            process_status: "queued",
            project_name: originProject["project_name"],
            submission_type: "shared_project",
            submission_datetime: submissionDateTime,
            user_timezone: timezone,
            project_id: newProjectId,
            submitter_id: this.dataStore.currentUser["user_id"],
          });
        })
        .then((res) => {
          this.spinner.hide();
          this.notificationService.success(
            "Success",
            "Project has been added",
            { timeOut: 3000, showProgressBar: false }
          );
        })
        .catch((err) => {
          this.spinner.hide();
          this.notificationService.error("Error", err, {
            timeOut: 3000,
            showProgressBar: false,
          });
        });
    } else {
      this.notificationService.error(
        "Error",
        "Please select a shared project",
        { timeOut: 3000, showProgressBar: false }
      );
    }
  }
}
