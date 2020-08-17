import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { TreeModel } from 'ng2-tree';
import { DataStore } from 'app/providers/datastore';
import { AmazonService } from 'app/providers/amazon.service';

import { NotificationsService } from 'angular2-notifications';
import * as uuid from 'uuid/v1';
import * as moment from 'moment';
import { NgxSpinnerService } from 'ngx-spinner';
import { ProjectsApi } from 'app/customer-portal/my-projects/my-projects.api.service';
import { FoldingType } from 'ng2-tree/src/tree.types';
import { DatePicker } from 'angular2-datetimepicker';
import { Logger } from 'app/providers/logger.service';
import { ValidationService } from 'app/providers/validation.service';
import { DestinationSettingsApi } from 'app/customer-portal/system-settings/destination-system-settings/destination-system-settings.api.service';
// const CircularJSON = require('circular-json');

@Component({
  selector: 'add-submission-modal',
  templateUrl: './add-submission-modal.component.html',
  styleUrls: ['./add-submission-modal.component.scss'],
  providers: [
    DestinationSettingsApi,
    ProjectsApi
  ],
})
export class AddSubmissionModalComponent implements OnInit {

  @ViewChild('addSubmissionModal', { static:false}) addSubmissionModal: ElementRef;
  @ViewChild('dropZone', { static:false}) dropZone: ElementRef;
  @ViewChild('treeZone', { static:false}) treeZone: ElementRef;

  fileTree: TreeModel = {
    value: '',
  };
  droppedFiles = [];

  parent = null;

  addSubmissionProjectId = '';
  addSubmissionProjectName = '';
  addSubmissionProjectNumber = '';
  addSubmissionName = '';
  addSubmissionEmail = '';
  addSubmissionTime = new Date();

  private _selectedProject = null;

  constructor(
    private _destinationSettingsApi: DestinationSettingsApi,
    public dataStore: DataStore,
    private amazonService: AmazonService,
    private notificationService: NotificationsService,
    private spinner: NgxSpinnerService,
    private apiService: ProjectsApi,
    private loggerService: Logger,
    private validationService: ValidationService,
  ) {
    DatePicker.prototype.ngOnInit = function() {
      this.settings = Object.assign(this.defaultSettings, this.settings);
      if (this.settings.defaultOpen) {
      this.popover = true;
      }
      this.date = new Date();
      };
  }

  ngOnInit() {
  }

  initialize(selectedProject: any, parent: any) {
    this.parent = parent;
    this.addSubmissionProjectId = selectedProject['project_id'];
    this.addSubmissionProjectName = selectedProject['project_name'];
    this.addSubmissionProjectNumber = selectedProject['project_number'];
    this.addSubmissionName = '';
    this.addSubmissionEmail = this.dataStore.currentUser.user_email;
    this.addSubmissionTime = new Date();
    this.droppedFiles = [];

    this._selectedProject = selectedProject;

    this.treeZone.nativeElement.style.display = 'none';
    this.dropZone.nativeElement.style.display = 'block';
    this.addSubmissionModal.nativeElement.style.display = 'block';
  }

