# Approaches to handle some use cases

### API requests

Angular provides HttpClient for API requests. Use the following code snippet where you need to call API endpoint.
This returns an Observable so you need to subscribe to get values.

```
import { HttpClient, HttpParams } from "@angular/common/http";
import { generateFormData } from "../helpers/form-helper";

...
// Post Requests
this.http.post<ResponseType>(
  url,
  generateFormData(params)
);

// Get Requests
let params = new HttpParams();
params = params.append("parameter_name", parameter_value);

return this.http.get<ResponseType>(url, { params });
```

Ref. [`generateFormData`](/blob/master/src/app/analytics/helpers/form-helper.ts) makes a FormData from Object.

### Handling Observables

Subscription to Observables are not destroyed automatically, so we need to unsubscribe them when we need to close it.
For most of cases, the subscription inside a component is limited to the component's life cycle.
In that case, use the following code snippet:

```
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

...

destroy$: Subject<any> = new Subject();

...

observable.pipe(takeUntil(this.destroy$)).subscribe(v => {...});

...

ngOnDestroy(): void {
  this.destroy$.next();
  this.destroy$.complete();
}
```
