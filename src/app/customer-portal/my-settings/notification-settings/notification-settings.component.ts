import { UserInfoApi } from 'app/customer-portal/system-settings/user-setup/user-setup.api.service';
import { NotificationSettingsApi } from './notification-settings.api.service';

import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { DataStore } from '../../../providers/datastore';

import { NotificationsService } from 'angular2-notifications';

import { Logger } from 'app/providers/logger.service';
const CircularJSON = require('circular-json');

@Component({
  selector: 'app-notification-settings',
  templateUrl: './notification-settings.component.html',
  styleUrls: ['./notification-settings.component.scss'],
  providers: [NotificationSettingsApi]
})
export class NotificationSettingsComponent implements OnInit {


  readonly SETTINGS_GROUP = 'Notification Settings';


  readonly DAILY_DOCUMENT_DIGEST_ID = 'daily_document_digest';
  readonly DAILY_DOCUMENT_DIGEST_NAME = 'Daily Digest Notifications';
  readonly DAILY_DOCUMENT_DIGEST_DESCRIPTION ='This setting defines if daily notifications that notify the user of any changes to their projects are enabled. Values: User - notify the project administrator, Office - notify all users with same office, Company - notify all users in company, Disable - do not send Daily Digest Emails.';

  readonly NEW_PROJECT_CONFIRMATION_ID = 'new_project_confirmation';
  readonly NEW_PROJECT_CONFIRMATION_NAME = 'New Project Confirmation Notifications'
  readonly NEW_PROJECT_CONFIRMATION_DESCRIPTION ='This setting defines if a confirmation will be sent to the submitter whenever a project is received by the system.';

  readonly NEW_PROJECT_COMPLETE_ID ='new_project_complete';
  readonly NEW_PROJECT_COMPLETE_NAME = 'New Project Ready Notification';
  readonly NEW_PROJECT_COMPLETE_DESCRIPTION = 'This setting defines if a confirmation will be sent to the submitter whenever a project has completed splitting, number, the documents and preparing all comparision drawings.';

  readonly NEW_PROJECT_QUICK_REVIEW_ID = 'new_project_quick_review';
  readonly NEW_PROJECT_QUICK_REVIEW_NAME = 'New Project Quick Review Notifications';
  readonly NEW_PROJECT_QUICK_REVIEW_DESCRIPTION = 'This setting defines if a confirmation notification will be sent to the submitter when a project has uploaded all source documents and is ready for quick review.';

  settingChanged = false;
  dailyDocumentDigestSettingChanged = false;
  newProjectConfirmationSettingChanged = false;
  newProjectCompleteSettingChanged = false;
  newProjectQuickReviewSettingChanged = false;

  userSettings = [];

  dailyDocumentDigest = '';
  newProjectConfirmation ='';
  newProjectComplete = '';
  newProjectQuickReview = '';


