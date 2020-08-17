import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { DataStore } from '../../../providers/datastore';
import { DocumentSettingsApi } from './document-settings.api.service';
import { NotificationsService } from 'angular2-notifications';

import { Logger } from 'app/providers/logger.service';
const CircularJSON = require('circular-json');

@Component({
  selector: 'app-customer-portal-document-settings',
  templateUrl: './document-settings.component.html',
  styleUrls: ['./document-settings.component.scss'],
  providers: [DocumentSettingsApi]
})
export class DocumentSettingsComponent implements OnInit {

  readonly SETTINGS_GROUP = 'Document Settings';

  readonly REVISIONING_TYPE_ID = 'revisioning_type';
  readonly REVISIONING_TYPE_NAME = 'Revisioning Type';
  readonly REVISIONING_TYPE_DESCRIPTION = 'The revisioning type defines the text that will be added to a filename to indicate that it is a revision of the original file. The default is the date and time that that the file was submitted.';

  readonly PLAN_FILE_NAMING_ID = 'plan_file_naming';
  readonly PLAN_FILE_NAMING_NAME = 'Plan File Naming';
  readonly PLAN_FILE_NAMING_DESCRIPTION = 'The plan file naming setting defines how drawing files will be named once they are processed into individual sheets. The detail is the sheet number + submission date.';

  readonly SOURCE_FILE_SUBMISSION_FOLDER_ID = 'source_file_submission_folder';
  readonly SOURCE_FILE_SUBMISSION_FOLDER_NAME = 'Source File Submission Folders';
  readonly SOURCE_FILE_SUBMISSION_FOLDER_DESCRIPTION = 'The Source File Submission Folders are created on each date that a file change is detected on the source system. These folders provide a list of which files were released or changed on which dates.';

  readonly CURRENT_PLANS_FOLDER_ID = 'current_plans_folder';
  readonly CURRENT_PLANS_FOLDER_NAME = 'Current Plans Folder';
  readonly CURRENT_PLANS_FOLDER_DESCRIPTION = 'The current plans folder setting defines if Bid Retriever will create a folder called "Current Plans" in the destination system that contains only the latest drawings.';

  readonly ALL_PLANS_FOLDER_ID = 'all_plans_folder';
  readonly ALL_PLANS_FOLDER_NAME = 'All Plans Folder';
  readonly ALL_PLANS_FOLDER_DESCRIPTION = 'The all plans folder setting defines if Bid Retriever will create a folder called "All Plans" in the destination system that contains all plans and all revisions of the project plans.';

  readonly ALL_PLANS_SUBMISSION_FOLDER_ID = 'all_plans_submission_folder';
  readonly ALL_PLANS_SUBMISSION_FOLDER_NAME = 'All Plans Submission Folder';
  readonly ALL_PLANS_SUBMISSION_FOLDER_DESCRIPTION = 'The all plans submission folder setting defines if Bid Retriever will create folders under the "All Plans" folder that contains the plans that changed on each submission to Bid Retriever.';

  readonly COMPARISON_PLAN_FOLDER_ID = 'comparison_plans_folder';
  readonly COMPARISON_PLAN_FOLDER_NAME = 'Comparison Plan Folder';
  readonly COMPARISON_PLAN_FOLDER_DESCRIPTION = 'The Comparison Drawing Folder setting allows the user to define if the comparison files are placed in the submission folder, or placed in a separate folder.'

  readonly DISCIPLINE_PLAN_FOLDER_ID = 'discipline_plans_folder';
  readonly DISCIPLINE_PLAN_FOLDER_NAME = 'Discipline Plan Folder';
  readonly DISCIPLINE_PLAN_FOLDER_DESCRIPTION = 'The Discipline Folder Setting defines if the "All Plans" and "Current Plans" folder are separated into subfolders for each major discipline.';

  readonly RASTER_PLAN_FOLDER_ID = 'raster_plans_folder';
  readonly RASTER_PLAN_FOLDER_NAME = 'Raster Plan Folder';
  readonly RASTER_PLAN_FOLDER_DESCRIPTION = 'The Raster Output Folder Setting defines if "All Raster Plans" folder are placed in under the "All Plans" folder, or in a separate folder under the project.';

  readonly RASTER_PLAN_TYPE_ID = 'raster_plans_output_type';
  readonly RASTER_PLAN_TYPE_NAME = 'Raster Plan Output File Type';
  readonly RASTER_PLAN_TYPE_DESCRIPTION = 'The Raster Output Folder Setting defines if "All Raster Plans" folder are placed in under the "All Plans" folder, or in a separate folder under the project.';

