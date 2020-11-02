import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { AuthApi } from 'app/providers/auth.api.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { UserInfoApi } from 'app/customer-portal/system-settings/user-setup/user-setup.api.service';
import { NotificationsService } from 'angular2-notifications';
import * as uuid from 'uuid/v1';
import { ContactApi } from 'app/customer-portal/view-company/company-employees/company-employees.component.api.service';

@Component({
  selector: 'add-contact-modal',
  templateUrl: './add-contact-modal.component.html',
  styleUrls: ['./add-contact-modal.component.scss'],
  providers: [ContactApi]
})
export class AddContactModalComponent implements OnInit {
  @ViewChild('addContactModal', { static: true }) addContactModal: ElementRef;

  parent = null;
  email = '';
  firstName = '';
  lastName = '';
  phone='';
  contactId: any;
  company_id: any;
  companyName = '';
  required = true;
  userId = '';

  timer = null;

  constructor(
    private authApi: AuthApi,
    private contactApi: ContactApi,
    
    private spinner: NgxSpinnerService,
    private notificationService: NotificationsService
  ) { }

  ngOnInit() {
  }

  initialize(parent: any) {
    this.parent = parent;
    this.company_id = this.parent.companyId;
    this.companyName = this.parent.dataStore.currentCompany.company_name;
    this.addContactModal.nativeElement.style.display = 'block';
    
  }

  onSaveContact() {
    debugger
    this.contactId = uuid();
   
    this.spinner.show();


  
        const params: any = {
          contact_id: this.contactId,
          company_id: this.parent.dataStore.currentCompany.company_id,
          contact_email: this.email  ,
          contact_firstname: this.firstName,
          contact_lastname: this.lastName,
          contact_mobile_phone: this.phone,
          contact_display_name: `${this.firstName} ${this.lastName}`,   
          customer_id: this.parent.dataStore.currentCompany.customer_id,
        };

     this.contactApi.createContact(params)
     .then(_ => {
        this.parent.toolbarRefreshGridAction();

        this.spinner.hide();
        this.reset();
        this.addContactModal.nativeElement.style.display = 'none';
      }).catch(err => {
        this.spinner.hide();
        this.notificationService.error('Error', 'Failed to create user', { timeOut: 3000, showProgressBar: false });
      });
  
  }

  onCancel(event) {
    event.preventDefault();

    this.reset();
    this.addContactModal.nativeElement.style.display = 'none';
  }

  reset() {
    this.email = '';
    this.firstName = '';
    this.lastName = '';
    this.phone='';
    this.companyName = '';
    this.required = true;
    this.userId = '';
  }

}
