import {
  Injectable,
  EventEmitter
} from '@angular/core';
import axios from 'axios';
import * as AWS from 'aws-sdk';
const moment = require('moment-timezone');
import * as queryString from 'query-string';
import { reject } from 'lodash';

const WIP_TABLE_KEYS = {
  922: 'id_922',
  923: 'id_923',
  925: 'file_preprocessing_id',
  940: 'project_standardization_id',
  941: 'drawing_standardization_id',
  94111: 'extract_id',
  94114: 'ocr_id',
  9414: 'compare_id',
  9418: 'manual_plan_processing_id',
  964: 'publish_files_id',
  966: 'revision_removal_id',
  970: 'user_notifications_id'
};

@Injectable()
export class AmazonService {
  private _wipApiBaseUrl = '';

  s3 = null;
  lambda = null;
  tempBucketName = '';
  permBucketName = '';
  logBucketName = '';

  initialized = false;
  eventEmitter = new EventEmitter<any>();

  constructor() {
    let tasks = [];
    tasks.push(axios.get(`${window['env'].apiBaseUrl}/GetSystemSettings?system_setting_id=AWS_ACCESS_KEY_ID`));
    tasks.push(axios.get(`${window['env'].apiBaseUrl}/GetSystemSettings?system_setting_id=AWS_SECRET_ACCESS_KEY`));
    tasks.push(axios.get(`${window['env'].apiBaseUrl}/GetSystemSettings?system_setting_id=AWS_REGION`));
    tasks.push(axios.get(`${window['env'].apiBaseUrl}/GetSystemSettings?system_setting_id=BR_TEMP_VAULT`));
    tasks.push(axios.get(`${window['env'].apiBaseUrl}/GetSystemSettings?system_setting_id=BR_PERM_VAULT`));
    tasks.push(axios.get(`${window['env'].apiBaseUrl}/GetSystemSettings?system_setting_id=BR_WIPAPI_ENDPOINT`));
    tasks.push(axios.get(`${window['env'].apiBaseUrl}/GetSystemSettings?system_setting_id=BR_LOG_VAULT_BUCKET_NAME`));  

    Promise.all(tasks).then((res: any[]) => {
      this._wipApiBaseUrl = res[5]['data']['setting_value'];

      AWS.config.update({
        accessKeyId: res[0]['data']['setting_value'],
        secretAccessKey: res[1]['data']['setting_value'],
        region: res[2]['data']['setting_value']
      });


      this.tempBucketName = res[3]['data']['setting_value'];
      this.permBucketName = res[4]['data']['setting_value'];
      this.logBucketName = res[6]['data']['setting_value'];

      this.s3 = new AWS.S3({apiVersion: '2006-03-01'});
      this.lambda = new AWS.Lambda();

      this.initialized = true;
      this.eventEmitter.emit(true);
    }).catch(err => {
      console.log(err);
      this.eventEmitter.emit(false);
    });
  }