  planFileNamingOptions = [
    {
      name: '<doc_num>__<doc_revision>',
      value: '<doc_num>__<doc_revision>',
    },
    {
      name: '<doc_num>__<doc_revision>__<doc_name>',
      value: '<doc_num>__<doc_revision>__<doc_name>',
    },
    {
      name: '<doc_num>__<doc_name>__<doc_revision>',
      value: '<doc_num>__<doc_name>__<doc_revision>',
    },
  ];

  settingChanged = false;
  revisioningTypeSettingChanged = false;
  sourceFileSubmissionFolderSettingChanged = false;
  planFileNamingSettingChanged = false;
  currentPlansFolderSettingChanged = false;
  allPlansFolderSettingChanged = false;
  allPlansSubmissionFolderSettingChanged = false;
  comparisonPlanFolderSettingChanged = false;
  disciplinePlanFolderSettingChanged = false;
  rasterPlanFolderSettingChanged = false;
  rasterPlanTypeSettingChanged = false;

  customerSettings = [];

  revisioningType = '';
  sourceFileSubmissionFolder = '';
  planFileNaming = '';
  currentPlansFolder = '';
  allPlansFolder = '';
  allPlansSubmissionFolder = '';
  comparisonPlanFolder = '';
  disciplinePlanFolder = '';
  rasterPlanFolder = '';
  rasterPlanType = '';

  @ViewChild('alertModal', { static: false }) alertModal: ElementRef;

  constructor(
    public dataStore: DataStore,
    private documentSettingsApi: DocumentSettingsApi,
    private notificationService: NotificationsService,
    private loggerService: Logger
  ) { }

  ngOnInit() {
    if (this.dataStore.currentUser) {
      this.loadCustomerSettings();
    } else {
      this.dataStore.authenticationState.subscribe(value => {
        if (value) {
          this.loadCustomerSettings();
        }
      });
    }
  }

  ngOnDestroy() {
    if (this.settingChanged) {
      this.saveCustomerSettings();
    }
  }

  onChangeRevisioningTypeSetting() {
    this.settingChanged = true;
    this.revisioningTypeSettingChanged = true;
  }

  onChangeSourceFileSubmissionFolderSetting() {
    this.settingChanged = true;
    this.sourceFileSubmissionFolderSettingChanged = true;
  }

  onChangePlanFileNamingSetting() {
    this.settingChanged = true;
    this.planFileNamingSettingChanged = true;
  }

  onChangeCurrentPlansFolderSetting() {
    this.settingChanged = true;
    this.currentPlansFolderSettingChanged = true;
  }

  onChangeAllPlansFolderSetting() {
    if (this.allPlansFolder === 'disabled') {
      this.alertModal.nativeElement.style.display = 'block';
    }

    this.settingChanged = true;
    this.allPlansFolderSettingChanged = true;
  }

  onChangeAllPlansSubmissionFolderSetting() {
    if (this.allPlansFolder !== 'enabled' && this.allPlansSubmissionFolder === 'enabled') {
      setTimeout(() => {
        this.allPlansSubmissionFolder = 'disabled';
      }, 0)
    }

    this.settingChanged = true;
    this.allPlansSubmissionFolderSettingChanged = true;
  }

  onChangeComparisonPlanFolderSetting() {
    this.settingChanged = true;
    this.comparisonPlanFolderSettingChanged = true;
  }

  onChangeDisciplinePlanFolderSetting() {
    this.settingChanged = true;
    this.disciplinePlanFolderSettingChanged = true;
  }

  onChangeRasterPlanFolderSetting() {
    this.settingChanged = true;
    this.rasterPlanFolderSettingChanged = true;
  }

  onChangeRasterPlanTypeSetting() {
    this.settingChanged = true;
    this.rasterPlanTypeSettingChanged = true;
  }

  onCancelDisablingAllPlansFolders() {
    this.alertModal.nativeElement.style.display = 'none';
    this.allPlansFolder = 'enabled';
  }

  onAgreeDisablingAllPlansFolders() {
    this.alertModal.nativeElement.style.display = 'none';
    this.allPlansSubmissionFolder = 'disabled';
  }

