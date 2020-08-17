import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ProjectsApi } from 'app/customer-portal/my-projects/my-projects.api.service';

import { NotificationsService } from 'angular2-notifications';
import { Logger } from 'app/providers/logger.service';
import { DataStore } from 'app/providers/datastore';

@Component({
  selector: 'remove-project-modal',
  templateUrl: './remove-project-modal.component.html',
  styleUrls: ['./remove-project-modal.component.scss']
})
export class RemoveProjectModalComponent implements OnInit {

  @ViewChild('removeProjectModal', { static:false}) removeProjectModal: ElementRef;

  parent = null;
  selectedProjects = [];
  isDeleting = true;
  modalTitle = '';

  constructor(
    private projectsApi: ProjectsApi,
    private notificationService: NotificationsService,
    private loggerService: Logger,
    public dataStore: DataStore,
  ) { }

  ngOnInit() {
  }

  initialize(selectedProjects: any[], isDeleting: boolean, parent: any) {
    this.parent = parent;
    this.selectedProjects = selectedProjects;
    this.isDeleting = isDeleting;

    const projectNames = selectedProjects.map(project => project['project_name']).join(', ');

    this.modalTitle = `Are you sure you want to ${isDeleting ? 'delete' : 'archive'} the following project(s): ${projectNames}`;

    this.removeProjectModal.nativeElement.style.display = 'block';
  }

  onCancel() {
    this.removeProjectModal.nativeElement.style.display = 'none';
  }

  onYes() {
    const status = this.isDeleting ? 'deleted' : 'archived';
    const projectRemoveTasks = this.selectedProjects.map(project => this.projectsApi.updateProject(project['project_id'], { status: status }));

    Promise.all(projectRemoveTasks)
      .then(res => {
        this.removeProjectModal.nativeElement.style.display = 'none';
        this.parent.onRefresh();

        this.notificationService.success(this.isDeleting ? 'Delete Project' : 'Archive Project', `Successfully ${status} ${this.selectedProjects.length} project(s).`, { timeOut: 3000, showProgressBar: false });

        // Log transaction
        this.logTransaction('Completed', 'summary');
      })
      .catch(err => {
        this.removeProjectModal.nativeElement.style.display = 'none';
        this.parent.onRefresh();

        this.notificationService.success(this.isDeleting ? 'Delete Project' : 'Archive Project', `Failed to update project status.`, { timeOut: 3000, showProgressBar: false });

        // Log transaction
        this.logTransaction('Failed', 'summary');
      });
  }

  logTransaction(status: string, transaction_level: string) {
    const operationName = `${this.isDeleting ? 'Delete' : 'Archive'} Project`;

    this.loggerService.logAppTransaction({
      routine_name: 'Customer Portal',
      function_name: operationName,
      user_id: this.dataStore.currentUser['user_id'],
      customer_id: this.dataStore.currentCustomer['customer_id'],
      operation_name: operationName,
      operation_status: status,
      operation_status_desc: this.selectedProjects.map(project => project['project_name']).join(', '),
      transaction_level: transaction_level,
    });
  }
}
