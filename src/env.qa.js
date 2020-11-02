const isLocalHost = window.location.hostname === 'localhost';
const isHTTPS = window.location.protocol === 'https:';

const env = {
  apiBaseUrl: isHTTPS ? 'https://d2npcwzqeiosqf.cloudfront.net' : 'http://elb01.bidretrieverqa.com/service/api',
  docViewerBaseUrl: 'http://viewer2.bidretrieverqa.com/',
  BR_ENVIRONMENT:'QA',
  dropboxAPIDomain: 'https://api.dropboxapi.com',
  dropboxOAuthDomain: 'https://www.dropbox.com',
  dropboxOAuthPath: '/oauth2/authorize',
  dropboxTokenPath: '/oauth2/token',
  dropboxAppKey: 'pwz4k8x8jdij8hx',
  dropboxAppSecret: '20gd0jsucoplhqg',
  oauthRedirectURL: isLocalHost ? 'http://localhost:4200/customer-portal/system-settings/destination-system-settings' : 'https://customerportala8.bidretrieverqa.com/customer-portal/system-settings/destination-system-settings',

  helpHeroAppId: 'puUCqzf21HE'
};
window.env = env;
