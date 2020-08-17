import {
  Injectable
} from '@angular/core';
import { Subject } from 'rxjs/Subject';

@Injectable()
export class DataStore {
  public originUserId = '';
  public originUserEmail = '';
  public originUserRole = 'user';
  public currentUser: any = null;
  public currentCustomer: any = null;

  public currentProject: any = null;
  public currentCompany: any = null;

  public authenticationState = new Subject<boolean>();
  public getProjectState = new Subject<boolean>();
  public getCompanyState = new Subject<boolean>();

  public showPortalHeader = true;

  get isSharedProject() {
    if (this.currentUser && this.currentProject) {
      if (this.isBidRetrieverUser) {
        return false;
      }

      if (this.currentUser['customer_id'] !== this.currentProject['customer_id']) {
        return true;
      }

      return false;
    }

    return false;
  }

  get isBidRetrieverUser() {
    return this.originUserEmail.toLowerCase().includes('bidretriever.net');
  }

  constructor () {
    this.authenticationState.next(false);
    this.getProjectState.next(false);
    this.getCompanyState.next(false);
  }
}
