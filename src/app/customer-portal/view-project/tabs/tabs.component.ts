import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { DataStore } from 'app/providers/datastore';
const querystring = require('query-string');

@Component({
  selector: 'view-project-tabs',
  templateUrl: './tabs.component.html',
  styleUrls: ['./tabs.component.scss']
})
export class TabsComponent implements OnInit {
  currentTab = 1;

  get isSharedProject() {
    return this.dataStore.isSharedProject;
  }

  get isBidRetrieverUser() {
    return this.dataStore.isBidRetrieverUser;
  }

  constructor(
    private _router: Router,
    private activatedRoute: ActivatedRoute,
    public dataStore: DataStore,
  ) { }

  ngOnInit() {
    const url = window.location.href;

    if (url.includes('overview')) {
      document.getElementById('tab-overview').click();
    } else if (url.includes('files')) {
      document.getElementById('tab-files').click();
    } else if (url.includes('view-submission')) {
      document.getElementById('tab-view-submissions').click();
    } else if (url.includes('notifications')) {
      document.getElementById('tab-notifications').click();
    } else if (url.includes('administration')) {
      document.getElementById('tab-administration').click();
    } else if (url.includes('internal')) {
      document.getElementById('tab-internal').click();
    } else if (url.includes('source')) {
      document.getElementById('tab-source').click();
    } else if (url.includes('sharing')) {
      document.getElementById('tab-sharing').click();
    } else if (url.includes('project-notes')) {
      document.getElementById('tab-project-notes').click();
    } else {
      document.getElementById('tab-overview').click();
    }
  }

  onClickTab (index: number) {
    this.currentTab = index;

    const projectId = this.activatedRoute.snapshot.params['project_id'];
    const queryParams = this.activatedRoute.snapshot.queryParams;

    switch (index) {
      case 1:
        this._router.navigate([`/customer-portal/view-project/${projectId}/overview`], { queryParams });
        break;

      case 2:
        this._router.navigate([`/customer-portal/view-project/${projectId}/files`], { queryParams });
        break;

      case 3:
      const { submission_id } = querystring.parse(location.search);

      if (submission_id) {
        localStorage.setItem('submission_id', submission_id);
      }

      this._router.navigate([`/customer-portal/view-project/${projectId}/view-submission`], { queryParams });
      break;

      case 4:
      this._router.navigate([`/customer-portal/view-project/${projectId}/notifications`], { queryParams });
      break;

      case 5:
      this._router.navigate([`/customer-portal/view-project/${projectId}/source`], { queryParams });
      break;

      case 6:
      this._router.navigate([`/customer-portal/view-project/${projectId}/sharing`], { queryParams });
      break;

      case 7:
      this._router.navigate([`/customer-portal/view-project/${projectId}/administration`]);
      break;

      case 8:
        this._router.navigate([`/customer-portal/view-project/${projectId}/project-notes`]);
        break;

      case 9:
      this._router.navigate([`/customer-portal/view-project/${projectId}/internal`]);
      break;

      default:
      this._router.navigate([`/customer-portal/view-project/${projectId}/overview`]);
      break;
    }
  }
}