  loadCustomerSettings() {
    this.documentSettingsApi.getCustomerSettings(this.dataStore.currentCustomer.customer_id)
      .then((customerSettings: any[]) => {
        this.customerSettings = customerSettings;

        // initialize model values
        const revisioningTypeSetting = this.customerSettings.find((element) => element.setting_id === this.REVISIONING_TYPE_ID);
        const sourceFileSubmissionFolderSetting = this.customerSettings.find((element) => element.setting_id === this.SOURCE_FILE_SUBMISSION_FOLDER_ID);
        const planFileNamingSetting = this.customerSettings.find((element) => element.setting_id === this.PLAN_FILE_NAMING_ID);
        const currentPlansFolderSetting = this.customerSettings.find((element) => element.setting_id === this.CURRENT_PLANS_FOLDER_ID);
        const allPlansFolderSetting = this.customerSettings.find((element) => element.setting_id === this.ALL_PLANS_FOLDER_ID);
        const allPlansSubmissionFolderSetting = this.customerSettings.find((element) => element.setting_id === this.ALL_PLANS_SUBMISSION_FOLDER_ID);
        const comparisonPlanFolderSetting = this.customerSettings.find((element) => element.setting_id === this.COMPARISON_PLAN_FOLDER_ID);
        const disciplinePlanFolderSetting = this.customerSettings.find((element) => element.setting_id === this.DISCIPLINE_PLAN_FOLDER_ID);
        const rasterPlanFolderSetting = this.customerSettings.find((element) => element.setting_id === this.RASTER_PLAN_FOLDER_ID);
        const rasterPlanTypeSetting = this.customerSettings.find((element) => element.setting_id === this.RASTER_PLAN_TYPE_ID);

        this.revisioningType = revisioningTypeSetting ? revisioningTypeSetting.setting_value : '';
        this.sourceFileSubmissionFolder = sourceFileSubmissionFolderSetting ? sourceFileSubmissionFolderSetting.setting_value : '';
        this.planFileNaming = planFileNamingSetting ? planFileNamingSetting.setting_value : '';
        this.currentPlansFolder = currentPlansFolderSetting ? currentPlansFolderSetting.setting_value : '';
        this.allPlansFolder = allPlansFolderSetting ? allPlansFolderSetting.setting_value : '';
        this.allPlansSubmissionFolder = allPlansSubmissionFolderSetting ? allPlansSubmissionFolderSetting.setting_value : '';
        this.comparisonPlanFolder = comparisonPlanFolderSetting ? comparisonPlanFolderSetting.setting_value : '';
        this.disciplinePlanFolder = disciplinePlanFolderSetting ? disciplinePlanFolderSetting.setting_value : '';
        this.rasterPlanFolder = rasterPlanFolderSetting ? rasterPlanFolderSetting.setting_value : '';
        this.rasterPlanType = rasterPlanTypeSetting ? rasterPlanTypeSetting.setting_value : '';
      })
      .catch(err => {
        this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
      });
  }