  private awaitInitialization() {
    return new Promise((resolve, reject) => {
      if (!this.initialized) {
        this.eventEmitter.subscribe((value) => {
          if (value) {
            resolve();
          } else {
            reject();
          }
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Upload given data to s3
   * @param buffer
   * @param path
   */
  public uploadFile(buffer: any, path: string) {
    return new Promise((resolve, reject) => {
      this.awaitInitialization()
        .then(res => {
          const params = {
            Bucket: this.tempBucketName,
            Key: path,
            Body: buffer,
          }

          this.s3.upload(params, (err, data) => {
            if (err) {
              console.log(err);
              reject(err);
            } else {
              resolve();
            }
          });
        })
        .catch(err => {
          reject('Failed to initialize AWS modules');
        });
    })
  }


  /**
   * Create publish job record with given parameters
   * @param params
   */
  public createPublishJobRecord(params: any) {
    return new Promise((resolve, reject) => {
      this.awaitInitialization()
        .then(res => {
          const currentDateTime = moment.utc().format('YYYY-MM-DDTHH:mm:ss.SSSSSS') + 'Z';
          params.create_datetime = currentDateTime;
          params.edit_datetime = currentDateTime;

          axios.post(`${this._wipApiBaseUrl}Create960`, queryString.stringify(params))
            .then((res: any) => {
              resolve();
            })
            .catch((error) => {
              console.log('Create Publish Job Record', error);
              return reject(error);
            });
        })
        .catch(err => {
          reject('Failed to initialize AWS modules');
        });
    });
  }

  /**
   * Create publish job record with given parameters
   * @param params
   */
  public createFilePreprocessingRecord(params: any) {
    return new Promise((resolve, reject) => {
      this.awaitInitialization()
        .then(res => {
          const currentDateTime = moment.utc().format('YYYY-MM-DDTHH:mm:ss.SSSSSS') + 'Z';
          params.create_datetime = currentDateTime;
          params.edit_datetime = currentDateTime;
          params.vault_bucket = this.tempBucketName;

          axios.post(`${this._wipApiBaseUrl}Create922`, queryString.stringify(params))
            .then((res: any) => {
              resolve();
            })
            .catch((error) => {
              console.log('Create FilePreprocessingRecord', error);
              return reject(error);
            });
        })
        .catch(err => {
          reject('Failed to initialize AWS modules');
        });
    });
  }

  /**
   * Update project retrieval (920) record with the new source_sys_type_id
   * @param userIdArray
   * @param sourceSysTypeId
   */
  public updateProjectRetrievalRecords(userIdArray: string[], sourceSysTypeId: string) {
    return new Promise(async (resolve, reject) => {
      try {
        await this.awaitInitialization();
      } catch (error) {
        return reject('Failed to initialize system settings');
      }

      try {
        const result = await axios.get(`${this._wipApiBaseUrl}Find920?process_status=unable to authenticate`);
        const filteredRecords = result.data.filter(({ source_sys_type_id, user_id }) => {
          if (source_sys_type_id !== sourceSysTypeId) {
            return false;
          }
          for (const userId of userIdArray) {
            if (userId === user_id) {
              return true;
            }
          }
          return false;
        });
        
        for (const item of filteredRecords) {
          await this.updateProjectRetrievalRecordStatus(item['submission_id']);
        }

        resolve();
      } catch (error) {
        reject('Failed to update retrieval records');
      }
    });
  }

  /**
   * Generate pre-signed url for the target s3 file
   * @param bucket_name
   * @param file_key
   */
  public getPresignedUrl(bucket_name: string, file_key: string) {
    return new Promise((resolve, reject) => {
      this.awaitInitialization()
        .then(res => {
          const url = this.s3.getSignedUrl('getObject', {
            Bucket: bucket_name,
            Key: file_key,
            Expires: 60 * 5,
          });
          resolve(url);
        })
        .catch(err => {
          reject('Failed to initialize AWS modules');
        });
    });
  }

  
/**
* Generate pre-signed url for the target s3 file
* @param bucket_name
* @param file_key
*/
public getPresignedUrlWithOriginalFileName(bucket_name: string, file_key: string, doc_name: string) {
  return new Promise((resolve, reject) => {
  this.awaitInitialization()
  .then(res => {
  
  const url = this.s3.getSignedUrl('getObject', {
  Bucket: bucket_name,
  Key: file_key,
  Expires: 60 * 5,
  ResponseContentDisposition: 'attachment; filename ="' + doc_name + '"'
  });
  resolve(url);
  })
  .catch(err => {
  reject('Failed to initialize AWS modules');
  });
  });
  }

  /**
   * Get uncompleted records list from 920~964 tables
   * @param project_id
   */
  private getWipRecords(routineName: string, projectId: string, timezone: string) {
    return new Promise(async (resolve, reject) => {
      try {
        await this.awaitInitialization();
      } catch (error) {
        return reject('Failed to initialize system settings');
      }

      try {
        const { data: records } = await axios.get(`${this._wipApiBaseUrl}/Find${routineName}?project_id=${projectId}`);
        const matchedRecords = records.map(({ invoke_wip_processing, ...record }) => ({
          table_name: routineName,
          record_key: record[WIP_TABLE_KEYS[routineName]],
          create_datetime: this.convertToTimeZoneObject(record.create_datetime, timezone).format('YYYY-MM-DD HH:mm:ss A z'),
          edit_datetime: this.convertToTimeZoneObject(record.edit_datetime, timezone).format('YYYY-MM-DD HH:mm:ss A z'),
          process_status: record.process_status,
          submission_id: record.submission_id,
          file_original_filename: record.file_original_filename,
          original_filepath: record.original_filepath,
          doc_type: record.doc_type,
          doc_id: record.doc_id,
          file_id: record.file_id,
          description: JSON.stringify(record)
        }));

        return resolve(matchedRecords);
      } catch (error) {
        return resolve([]);
      }
    });
  }

  public getAllWipRecords(projectId: string, timezone: string) {
    return new Promise(async (resolve, reject) => {
      try {
        await this.awaitInitialization();
      } catch (error) {
        return reject('Failed to initialize system settings');
      }

      try {
        const routineNames = [
          '922', '923', '925', '940', '941', '94111', '94114', '9414', '9418', '964', '966', '970'
        ];

        const tasks = [];
        routineNames.forEach(routineName => tasks.push(this.getWipRecords(routineName, projectId, timezone)));

        const routineRecords = await Promise.all(tasks);
        let records = [];
        routineRecords.forEach(routineRecord => {
          records = records.concat(routineRecord);
        });
        return resolve(records);
      } catch (error) {
        return reject(error);
      }
    });
  }

  public updateWipRecordStatus(routineName: string, recordKey: string, processStatus: string, invokeWipProcessing: boolean = false) {
    return new Promise(async (resolve, reject) => {
      try {
        await this.awaitInitialization();
      } catch (error) {
        return reject('Failed to initialize system settings');
      }

      try {
        const params = {};
        params[`search_${WIP_TABLE_KEYS[routineName]}`] = recordKey;
        params['process_status'] = processStatus;
        params['invoke_wip_processing'] = invokeWipProcessing;
        await axios.post(`${this._wipApiBaseUrl}Update${routineName}`, queryString.stringify(params));
        return resolve();
      } catch (error) {
        return reject(error);
      }
    });
  }

  public moveToPermanentVault(file_key: string) {
    return new Promise((resolve, reject) => {
      this.awaitInitialization()
      .then(res => {
        const params = {
          FunctionName: 'MoveToPermanentVault',
          Payload: JSON.stringify({
            body: JSON.stringify({
              temp_vault_key: file_key,
            }),
          }),
        };

        this.lambda.invoke(params, (err, response) => {
          if (err) {
            reject(err);
          } else {
            const { hash_value } = JSON.parse(JSON.parse(response.Payload).body);
            resolve(hash_value);
          }
        });
      })
      .catch(err => {
        reject('Failed to initialize AWS modules');
      });
    });
  }

  /**
   * Update project retrieval (920) record status
   * @param submission_id
   * @param status
   */
  private updateProjectRetrievalRecordStatus(submission_id: string, status: string = 'queued') {
    return new Promise(async (resolve, reject) => {
      try {
        await this.awaitInitialization()
      } catch (error) {
        return reject('Failed to initialize system settings');
      }

      try {
        const currentDateTime = moment().format('YYYY-MM-DDTHH:mm:ss.SSSSSS') + 'Z';
        const params = {
          search_submission_id: submission_id,
          process_status: status,
          edit_datetime: currentDateTime,
        };

        await axios.post(`${this._wipApiBaseUrl}Update920`, queryString.stringify(params));
        resolve();
      } catch (error) {
        return reject('Failed to update 920 record');
      }
    });
  }

  /**
   * Fetch file content from production vault with given s3 key
   * @param s3Key
   */
  public downloadFile(s3Bucket: string, s3Key: string) {
    return new Promise((resolve, reject) => {
      this.awaitInitialization()
        .then(res => {
          const params = {
            Bucket: s3Bucket,
            Key: s3Key,
          };

          this.s3.getObject(params, function(err, data) {
            if (err) {
              console.log(err);
              reject(err);
            } else {
              resolve(data.Body);
            }
          });
        })
        .catch(err => {
          reject('Failed to initialize AWS modules');
        });
    });
  }

  /**
   * Request submission delete
   * @param submission_id
   */
  public deleteSubmission(submission_id: string) {
    return new Promise((resolve, reject) => {
      const params = {
        FunctionName: '990SubmissionDelete',
        InvokeArgs: JSON.stringify({
          submission_id
        }),
      };

      this.lambda.invokeAsync(params, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Create 920 record
   * @param params
   */
  public createProjectRetrievalRecord(params: any) {
    return new Promise((resolve, reject) => {
      this.awaitInitialization()
        .then(res => {
          const currentDateTime = moment.utc().format('YYYY-MM-DDTHH:mm:ss.SSSSSS') + 'Z';
          params.create_datetime = currentDateTime;
          params.edit_datetime = currentDateTime;
          params.vault_bucket = this.tempBucketName;

          axios.post(`${this._wipApiBaseUrl}Create920`, queryString.stringify(params))
            .then((res: any) => {
              resolve();
            })
            .catch((error) => {
              console.log('Create Project Retrieval Record', error);
              return reject(error);
            });
          const putParams = {
            TableName: '920ProjectRetrieval',
            Item: params,
          };
        })
        .catch(err => {
          reject('Failed to initialize AWS modules');
        });
    });
  }

  /**
   * Convert to timezone object
   * @param timestamp
   * @param timezone
   */
  private convertToTimeZoneObject(timestamp: string, timezone: string) {
    const datetime = moment(timestamp);
    let timezonedDateTime = null;

    switch(timezone) {
        case 'eastern':
        timezonedDateTime = datetime.tz('America/New_York');
        break;

        case 'central':
        timezonedDateTime = datetime.tz('America/Chicago');
        break;

        case 'mountain':
        timezonedDateTime = datetime.tz('America/Denver');
        break;

        case 'pacific':
        timezonedDateTime = datetime.tz('America/Los_Angeles');
        break;

        case 'Non US Timezone': case 'utc': default:
        timezonedDateTime = datetime.utc();
    }

    return timezonedDateTime;
  }

  public getSystemSettings(system_setting_id: string) {
    
    return new Promise((resolve, reject) => {
      axios.get(window['env'].apiBaseUrl + `/GetSystemSettings?system_setting_id=${system_setting_id}`)
        .then(res => {
          resolve(res.data);
        })
        .catch(err => {
          console.log(err);
          reject(err);
        });
    });
  }

  /**
   * Create Update Project From Source  
   */

  public updateProject(params: any) {
    
    return new Promise((resolve, reject) => {
      axios
        .post(
          this._wipApiBaseUrl + "/Create920",
          queryString.stringify(params),
          {
            validateStatus: (status) => {
              return status === 200 || status === 400;
            },
          }
        )
        .then((res) => {
          
          if (res.status === 200) {
            resolve(res);
          } else {
            reject(res.data.status);
          }
        })
        .catch((err) => {
          console.log(err);
          reject(err);
        });
    });
  }

  /**
   * Read log file from s3 bucket
   * @param prefix 
   */
  public getLog(prefix: string): Promise<string> {
    return new Promise<string>(async (resolve, reject) => {
      try {
        await this.awaitInitialization();
      } catch (error) {
        return reject('Failed to load the initialization values');
      }

      try {
        this.s3.listObjects({
          Bucket: this.logBucketName,
          Prefix: prefix,
        }, (error, data) => {
          let tasks = data.Contents.map(({ Key }) => this.s3.getSignedUrlPromise('getObject', {
            Bucket: this.logBucketName,
            Key,
            Expires: 0,
          }));

          Promise.all(tasks).then((signedUrls: any) => {
            tasks = signedUrls.map(signedUrl => axios.get(signedUrl));

            Promise.all(tasks).then((responses: any) => {
              const logs = responses.map(({ data }) => data)
              resolve(logs.join(' '))
            })
          }).catch(errors => {
            reject('Failed to read logs');
          })
        });
      } catch (error) {
        return reject(error);
      }
    });
  }
}
