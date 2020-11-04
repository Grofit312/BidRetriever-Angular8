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
  
  mobilePhone = '';
  phone = '';
  contact_title = '';
  contact_address1 = '';
  contact_address2 = '';
  contact_city = '';
  contact_state = '';
  contact_zip = '';
  
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
    const company = this.parent.dataStore.currentCompany;
    this.company_id =  company.company_id;
    this.companyName = company.company_name;
    this.contact_address1 = company.company_address1;
    this.contact_address2 = company.company_address2;
    this.contact_city = company.company_city;
    this.contact_state = company.company_state;
    this.contact_zip = company.company_zip;
    this.addContactModal.nativeElement.style.display = 'block';
  }

  onSaveContact() {
    
    this.contactId = uuid();
   
    this.spinner.show();


  
        const params: any = {
          contact_id: this.contactId,
          company_id: this.parent.dataStore.currentCompany.company_id,
          contact_email: this.email  ,
          contact_firstname: this.firstName,
          contact_lastname: this.lastName,
          contact_mobile_phone: this.mobilePhone,
          contact_display_name: `${this.firstName} ${this.lastName}`,
          customer_id: this.parent.dataStore.currentCompany.customer_id,
          contact_phone: this.phone,
          contact_title: this.contact_title,
          contact_address1: this.contact_address1,
          contact_address2: this.contact_address2,
          contact_city: this.contact_city,
          contact_state: this.contact_state,
          contact_zip: this.contact_zip,

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
    this.mobilePhone = '';
    this.companyName = '';
    this.required = true;
    this.userId = '';
    this.phone = '';
    this.contact_title = '';
    this.contact_address1 = '';
    this.contact_address2 = '';
    this.contact_city = '';
    this.contact_state = '';
    this.contact_zip = '';
  }

}
