# CustomerPortal
Customer Portal Page (Eduard)

### Configuration
`src/env.js`
- API endpoint
- Stripe publishable key
- Dropbox api path, client info, redirect uri

Environment variables are fetched at loading time and imported as properties of `window` object, so no need to re-build/deploy the whole app when env variables are updated.  Only updating the `env.js` would work.

### Deployment
- Run `npm install` from the cloned repository
- Replace the node_modules/mailparser directory with the one zipped inside the repository (mailparser.zip). (This involves some bug fixing)
- Run `ng build --environment=prod --sourcemap=true --output-hashing=all` to generate build files
- Upload files under `/dist` to S3 bucket (with public access/web hosting enabled)

### Configure S3 bucket
Reference guide [here](https://github.com/BidRetriever/Documentation/blob/master/S3%20Configuration.md)

### HTTP/HTTPS
In QA/Prod environments, all web front-ends and back-end services require HTTPS setup. Especially the customer portal app needs HTTPS setup because Dropbox login only works for HTTPS domains. 

- Setup HTTPS for the customer portal app.
- Add the full url of customer portal's destination settings page to the redirect uri list of dropbox app.
- Setup HTTPS for the API endpoint. (This is necessary because most of browsers block HTTP request from HTTPS origin. The back-end service needs to be served through HTTPS)
- Update the `env.js`

### Build Errors
```
ERROR in Error encountered resolving symbol values statically. Calling function 'InjectionToken', function calls are not supported.
```
To resolve this issue, replace `InjectionToken` function call with the `OpaqueToken` (same parameters) under the `node_modules/ngx-stripe` directory.
```
Module build failed: Error: ENOENT: no such file or directory, scandir '...\node_modules\node-sass\vendor'
```
To resolve this issue, run `npm install node-sass@4.11.0` and then try build again.

### Developer Console Warnings
Remove Source Map Comment at the Bottom on These Files
```
node_modules/bootstrap/dist/css/bootstrap.min.css
node_modules/bootstrap/dist/js/bootstrap.min.js
```
