const isLocalHost = window.location.hostname === 'localhost';
const isHTTPS = window.location.protocol === 'https:';

const env = {
  apiBaseUrl: isHTTPS ? 'https://d2j583f0s18fa8.cloudfront.net' : 
  //'http://windowsserver-2131615750.us-east-1.elb.amazonaws.com/service/api',
//'http://localhost:51203/api/',
'http://elb01.bidretrieverqa.com/service/api',
  docViewerBaseUrl: 'http://br-viewer2.s3-website-us-east-1.amazonaws.com/',
  BR_ENVIRONMENT:'DEV',
  dropboxAPIDomain: 'https://api.dropboxapi.com',
  dropboxOAuthDomain: 'https://www.dropbox.com',
  dropboxOAuthPath: '/oauth2/authorize',
  dropboxTokenPath: '/oauth2/token',
  dropboxAppKey: 'pwz4k8x8jdij8hx',
  dropboxAppSecret: '20gd0jsucoplhqg',
  oauthRedirectURL: isLocalHost ? 'http://localhost:4200/customer-portal/system-settings/destination-system-settings' : 'https://ddw4o3hldard.cloudfront.net/customer-portal/system-settings/destination-system-settings',

  helpHeroAppId: 'puUCqzf21HE'
};
window.env = env;
