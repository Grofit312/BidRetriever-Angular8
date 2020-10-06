const isLocalHost = window.location.hostname === 'localhost';
const isHTTPS = window.location.protocol === 'https:';

const env = {
  apiBaseUrl: isHTTPS ? 'https://d2npcwzqeiosqf.cloudfront.net' : 'http://elb01.bidretrieverqa.com/service/api',
  //apiBaseUrl: isHTTPS ? 'https://d2j583f0s18fa8.cloudfront.net' : 'http://localhost:51203/api',
  // apiBaseUrls: isHTTPS ? 'https://d2j583f0s18fa8.cloudfront.net' : 'http://3.87.236.229/wip-api',
  docViewerBaseUrl: 'http://viewer2.bidretrieverqa.com/',
  projectPublishTableName: '960ProjectPublish',
  filePreprocessingTableName: '925FilePreprocessing',
  BR_ENVIRONMENT:'QA',
  dropboxAPIDomain: 'https://api.dropboxapi.com',
  dropboxOAuthDomain: 'https://www.dropbox.com',
  dropboxOAuthPath: '/oauth2/authorize',
  dropboxTokenPath: '/oauth2/token',
  dropboxAppKey: 'pwz4k8x8jdij8hx',
  dropboxAppSecret: '20gd0jsucoplhqg',
  oauthRedirectURL: isLocalHost ? 'http://localhost:4200/customer-portal/system-settings/destination-system-settings' : 'https://customerportal.bidretrieverqa.com/customer-portal/system-settings/destination-system-settings',

  helpHeroAppId: 'puUCqzf21HE'
};
window.env = env;