  constructor(public dataStore: DataStore,
    private notificationSettingsApi: NotificationSettingsApi,
    private notificationService: NotificationsService,
    private loggerService: Logger) { }

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
      this.saveUserSettings();
    }
  }
  
  onChangeDailyDocumentDigestSetting() {
    this.settingChanged = true;
    this.dailyDocumentDigestSettingChanged = true;
  }
  onChangeNewProjectConfirmationSetting(){
    this.settingChanged = true;
    this.newProjectConfirmationSettingChanged = true;
  }
  onChangeNewProjectCompleteSetting(){
    this.settingChanged = true;
    this.newProjectCompleteSettingChanged = true;
  }
  onChangeNewProjectQuickReviewSetting(){
    this.settingChanged = true;
    this.newProjectQuickReviewSettingChanged = true;
  }

  
  loadCustomerSettings() {
    this.notificationSettingsApi.getUserSettings(this.dataStore.currentUser.user_id)
    .then((userSettings: any[]) => {
      
      this.userSettings = userSettings;

      // initialize model values
      const dailyDocumentDigestSetting = this.userSettings.find((element) => element.user_setting_id === this.DAILY_DOCUMENT_DIGEST_ID);
      const newProjectConfirmationSetting = this.userSettings.find((element) => element.user_setting_id === this.NEW_PROJECT_CONFIRMATION_ID);
      const newProjectCompleteSetting= this.userSettings.find((element) => element.user_setting_id === this.NEW_PROJECT_COMPLETE_ID);
      const newProjectQuickReviewSetting = this.userSettings.find((element) => element.user_setting_id === this.NEW_PROJECT_QUICK_REVIEW_ID);


      this.dailyDocumentDigest = dailyDocumentDigestSetting ? dailyDocumentDigestSetting.setting_value : '';
      this.newProjectConfirmation = newProjectConfirmationSetting ? newProjectConfirmationSetting.setting_value : '';
      this.newProjectComplete = newProjectCompleteSetting ? newProjectCompleteSetting.setting_value : '';
      this.newProjectQuickReview = newProjectQuickReviewSetting ? newProjectQuickReviewSetting.setting_value : '';
    })
    .catch(err => {
      this.notificationService.error('Error', err, { timeOut: 3000, showProgressBar: false });
    });
  }

  saveUserSettings() {
    const user_id = this.dataStore.currentUser.user_id;
    const saveTasks = [];

    if (this.dailyDocumentDigest && this.dailyDocumentDigestSettingChanged) {
      saveTasks.push(this.notificationSettingsApi.createUserSetting({
        user_id: user_id,
        setting_desc: this.DAILY_DOCUMENT_DIGEST_DESCRIPTION,
        setting_group: this.SETTINGS_GROUP,
        user_setting_id: this.DAILY_DOCUMENT_DIGEST_ID,
        setting_name: this.DAILY_DOCUMENT_DIGEST_NAME,
        setting_sequence: '1',
        setting_value: this.dailyDocumentDigest,
        setting_value_data_type: 'text',
      }));
    }
    if (this.newProjectConfirmation && this.newProjectConfirmationSettingChanged) {
      saveTasks.push(this.notificationSettingsApi.createUserSetting({
        user_id: user_id,
        setting_desc: this.NEW_PROJECT_CONFIRMATION_DESCRIPTION,
        setting_group: this.SETTINGS_GROUP,
        user_setting_id: this.NEW_PROJECT_CONFIRMATION_ID,
        setting_name: this.NEW_PROJECT_CONFIRMATION_NAME,
        setting_sequence: '2',
        setting_value: this.newProjectConfirmation,
        setting_value_data_type: 'text',
      }));
    }
    if (this.newProjectComplete && this.newProjectCompleteSettingChanged) {
      saveTasks.push(this.notificationSettingsApi.createUserSetting({
        user_id: user_id,
        setting_desc: this.NEW_PROJECT_COMPLETE_DESCRIPTION,
        setting_group: this.SETTINGS_GROUP,
        user_setting_id: this.NEW_PROJECT_COMPLETE_ID,
        setting_name: this.NEW_PROJECT_COMPLETE_NAME,
        setting_sequence: '3',
        setting_value: this.newProjectComplete,
        setting_value_data_type: 'text',
      }));
    }
    if (this.newProjectQuickReview && this.newProjectQuickReviewSettingChanged) {
      saveTasks.push(this.notificationSettingsApi.createUserSetting({
        user_id: user_id,
        setting_desc: this.NEW_PROJECT_QUICK_REVIEW_DESCRIPTION,
        setting_group: this.SETTINGS_GROUP,
        user_setting_id: this.NEW_PROJECT_QUICK_REVIEW_ID,
        setting_name: this.NEW_PROJECT_QUICK_REVIEW_NAME,
        setting_sequence: '4',
        setting_value: this.newProjectQuickReview,
        setting_value_data_type: 'text',
      }));
    }
    Promise.all(saveTasks)
      .then(res => {
        this.notificationService.success('Success', 'Updated Notification Settings', { timeOut: 3000, showProgressBar: false });
        this.logTransaction('Completed', 'Successfully Updated Notification Settings', 'summary');
      })
      .catch(err => {
        console.log(err);
        this.notificationService.error('Error', 'Failed to Update Notification Settings', { timeOut: 3000, showProgressBar: false });
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
