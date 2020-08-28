const isLocalHost = window.location.hostname === 'localhost';
const isHTTPS = window.location.protocol === 'https:';

const env = {
  apiBaseUrl: isHTTPS ? 'https://d2j583f0s18fa8.cloudfront.net' : 'http://windowsserver-2131615750.us-east-1.elb.amazonaws.com/service/api',
  //apiBaseUrl: isHTTPS ? 'https://d2j583f0s18fa8.cloudfront.net' : 'http://localhost:51203/api',
  // apiBaseUrls: isHTTPS ? 'https://d2j583f0s18fa8.cloudfront.net' : 'http://3.87.236.229/wip-api',
  docViewerBaseUrl: 'http://br-viewer2.s3-website-us-east-1.amazonaws.com/',
  projectPublishTableName: '960ProjectPublish',
  filePreprocessingTableName: '925FilePreprocessing',
  BR_ENVIRONMENT:'DEV',
  dropboxAPIDomain: 'https://api.dropboxapi.com',
  dropboxOAuthDomain: 'https://www.dropbox.com',
  dropboxOAuthPath: '/oauth2/authorize',
  dropboxTokenPath: '/oauth2/token',
  dropboxAppKey: 'pwz4k8x8jdij8hx',
  dropboxAppSecret: '20gd0jsucoplhqg',
  oauthRedirectURL: isLocalHost ? 'http://localhost:4200/customer-portal/system-settings/destination-system-settings' : 'https://ddw4o3hldard.cloudfront.net/customer-portal/system-settings/destination-system-settings',

  pdfLicenseSN: 'incsJSAzR5/eg9F1OP7WbPUKVshzMAfIAfUUhQoEKXhMb4Adhhwr9w==',
  pdfLicenseKey: 'PjzsmDRQMS6sbxtUBTkWC1QQl/6FZP5vQrQwKFne9B2bRKrzLRTlURgauJUcZVjtzo0mlFduYWKqRMvYD97aUMdo68te/WthaZC/Ps4YbmXQSFHeImij/yxB11tKmamKUbXzBY3n+QY7y2eD09OADxCEbo9/lbM6e7MJCgrX9MBgtiQCJ3voaztkQvhH2ah0UbnTDxbzTQYeh7Y9sMpDjdzEcGWlyTPAn2aTRTHrVTVk298LNla9Qmf3LwDzB5eilBSaRydSLD0lvFWAMaTgz4161jvaZMgoctH4JRGlkqfqC/txtfHuMhye0JMUSPEZe/9tBucFZRa9NyMSsBP7E8Ypt1DjygBtnwVHCZIdOTWphsVB2SU5upb3bCAKzJBtxB6ratdbH72LctMOqi36BmI07RY1NEIAXPMKcZd0e6IJ3AzNhtgdLbItP8coohuj+YvIgv+q4yTZw81thl3UqNixewthOVeK4TpHmt1A7yXdT79QZUgulRZaBF+NMBujvkPNvYUJoanfUJQ9oR9TvIUmd4/aTFUj9kw/ardvGngHfMvjJIsicHc4v+eb3xK0qZ658W3svQfgVbwETXwV2l4vqFHk0gpwS+/4LtnHtsb3ngx1PTJqdxO9y+q6Q2+wRrOzbfi2u+Zor8AdKzh1gLwA9QvSxpeYcRP7DexLV9gLNtXmVYw/yuk5q5n2akZLg3ghml7WNGsOQU9D9fsgYNR10YCvwz4g0+ANov0sar2F7o0LDa5cfJqJoBJCLIy4b0w8TlAOH07+HGlMX40RJhmctfb+0XtAh7d/2GFjYY3r070BtizD5GrU0jP5pVjqhRhO//1icXpdPAWByUHFsqp6XFlzAnraHOhfX8ATrFe5+N6NtbGQMag3k8CstwtfXI9OnorZfOGVGwh2HMtVtOcyhcFGEfqQ8qypHp8tFTVp8MUZx85e14J9kdHZYiy5d/pQTY3AmEj3Rt2/ZKcWyTKZXio96WRvIJHEH4OHcLs7nFdlhiMEA6z9FOEPY7A/JkUGJLvwgBab/UqwG4XWp29GJWYDyioIpV4Us9FjapvuDxN3naKh5jt+BzsZBbfNExgSNmI05GGph5qsrN2GQRyjlRTFGU6QC4RpJWJQtkE0kCNQJvWwLd18bs2oTMqd7t2iq3fPXOpdxfeiBT0d7zMSyBzCZS1shKasVwLVNkrtZktDfhTnyoabCABa45DIPzzbZtC3eglRGYZpFLg3gkRJNDtyynFYa96+NC6on/x4kF0zYuSzvd7qtI44nia31g/zZA82tPDFDHclyw==',

  helpHeroAppId: 'puUCqzf21HE'
};
window.env = env;