  saveCustomerSettings() {
    const customer_id = this.dataStore.currentCustomer.customer_id;
    const saveTasks = [];

    if (this.revisioningType && this.revisioningTypeSettingChanged) {
      saveTasks.push(this.documentSettingsApi.createCustomerSetting({
        customer_id: customer_id,
        setting_desc: this.REVISIONING_TYPE_DESCRIPTION,
        setting_group: this.SETTINGS_GROUP,
        setting_id: this.REVISIONING_TYPE_ID,
        setting_name: this.REVISIONING_TYPE_NAME,
        setting_sequence: '1',
        setting_value: this.revisioningType,
        setting_value_data_type: 'text',
      }));
    }

    if (this.planFileNaming && this.planFileNamingSettingChanged) {
      saveTasks.push(this.documentSettingsApi.createCustomerSetting({
        customer_id: customer_id,
        setting_desc: this.PLAN_FILE_NAMING_DESCRIPTION,
        setting_group: this.SETTINGS_GROUP,
        setting_id: this.PLAN_FILE_NAMING_ID,
        setting_name: this.PLAN_FILE_NAMING_NAME,
        setting_sequence: '2',
        setting_value: this.planFileNaming,
        setting_value_data_type: 'text',
      }));
    }

    if (this.currentPlansFolder && this.currentPlansFolderSettingChanged) {
      saveTasks.push(this.documentSettingsApi.createCustomerSetting({
        customer_id: customer_id,
        setting_desc: this.CURRENT_PLANS_FOLDER_DESCRIPTION,
        setting_group: this.SETTINGS_GROUP,
        setting_id: this.CURRENT_PLANS_FOLDER_ID,
        setting_name: this.CURRENT_PLANS_FOLDER_NAME,
        setting_sequence: '3',
        setting_value: this.currentPlansFolder,
        setting_value_data_type: 'text',
      }));
    }

    if (this.allPlansFolder && this.allPlansFolderSettingChanged) {
      saveTasks.push(this.documentSettingsApi.createCustomerSetting({
        customer_id: customer_id,
        setting_desc: this.ALL_PLANS_FOLDER_DESCRIPTION,
        setting_group: this.SETTINGS_GROUP,
        setting_id: this.ALL_PLANS_FOLDER_ID,
        setting_name: this.ALL_PLANS_FOLDER_NAME,
        setting_sequence: '4',
        setting_value: this.allPlansFolder,
        setting_value_data_type: 'text',
      }));
    }

    if (this.allPlansSubmissionFolder && this.allPlansSubmissionFolderSettingChanged) {
      saveTasks.push(this.documentSettingsApi.createCustomerSetting({
        customer_id: customer_id,
        setting_desc: this.ALL_PLANS_SUBMISSION_FOLDER_DESCRIPTION,
        setting_group: this.SETTINGS_GROUP,
        setting_id: this.ALL_PLANS_SUBMISSION_FOLDER_ID,
        setting_name: this.ALL_PLANS_SUBMISSION_FOLDER_NAME,
        setting_sequence: '5',
        setting_value: this.allPlansSubmissionFolder,
        setting_value_data_type: 'text',
      }));
    }

    if (this.comparisonPlanFolder && this.comparisonPlanFolderSettingChanged) {
      saveTasks.push(this.documentSettingsApi.createCustomerSetting({
        customer_id: customer_id,
        setting_desc: this.COMPARISON_PLAN_FOLDER_DESCRIPTION,
        setting_group: this.SETTINGS_GROUP,
        setting_id: this.COMPARISON_PLAN_FOLDER_ID,
        setting_name: this.COMPARISON_PLAN_FOLDER_NAME,
        setting_sequence: '6',
        setting_value: this.comparisonPlanFolder,
        setting_value_data_type: 'text',
      }));
    }

    if (this.disciplinePlanFolder && this.disciplinePlanFolderSettingChanged) {
      saveTasks.push(this.documentSettingsApi.createCustomerSetting({
        customer_id: customer_id,
        setting_desc: this.DISCIPLINE_PLAN_FOLDER_DESCRIPTION,
        setting_group: this.SETTINGS_GROUP,
        setting_id: this.DISCIPLINE_PLAN_FOLDER_ID,
        setting_name: this.DISCIPLINE_PLAN_FOLDER_NAME,
        setting_sequence: '7',
        setting_value: this.disciplinePlanFolder,
        setting_value_data_type: 'text',
      }));
    }

    if (this.rasterPlanFolder && this.rasterPlanFolderSettingChanged) {
      saveTasks.push(this.documentSettingsApi.createCustomerSetting({
        customer_id: customer_id,
        setting_desc: this.RASTER_PLAN_FOLDER_DESCRIPTION,
        setting_group: this.SETTINGS_GROUP,
        setting_id: this.RASTER_PLAN_FOLDER_ID,
        setting_name: this.RASTER_PLAN_FOLDER_NAME,
        setting_sequence: '8',
        setting_value: this.rasterPlanFolder,
        setting_value_data_type: 'text',
      }));
    }

    if (this.rasterPlanType && this.rasterPlanTypeSettingChanged) {
      saveTasks.push(this.documentSettingsApi.createCustomerSetting({
        customer_id: customer_id,
        setting_desc: this.RASTER_PLAN_TYPE_DESCRIPTION,
        setting_group: this.SETTINGS_GROUP,
        setting_id: this.RASTER_PLAN_TYPE_ID,
        setting_name: this.RASTER_PLAN_TYPE_NAME,
        setting_sequence: '9',
        setting_value: this.rasterPlanType,
        setting_value_data_type: 'text',
      }));
    }

    if (this.sourceFileSubmissionFolder && this.sourceFileSubmissionFolderSettingChanged) {
      saveTasks.push(this.documentSettingsApi.createCustomerSetting({
        customer_id: customer_id,
        setting_desc: this.SOURCE_FILE_SUBMISSION_FOLDER_DESCRIPTION,
        setting_group: this.SETTINGS_GROUP,
        setting_id: this.SOURCE_FILE_SUBMISSION_FOLDER_ID,
        setting_name: this.SOURCE_FILE_SUBMISSION_FOLDER_NAME,
        setting_sequence: '10',
        setting_value: this.sourceFileSubmissionFolder,
        setting_value_data_type: 'text',
      }));
    }

    Promise.all(saveTasks)
      .then(res => {
        this.notificationService.success('Success', 'Updated document settings', { timeOut: 3000, showProgressBar: false });
        this.logTransaction('Completed', 'Successfully updated document settings', 'summary');
      })
      .catch(err => {
        console.log(err);
        this.notificationService.error('Error', 'Failed to update document settings', { timeOut: 3000, showProgressBar: false });
        this.logTransaction('Failed', CircularJSON.stringify(err), 'summary');
      });
  }

  logTransaction(status: string, description: string, transaction_level: string) {
    this.loggerService.logAppTransaction({
      routine_name: 'Customer Portal',
      operation_name: 'Update Document Settings',
      user_id: this.dataStore.currentUser['user_id'],
      customer_id: this.dataStore.currentUser['customer_id'],
      function_name: 'Update Document Settings',
      operation_status: status,
      operation_status_desc: description,
      transaction_level: transaction_level,
    });
  }
}