  onSaveSubmission() {
    const submissionName = this.validationService.validateProjectName(this.addSubmissionName);

    if (!submissionName) {
      return this.notificationService.error('Error', 'Please input valid submission name', { timeOut: 3000, showProgressBar: false });
    }

    if (this.droppedFiles.length === 0) {
      return this.notificationService.error('No Files', 'Please upload files', { timeOut: 3000, showProgressBar: false });
    }

    // create project submission
    const submissionId = uuid();
    const submissionDateTime = moment(this.addSubmissionTime).utc().format('YYYY-MM-DDTHH:mm:ss.SSSSSS') + 'Z';
    const userTimezone = this.dataStore.currentCustomer ? (this.dataStore.currentCustomer['customer_timezone'] || 'eastern') : 'eastern';
    let hashValues = [];
    let docIDs = [];

    this.spinner.show();

    this.uploadDroppedFiles(submissionId)
      .then(res => {
        this.logTransaction('Upload submission files', 'Completed', `Uploaded ${this.droppedFiles.length} files`, submissionId, 'detail');

        return this.apiService.createProjectSubmission({
          user_id: this.dataStore.currentUser['user_id'],
          submitter_email: this.addSubmissionEmail,
          submission_id: submissionId,
          submission_name: submissionName,
          project_id: this.addSubmissionProjectId,
          project_name: this.addSubmissionProjectName,
          customer_id: this.dataStore.currentUser['customer_id'],
          received_datetime: submissionDateTime,
          project_number: this.addSubmissionProjectNumber,
          user_timezone: userTimezone,
          submission_type: 'user',
        });
      })
      .then(res => {
        this.logTransaction('Create project submission record', 'Completed', `Created project submission record`, submissionId, 'detail');

        return this.apiService.updateProjectStatus(this.addSubmissionProjectId, submissionId, 'Processing', 'Created');
      })
      .then(res => {
        return this.amazonService.createPublishJobRecord({
          submission_id: submissionId,
          process_status: 'queued',
          project_id: this.addSubmissionProjectId,
          project_name: this.addSubmissionProjectName,
          submission_type: 'user',
          submitter_email: this.addSubmissionEmail,
          user_timezone: userTimezone,
          process_attempts: 0,
          publish_datetime: submissionDateTime,
        });
      })
      .then(res => {
        this.logTransaction('Create publish job record', 'Completed', `Created 960 WIP table record`, submissionId, 'detail');

        return new Promise((resolve, reject) => {
          this._destinationSettingsApi.findCustomerDestination(this.dataStore.currentUser.customer_id)
            .then((res) => {
              return resolve(res);
            })
            .catch((err) => {
              this._destinationSettingsApi.findCustomerDestination('TrialUser')
                .then((trialRes) => {
                  return resolve(trialRes);
                })
                .catch((error) => {
                  return reject(error);
                })
            });
        });
      })
      .then(res => {
        let tasks = [];

        this.droppedFiles.forEach((droppedFile, index) => {
          let params = {
            customer_id: this.dataStore.currentCustomer.customer_id,
            customer_source_sys_id: this._selectedProject.customer_source_sys_id,
            destination_id: res['destination_id'],
            destination_path: res['destination_root_path'],
            destination_sys_type: res['destination_type_name'],
            email_file_key: '',
            // file_original_create_datetime: '',
            file_original_filename: droppedFile.filename,
            // file_original_modified_datetime: '',
            // message_id: '',
            original_filepath: droppedFile.filepath,
            process_attempts: 0,
            // process_end_datetime: '',
            process_status: 'queued',
            // process_start_datetime: '',
            project_id: this.addSubmissionProjectId,
            project_name: this.addSubmissionProjectName,
            project_number: this.addSubmissionProjectNumber,
            source_company_id: this._selectedProject.source_company_id,
            source_company_name: this._selectedProject.source_company_name,
            // source_company_url: '',
            // source_contact_email: '',
            // source_contact_firstname: '',
            // source_contact_lastname: '',
            // source_contact_id: '',
            // source_contact_phone: '',
            source_password: this._selectedProject.source_password,
            source_sys_type_id: this._selectedProject.source_sys_type_id,
            source_sys_type_name: this._selectedProject.source_sys_type_name,
            source_token: this._selectedProject.source_token,
            source_url: this._selectedProject.source_url,
            source_username: this._selectedProject.source_username,
            submission_datetime: submissionDateTime,
            submission_id: submissionId,
            submission_name: submissionName,
            submission_type: 'user',
            // submitter_device_ip: '',
            submitter_email: this.addSubmissionEmail,
            // submitter_ip: '',
            temp_bucket_name: this.amazonService.tempBucketName,
            temp_vault_key: droppedFile.filekey,
            // to_email_address: '',
            user_id: this.dataStore.currentUser.user_id,
            user_timezone: userTimezone,
            create_user_id: this.dataStore.currentUser.user_id,
            edit_user_id: this.dataStore.currentUser.user_id,
            id_922: uuid(),

            event_type: 'INSERT',
            processing_type: 'lambda'
          };

          tasks.push(this.amazonService.createFilePreprocessingRecord(params));
        });

        return Promise.all(tasks);
      })
      .then(res => {
        this.logTransaction('Create file preprocessing records', 'Completed', `Created 922 WIP table records`, submissionId, 'detail');

        return this.apiService.updateProjectStatus(this.addSubmissionProjectId, submissionId, 'Processing', 'Processing');
      })
      .then(res => {
        this.logTransaction('Add Submission', 'Completed', `Successfully created a submission`, submissionId, 'summary');

        this.spinner.hide();
        this.addSubmissionModal.nativeElement.style.display = 'none';
        this.parent.onRefresh();

        this.notificationService.success('Success', 'Project documents have been submitted', { timeOut: 3000, showProgressBar: false });
      })
      .catch(err => {
        this.spinner.hide();
        this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
        // this.logTransaction('Add Submission', 'Failed', CircularJSON.stringify(err), submissionId, 'detail');
      });
  }

  onCancelSubmission(event) {
    event.preventDefault();
    this.addSubmissionModal.nativeElement.style.display = 'none';
  }

  /* Drag And Drop */
  public onDragOverDropZone(event) {
    event.stopPropagation();
    event.preventDefault();
  }

  public onDropFiles(event) {
    event.preventDefault();

    var items = event.dataTransfer.items;
    var itemsCount = items.length;
    var processedItemsCount = 0;
    for (var i=0; i< itemsCount; i++) {
      var item = items[i].webkitGetAsEntry();
      if (item) {
        this.traverseFileTree(item, null, () => {
          processedItemsCount++;
          if (processedItemsCount === itemsCount) {
            this.fileTree = this.buildFileTree();
            this.dropZone.nativeElement.style.display = 'none';
            this.treeZone.nativeElement.style.display = 'block';
          }
        });
      } else {
        this.notificationService.error('Error', 'Failed to read file entry', { timeOut: 3000, showProgressBar: false });
      }
    }
  }

