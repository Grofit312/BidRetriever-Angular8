import {
  Injectable,
  EventEmitter
} from '@angular/core';
import axios from 'axios';
import * as AWS from 'aws-sdk';
const moment = require('moment-timezone');
import * as queryString from 'query-string';

@Injectable()
export class AmazonService {
  private _wipApiBaseUrl = '';

  docClient = null;
  s3 = null;
  lambda = null;
  tempBucketName = '';
  permBucketName = '';

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

    Promise.all(tasks).then((res: any[]) => {
      this._wipApiBaseUrl = res[5]['data']['setting_value'];

      AWS.config.update({
        accessKeyId: res[0]['data']['setting_value'],
        secretAccessKey: res[1]['data']['setting_value'],
        region: res[2]['data']['setting_value']
      });

      this.tempBucketName = res[3]['data']['setting_value'];
      this.permBucketName = res[4]['data']['setting_value'];

      this.docClient = new AWS.DynamoDB.DocumentClient;
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

          const putParams = {
            TableName: window['env'].projectPublishTableName,
            Item: params,
          }

          this.docClient.put(putParams, (err, res) => {
            if (err) {
              console.log(err);
              reject(err);
            } else {
              resolve(res);
            }
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

              // Call 922 Lambda
              const params = {
                FunctionName: '922UnzipSourceFiles',
                InvokeArgs: JSON.stringify({
                  id_922: res.data.id_922,
                  processing_type: 'LAMBDA',
                  event_type: 'INSERT'
                }),
              };

              this.lambda.invokeAsync(params, (err) => {
                if (err) {
                  return reject(err);
                } else {
                  return resolve();
                }
              });
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
    return new Promise((resolve, reject) => {
      this.awaitInitialization()
        .then(res => {
          let userIdAttributeValues = '';
          let expressionAttributeValues = {};

          userIdArray.forEach((userId, index) => {
            if (index < userIdArray.length - 1) {
              userIdAttributeValues += `:user${index}, `;
            } else {
              userIdAttributeValues += `:user${index}`;
            }

            expressionAttributeValues[`:user${index}`] = userId;
          });

          expressionAttributeValues[':process_status'] = 'unable to authenticate';
          expressionAttributeValues[':source_sys_type_id'] = sourceSysTypeId;

          const params = {
            TableName: '920ProjectRetrieval',
            IndexName: 'ByStatus',
            KeyConditionExpression: '#process_status = :process_status',
            ExpressionAttributeNames: {
              '#process_status': 'process_status',
              '#source_sys_type_id': 'source_sys_type_id',
              '#user_id': 'user_id',
            },
            ExpressionAttributeValues: expressionAttributeValues,
            FilterExpression: `#source_sys_type_id = :source_sys_type_id AND #user_id IN (${userIdAttributeValues})`,
          };

          this.docClient.query(params, (err, data) => {
            if (err) {
              console.log(err);
              reject(err);
            } else {
              let updateTasks = data.Items.map(item => this.updateProjectRetrievalRecordStatus(item['submission_id']));
              Promise.all(updateTasks)
                .then(res => {
                  resolve();
                })
                .catch(err => {
                  console.log(err);
                  reject(err);
                });
            }
          });
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
   * Get uncompleted records list from 920~964 tables
   * @param project_id
   */
  public getUncompletedRecords(project_id: string, timezone: string) {
    return new Promise((resolve, reject) => {
      this.awaitInitialization()
        .then(res => {
          const tasks = [];
          tasks.push(this.fetchUncompletedRecordsFromFilePreprocessingTable(project_id, timezone));
          tasks.push(this.fetchUncompletedRecordsFromProjectStandardizationTable(project_id, timezone));
          tasks.push(this.fetchUncompletedRecordsFromComparisonDrawingTable(project_id, timezone));
          tasks.push(this.fetchUncompletedRecordsFromFilePublishTable(project_id, timezone));

          return Promise.all(tasks);
        })
        .then((res: any[]) => {
          resolve(res.reduce((prev, current) => prev.concat(current)).map(record => {
            record.description = JSON.stringify(record);
            record.create_datetime = this.convertToTimeZoneObject(record.create_datetime, timezone).format('YYYY-MM-DD HH:mm:ss A z');
            return record;
          }));
        })
        .catch(err => {
          reject('Failed to initialize AWS modules');
        });
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
   * Update any table record's status
   * @param tableName
   * @param keyName
   * @param keyValue
   * @param status
   */
  public updateRecordStatus(tableName: string, keyName: string, keyValue: string, status: string) {
    return new Promise((resolve, reject) => {
      this.getRecordStatus(tableName, keyName, keyValue)
        .then((currentStatus: string) => {
          if (currentStatus.includes('completed') || currentStatus.includes('errored')) {
            return reject('Already completed record');
          }

          const currentDateTime = moment().format('YYYY-MM-DDTHH:mm:ss.SSSSSS') + 'Z';
          const params = {
            TableName: tableName,
            Key: {
              [keyName]: keyValue,
            },
            UpdateExpression: 'set #process_status = :process_status, #edit_datetime = :edit_datetime',
            ExpressionAttributeNames: {'#process_status': 'process_status', '#edit_datetime': 'edit_datetime'},
            ExpressionAttributeValues: {':process_status' : status, ':edit_datetime' : currentDateTime}
          };

          this.docClient.update(params, (err, data) => {
            if (err) {
              console.log(err);
              reject(err);
            } else {
              resolve(data);
            }
          });
        })
        .catch(err => {
          reject(err);
        });
    });
  }

  /**
   * Get WIP record status
   * @param tableName
   * @param keyName
   * @param keyValue
   */
  private getRecordStatus(tableName: string, keyName: string, keyValue: string) {
    return new Promise((resolve, reject) => {
      const params = {
        TableName: tableName,
        Key: {
          [keyName]: keyValue,
        },
      };

      this.docClient.get(params, (err, data) => {
        if (err) {
          console.log(err);
          reject(err);
        } else {
          resolve(data.Item.process_status);
        }
      });
    });
  }

  /**
   * Update project retrieval (920) record status
   * @param submission_id
   * @param status
   */
  private updateProjectRetrievalRecordStatus(submission_id: string, status: string = 'queued') {
    return new Promise((resolve, reject) => {
      this.awaitInitialization()
        .then(res => {
          const currentDateTime = moment().format('YYYY-MM-DDTHH:mm:ss.SSSSSS') + 'Z';
          const params = {
            TableName: '920ProjectRetrieval',
            Key: {
              submission_id: submission_id,
            },
            UpdateExpression: 'set #process_status = :process_status, #edit_datetime = :edit_datetime',
            ExpressionAttributeNames: {'#process_status': 'process_status', '#edit_datetime': 'edit_datetime'},
            ExpressionAttributeValues: {':process_status' : status, ':edit_datetime' : currentDateTime}
          };

          this.docClient.update(params, (err, data) => {
            if (err) {
              console.log(err);
              reject(err);
            } else {
              resolve(data);
            }
          });
        })
        .catch(err => {
          reject('Failed to initialize AWS modules');
        });
    });
  }

  /**
   * Fetch uncompleted records from 920 table
   * @param project_id
   * @param timezone
   */
  private fetchUncompletedRecordsFromProjectRetrievalTable(project_id: string, timezone: string) {
    return new Promise((resolve, reject) => {
      const params = {
        TableName: '920ProjectRetrieval',
        IndexName: 'project_id-index',
        KeyConditionExpression: '#project_id = :project_id',
        FilterExpression: 'not (contains(#process_status, :completed))',
        ExpressionAttributeNames: {
          '#project_id': 'project_id',
          '#process_status': 'process_status',
        },
        ExpressionAttributeValues: {
          ':completed': 'completed',
          ':project_id': project_id,
        },
      };

      this.docClient.query(params).promise()
        .then(res => {
          res.Items.forEach(item => {
            item.table_name = '920';
          });

          resolve(res.Items);
        })
        .catch(err => {
          console.log(err);
          reject(err);
        });
    });
  }

  /**
   * Fetch uncompleted records from 925 table
   * @param project_id
   * @param timezone
   */
  private fetchUncompletedRecordsFromFilePreprocessingTable(project_id: string, timezone: string) {
    return new Promise((resolve, reject) => {
      let fetchedItems = [];
      const params = {
        TableName: '925FilePreprocessing',
        IndexName: 'project_id-index',
        KeyConditionExpression: '#project_id = :project_id',
        FilterExpression: 'not (contains(#process_status, :completed))',
        ExpressionAttributeNames: {
          '#project_id': 'project_id',
          '#process_status': 'process_status',
        },
        ExpressionAttributeValues: {
          ':completed': 'completed',
          ':project_id': project_id,
        },
      };

      const onScan = (error, data) => {
        if (error) {
          console.log('Unable to scan the 925 table. Error JSON: ', JSON.stringify(error));
          reject(error);
          return;
        }

        data.Items.forEach(item => item.table_name = '925');
        fetchedItems = fetchedItems.concat(data.Items);

        if (typeof data.LastEvaluatedKey != "undefined") {
          params['ExclusiveStartKey'] = data.LastEvaluatedKey;
          this.docClient.query(params, onScan);
        } else {
          resolve(fetchedItems);
        }
      };

      this.docClient.query(params, onScan);
    });
  }

  /**
   * Fetch uncompleted records from 940 table
   * @param project_id
   * @param timezone
   */
  private fetchUncompletedRecordsFromProjectStandardizationTable(project_id: string, timezone: string) {
    return new Promise((resolve, reject) => {
      let fetchedItems = [];
      const params = {
        TableName: '940ProjectStandardization',
        IndexName: 'project_id-index',
        KeyConditionExpression: '#project_id = :project_id',
        FilterExpression: 'not(contains(#process_status, :completed))',
        ExpressionAttributeNames: {
          '#project_id': 'project_id',
          '#process_status': 'process_status',
        },
        ExpressionAttributeValues: {
          ':completed': 'completed',
          ':project_id': project_id,
        },
      };

      const onScan = (error, data) => {
        if (error) {
          console.log('Unable to scan the 940 table. Error JSON: ', JSON.stringify(error));
          reject(error);
          return;
        }

        data.Items.forEach(item => item.table_name = '940');
        fetchedItems = fetchedItems.concat(data.Items);

        if (typeof data.LastEvaluatedKey != "undefined") {
          params['ExclusiveStartKey'] = data.LastEvaluatedKey;
          this.docClient.query(params, onScan);
        } else {
          resolve(fetchedItems);
        }
      };

      this.docClient.query(params, onScan);
    });
  }

  /**
   * Fetch uncompleted records from 9414 table
   * @param project_id
   * @param timezone
   */
  private fetchUncompletedRecordsFromComparisonDrawingTable(project_id: string, timezone: string) {
    return new Promise((resolve, reject) => {
      let fetchedItems = [];
      const params = {
        TableName: '9414CompareFiles',
        IndexName: 'project_id-index',
        KeyConditionExpression: '#project_id = :project_id',
        FilterExpression: '#process_status <> :completed',
        ExpressionAttributeNames: {
          '#project_id': 'project_id',
          '#process_status': 'process_status',
        },
        ExpressionAttributeValues: {
          ':completed': 'completed',
          ':project_id': project_id,
        },
      };

      const onScan = (error, data) => {
        if (error) {
          console.log('Unable to scan the 9414 table. Error JSON: ', JSON.stringify(error));
          reject(error);
          return;
        }

        data.Items.forEach(item => item.table_name = '9414');
        fetchedItems = fetchedItems.concat(data.Items);

        if (typeof data.LastEvaluatedKey != "undefined") {
          params['ExclusiveStartKey'] = data.LastEvaluatedKey;
          this.docClient.query(params, onScan);
        } else {
          resolve(fetchedItems);
        }
      };

      this.docClient.query(params, onScan);
    });
  }

  /**
   * Fetch uncompleted records from 964 table
   * @param project_id
   * @param timezone
   */
  private fetchUncompletedRecordsFromFilePublishTable(project_id: string, timezone: string) {
    return new Promise((resolve, reject) => {
      let fetchedItems = [];
      const params = {
        TableName: '964PublishFiles',
        IndexName: 'project_id-index',
        KeyConditionExpression: '#project_id = :project_id',
        FilterExpression: '#process_status <> :completed',
        ExpressionAttributeNames: {
          '#project_id': 'project_id',
          '#process_status': 'process_status',
        },
        ExpressionAttributeValues: {
          ':completed': 'completed',
          ':project_id': project_id,
        },
      };

      const onScan = (error, data) => {
        if (error) {
          console.log('Unable to scan the 964 table. Error JSON: ', JSON.stringify(error));
          reject(error);
          return;
        }

        data.Items.forEach(item => item.table_name = '964');
        fetchedItems = fetchedItems.concat(data.Items);

        if (typeof data.LastEvaluatedKey != "undefined") {
          params['ExclusiveStartKey'] = data.LastEvaluatedKey;
          this.docClient.query(params, onScan);
        } else {
          resolve(fetchedItems);
        }
      };

      this.docClient.query(params, onScan);
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

          const putParams = {
            TableName: '920ProjectRetrieval',
            Item: params,
          };

          this.docClient.put(putParams, (err, res) => {
            if (err) {
              console.log(err);
              reject(err);
            } else {
              resolve(res);
            }
          });
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
}