  private traverseFileTree(item, path = null, callback) {
    path = path || "";
    if (item.isFile) {
      // actually ignore .DS_Store from MAC
      if (item.name !== '.DS_Store') {
        item.path = path || '';
        item.filepath = item.path.length > 0 ? (item.path.substring(0, item.path.length - 1)) : '.';
        this.droppedFiles.push(item);
      }
      callback();
    } else if (item.isDirectory) {
      // Get folder contents
      var dirReader = item.createReader();

      this.readAllEntries(dirReader, (entries) => {
        if (entries.length === 0) {
          callback();
        } else {
          var count = 0;
          for (var i=0; i< entries.length; i++) {
            this.traverseFileTree(entries[i], path + item.name + "/", () => {
              count++;
              if (count === entries.length) {
                callback();
              }
            });
          }
        }
      });
    } else {
      callback();
    }
  }

  private readAllEntries = (dirReader, callback, allEntries = []) => {
    dirReader.readEntries((entries) => {
      if (entries.length === 0) {
        callback(allEntries);
      } else {
        allEntries = allEntries.concat(entries);
        this.readAllEntries(dirReader, callback, allEntries);
      }
    });
  }

  private buildFileTree() {
    var tree: TreeModel = {
      value: '[Root]',
      children: [],
    }

    this.droppedFiles.forEach((droppedFile) => {
      if (droppedFile.filepath === '.') {
        tree.children.push({
          value: droppedFile.name,
        });
      } else {
        let filePaths = droppedFile.filepath.split('/');
        var parentDirectory = tree;

        for (var index = 0; index < filePaths.length; index ++) {
          var directory: TreeModel = {
            value: filePaths[index],
            children: [],
            _foldingType: FoldingType.Collapsed,
          };

          var childsWithSameDirectoryName = parentDirectory.children.filter(child => {
            return child.value === directory.value
          });

          if (childsWithSameDirectoryName.length === 0) {
            parentDirectory.children.push(directory);
            parentDirectory = directory;
          } else {
            parentDirectory = childsWithSameDirectoryName[0];
          }
        }

        parentDirectory.children.push({
          value: droppedFile.name,
        });
      }
    });

    return tree;
  }

  private uploadDroppedFiles(submission_id) {
    return new Promise((resolve, reject) => {
      this.droppedFiles.reduce((p, item) => {
        return p.then(() => this.uploadDroppedFile(item, submission_id).catch(err => Promise.reject(err)));
      }, Promise.resolve())
      .then((res) => {
        resolve();
      })
      .catch(err => {
        this.droppedFiles = [];
        reject(err);
      });
    });
  }

  private uploadDroppedFile = (item, submission_id) => {
    return new Promise((resolve, reject) => {
      item.file((file) => {
        var reader = new FileReader();
        reader.onload = ((theFile) =>
          (e) => {
            const s3Key = `${submission_id}/${item.path}${this.timestamp()}_${file.name}`;

            item.filename = file.name;
            item.filepath = item.path.length > 0 ? (item.path.substring(0, item.path.length - 1)) : '.';
            item.filekey = s3Key;
            item.size = file.size;

            this.amazonService.uploadFile(e.target.result, s3Key)
              .then(res => {
                resolve();
              })
              .catch(err => {
                // this.logTransaction('Upload dropped file', 'Failed', `${item.filename} - ${CircularJSON.stringify(err)}`, submission_id, 'detail');
                reject(err);
              });
          }
        )(file);

        reader.onerror = (e) => {
          console.log(e);
          this.notificationService.error('Error', 'Failed to read dropped file', { timeOut: 3000, showProgressBar: false });

          reader.abort();
          reject(e);
        };

        reader.readAsArrayBuffer(file);
      }, (err) => {
        console.log(err.toString());
        this.notificationService.error('Error', 'Failed to read dropped file', { timeOut: 3000, showProgressBar: false });

        this.droppedFiles = this.droppedFiles.slice(0, this.droppedFiles.indexOf(item));

        reject(err);
      });
    });
  }

  logTransaction(operation: string, status: string, description: string, submission_id: string = '', transaction_level: string) {
    this.loggerService.logAppTransaction({
      routine_name: 'Customer Portal',
      function_name: 'Add Submission',
      user_id: this.dataStore.currentUser['user_id'],
      customer_id: this.dataStore.currentCustomer['customer_id'],
      operation_name: operation,
      operation_status: status,
      operation_status_desc: description,
      project_id: this.addSubmissionProjectId,
      submission_id: submission_id,
      transaction_level: transaction_level,
    });
  }

  isArchiveFile(filename: string) {
    const lastIndex = filename.lastIndexOf('.');

    if (lastIndex) {
      const extension = filename.substring(lastIndex + 1).toLowerCase();
      return ['zip', '7-zip', 'rar', '7z'].includes(extension);
    } else {
      return false;
    }
  }

  timestamp() {
    return moment().utc().format('YYYYMMDDHHmmssSSSSSS');
  }
}